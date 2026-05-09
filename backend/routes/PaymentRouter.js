// backend/routes/PaymentRouter.js
import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/Order.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// ─────────────────────────────────────────────────────────────────────────────
router.post("/create-order", userAuth, async (req, res) => {
  try {
    const userId = req.userId || null;                        // ← from req, not req.body
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order amount" });
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount:  amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    return res.status(200).json({
      success:  true,
      id:       razorpayOrder.id,
      amount:   razorpayOrder.amount,   // paise — pass directly to frontend
      currency: razorpayOrder.currency,
      receipt:  razorpayOrder.receipt,
    });
  } catch (err) {
    console.error("[payment/create-order]", err);
    return res.status(500).json({
      success: false,
      message: err?.error?.description || "Failed to create Razorpay order",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
//
// ROOT CAUSE FIX:
//   userAuth NOW injects req.userId directly (fixed middleware — works for GET too).
//   If the frontend sends:
//     { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderDetails: {...} }
//   userAuth mutates it to:
//     { userId: "...", razorpay_payment_id, ... orderDetails: {...} }
//
//   This is fine as long as we read body fields AFTER userAuth runs (which we do).
//   The real issue is usually one of:
//     1. orderDetails.items has productId missing (Order model requires it)
//     2. orderDetails.billing has required fields missing
//     3. Mongoose validation error on save
//
//   This version adds full console.error logging so you can see the exact error.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/verify", userAuth, async (req, res) => {
  try {
    // ── Step 0: Get userId from req (fixed userAuth injects into req, not req.body) ──
    const userId = req.userId || null;

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderDetails,
    } = req.body;

    // ── Step 1: Validate Razorpay fields ─────────────────────────────────────
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment fields",
      });
    }

    // ── Step 2: Validate orderDetails ────────────────────────────────────────
    if (!orderDetails) {
      return res.status(400).json({
        success: false,
        message: "orderDetails missing from request body",
      });
    }

    const { items, billing, grandTotal, deliveryCharge } = orderDetails;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "orderDetails.items is empty or missing" });
    }
    if (!billing || !billing.firstName || !billing.address) {
      return res.status(400).json({ success: false, message: "orderDetails.billing is incomplete" });
    }
    if (!grandTotal || isNaN(grandTotal)) {
      return res.status(400).json({ success: false, message: "orderDetails.grandTotal is missing" });
    }

    // ── Step 3: Verify HMAC-SHA256 signature ──────────────────────────────────
    const signBody   = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected   = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signBody)
      .digest("hex");

    if (expected !== razorpay_signature) {
      console.warn("[payment/verify] Signature mismatch — possible tampered request");
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature — verification failed",
      });
    }

    // ── Step 4: Duplicate payment guard ──────────────────────────────────────
    const duplicate = await Order.findOne({
      "payment.razorpayPaymentId": razorpay_payment_id,
    });
    if (duplicate) {
      console.log("[payment/verify] Duplicate payment, returning existing order:", duplicate.orderNumber);
      return res.status(200).json({
        success: true,
        orderId: duplicate.orderNumber,
        message: "Order already recorded",
      });
    }

    // ── Step 5: Normalize items — ensure productId exists ────────────────────
    // Your cartSlice stores items with { id, name, price, mrp, quantity, image, subcat }
    // but the Order model requires productId. Map id → productId here.
    const normalizedItems = items.map((item) => ({
      productId: item.productId || item.id || item._id || "unknown",
      name:      item.name      || "Product",
      image:     item.image     || "",
      price:     Number(item.price)    || 0,
      mrp:       Number(item.mrp || item.price) || 0,
      quantity:  Number(item.quantity) || 1,
      subcat:    item.subcat    || "",
    }));

    const subtotal = normalizedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const mrpTotal = normalizedItems.reduce((s, i) => s + i.mrp    * i.quantity, 0);

    // ── Step 6: Save order to MongoDB ─────────────────────────────────────────
    const order = new Order({
      userId,
      items:   normalizedItems,
      billing: {
        firstName:  billing.firstName  || "",
        lastName:   billing.lastName   || "",
        email:      billing.email      || "",
        phone:      billing.phone      || "",
        address:    billing.address    || "",
        apartment:  billing.apartment  || "",
        city:       billing.city       || "",
        state:      billing.state      || "",
        pincode:    billing.pincode    || "",
        country:    billing.country    || "India",
        orderNotes: billing.orderNotes || "",
      },
      payment: {
        method:             "razorpay",
        razorpayOrderId:    razorpay_order_id,
        razorpayPaymentId:  razorpay_payment_id,
        razorpaySignature:  razorpay_signature,
        status:             "paid",
        paidAt:             new Date(),
      },
      subtotal,
      deliveryCharge: Number(deliveryCharge) || 0,
      grandTotal:     Number(grandTotal),
      savedAmount:    Math.max(0, mrpTotal - subtotal),
      status:         "confirmed",
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await order.save();

    console.log("[payment/verify] Order saved:", order.orderNumber);

    return res.status(200).json({
      success: true,
      orderId: order.orderNumber,
      message: "Payment verified and order placed successfully",
    });

  } catch (err) {
    // ── Full error log — check your terminal for the REAL cause ──────────────
    console.error("[payment/verify] FULL ERROR:", err);
    console.error("[payment/verify] Error name:", err.name);
    console.error("[payment/verify] Error message:", err.message);
    if (err.errors) {
      // Mongoose validation error — logs exactly which field failed
      Object.keys(err.errors).forEach((field) => {
        console.error(`[payment/verify] Validation failed on field "${field}":`, err.errors[field].message);
      });
    }

    return res.status(500).json({
      success: false,
      message: "Order save failed after payment. Contact support.",
      // In development, expose the real error so you can fix it fast
      ...(process.env.NODE_ENV !== "production" && {
        debug: {
          error:            err.message,
          validationErrors: err.errors
            ? Object.keys(err.errors).map((f) => ({ field: f, msg: err.errors[f].message }))
            : undefined,
        },
      }),
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/webhook
// Register BEFORE express.json() in server.js — needs raw body
// ─────────────────────────────────────────────────────────────────────────────
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSig   = req.headers["x-razorpay-signature"];
    const rawBody       = req.body.toString();

    if (webhookSecret) {
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");
      if (expectedSig !== receivedSig) {
        return res.status(400).json({ success: false, message: "Invalid webhook signature" });
      }
    }

    const event   = JSON.parse(rawBody);
    const payload = event.payload?.payment?.entity;
    if (!payload) return res.status(200).json({ received: true });

    switch (event.event) {
      case "payment.captured":
        await Order.findOneAndUpdate(
          { "payment.razorpayPaymentId": payload.id },
          { "payment.status": "paid", status: "confirmed" }
        );
        break;
      case "payment.failed":
        await Order.findOneAndUpdate(
          { "payment.razorpayOrderId": payload.order_id },
          { "payment.status": "failed" }
        );
        break;
      case "refund.processed":
        await Order.findOneAndUpdate(
          { "payment.razorpayPaymentId": payload.payment_id },
          { "payment.status": "refunded", status: "refunded" }
        );
        break;
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[webhook]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
