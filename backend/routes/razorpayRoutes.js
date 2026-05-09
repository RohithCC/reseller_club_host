// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/razorpayRoutes.js
//
// THREE ENDPOINTS:
//   POST /api/orders/razorpay/create   → create Razorpay order
//   POST /api/orders/razorpay/verify   → verify payment signature + save order
//   POST /api/orders/razorpay/webhook  → Razorpay server-to-server event hook
//
// SECURITY MODEL:
//   1. createRazorpayOrder  — amount is recomputed from DB/cart on the server.
//      Client-supplied amount is IGNORED. This prevents amount tampering.
//   2. verifyRazorpayPayment — HMAC-SHA256 over (order_id + "|" + payment_id)
//      using RAZORPAY_KEY_SECRET. If signature doesn't match → 400, order NOT saved.
//   3. Webhook — X-Razorpay-Signature validated with HMAC-SHA256 over raw body
//      using RAZORPAY_WEBHOOK_SECRET (different from API secret). Raw body is
//      preserved via express.raw() — never JSON.parse before verifying.
//   4. Idempotency  — webhook events are deduplicated via a processed-set /
//      DB field so replayed events don't double-fulfill orders.
//   5. Amount cross-check — webhook handler verifies the amount in the event
//      matches what the DB says the order should cost (in paise).
// ─────────────────────────────────────────────────────────────────────────────

import express        from "express";
import Razorpay       from "razorpay";
import crypto         from "crypto";
import Order          from "../models/Order.js";       // your Mongoose model
import { protect }    from "../middleware/authMiddleware.js"; // JWT guard

const router = express.Router();

// ── Razorpay client (server-side only, secret never sent to browser) ─────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE RAZORPAY ORDER
//    POST /api/orders/razorpay/create
//    Auth: required (protect middleware)
//
//    We recompute the order total on the server from the submitted items so
//    the client can't pass a tampered amount.  If you store cart server-side,
//    use that instead.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/razorpay/create", protect, async (req, res) => {
  try {
    const { items, couponCode, deliveryCharge } = req.body;

    // ── Server-side price recomputation ──────────────────────────────────
    // Replace this with your actual DB product lookup + GST calculation.
    // NEVER trust the client-supplied `amount` for the actual charge.
    const serverTotal = await recomputeOrderTotal(items, couponCode, deliveryCharge);

    if (serverTotal < 1) {
      return res.status(400).json({ message: "Order total must be at least ₹1." });
    }

    const amountInPaise = Math.round(serverTotal * 100); // Razorpay works in paise

    const rzpOrder = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: "INR",
      receipt:  `rcpt_${Date.now()}_${req.user._id}`,
      notes: {
        userId:    req.user._id.toString(),
        coupon:    couponCode ?? "",
      },
    });

    // Return only what the frontend needs — never expose key_secret
    res.status(201).json({
      id:       rzpOrder.id,
      amount:   rzpOrder.amount,   // paise
      currency: rzpOrder.currency,
    });
  } catch (err) {
    console.error("[RZP] Create order error:", err);
    res.status(500).json({ message: "Failed to create payment order. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. VERIFY PAYMENT SIGNATURE + SAVE ORDER
//    POST /api/orders/razorpay/verify
//    Auth: required
//
//    Razorpay returns three tokens after a successful payment:
//      razorpay_payment_id, razorpay_order_id, razorpay_signature
//
//    We reconstruct the expected HMAC-SHA256 signature and compare it to
//    what Razorpay sent.  Only if they match do we save the order.
//
//    Reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#verify-payment-signature
// ─────────────────────────────────────────────────────────────────────────────
router.post("/razorpay/verify", protect, async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderDetails,
    } = req.body;

    // ── Guard: all three tokens must be present ───────────────────────────
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification tokens." });
    }

    // ── HMAC-SHA256 verification ──────────────────────────────────────────
    // The signed body is: "<razorpay_order_id>|<razorpay_payment_id>"
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Use timingSafeEqual to prevent timing attacks
    const sigBuffer      = Buffer.from(razorpay_signature,  "hex");
    const expectedBuffer = Buffer.from(expectedSignature,   "hex");

    const isValid =
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isValid) {
      console.warn("[RZP] Signature mismatch — possible tampering!", {
        user:      req.user._id,
        orderId:   razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      return res.status(400).json({ message: "Payment verification failed. Signature mismatch." });
    }

    // ── Signature OK — fetch payment details from Razorpay to double-check amount ──
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured") {
      return res.status(400).json({ message: "Payment not captured yet. Please contact support." });
    }

    // ── Cross-check captured amount vs server-recomputed total ───────────
    const serverTotal       = await recomputeOrderTotal(
      orderDetails.items,
      orderDetails.couponCode,
      orderDetails.deliveryCharge,
    );
    const expectedPaise     = Math.round(serverTotal * 100);
    const capturedPaise     = payment.amount; // paise

    if (capturedPaise < expectedPaise) {
      console.error("[RZP] Amount mismatch!", { capturedPaise, expectedPaise });
      // Do NOT fulfil — log for manual review
      return res.status(400).json({
        message: "Payment amount does not match order total. Please contact support.",
      });
    }

    // ── Idempotency: check if order already saved for this payment ────────
    const existing = await Order.findOne({ paymentId: razorpay_payment_id });
    if (existing) {
      return res.status(200).json({ success: true, orderId: existing._id, paymentId: razorpay_payment_id });
    }

    // ── Save order to DB ──────────────────────────────────────────────────
    const order = await Order.create({
      user:          req.user._id,
      items:         orderDetails.items,
      billing:       orderDetails.billing,
      grandTotal:    serverTotal,              // always use server-computed value
      deliveryCharge: orderDetails.deliveryCharge,
      totalGst:      orderDetails.totalGst,
      couponCode:    orderDetails.couponCode  ?? null,
      couponDiscount: orderDetails.couponDiscount ?? 0,
      paymentMethod:  "razorpay",
      paymentId:     razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      status:        "confirmed",
      paidAt:        new Date(),
    });

    res.status(201).json({
      success:   true,
      orderId:   order._id,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error("[RZP] Verify error:", err);
    res.status(500).json({ message: "Order verification failed. Please contact support." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. RAZORPAY WEBHOOK
//    POST /api/orders/razorpay/webhook
//    Auth: NO JWT — Razorpay's server calls this, not the browser.
//          Authentication is done via X-Razorpay-Signature header.
//
//    IMPORTANT: This route must receive the RAW body (Buffer), not parsed JSON.
//    In your main app.js, mount this BEFORE express.json():
//
//      app.use("/api/orders/razorpay/webhook",
//        express.raw({ type: "application/json" }),
//        razorpayRoutes   // or the specific webhook handler
//      );
//      app.use(express.json());   ← comes after
//
//    Alternatively, use express.raw() inline as shown below.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),   // preserve raw bytes for HMAC
  async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).json({ message: "Missing webhook signature." });
    }

    // ── Verify webhook signature ──────────────────────────────────────────
    // Use RAZORPAY_WEBHOOK_SECRET — set this in Razorpay Dashboard → Webhooks.
    // It is DIFFERENT from the API key secret.
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)          // req.body is a Buffer here (raw bytes)
      .digest("hex");

    const sigBuf = Buffer.from(signature,    "hex");
    const expBuf = Buffer.from(expectedSig,  "hex");

    const isValid =
      sigBuf.length === expBuf.length &&
      crypto.timingSafeEqual(sigBuf, expBuf);

    if (!isValid) {
      console.warn("[WEBHOOK] Invalid signature — rejecting event.");
      return res.status(400).json({ message: "Invalid webhook signature." });
    }

    // ── Parse event payload (only after signature is verified) ────────────
    let event;
    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({ message: "Malformed webhook payload." });
    }

    const eventId = event.event_id ?? event.id;

    // ── Idempotency: skip already-processed events ────────────────────────
    // Replace with a DB lookup if you want persistent deduplication.
    if (processedWebhookEvents.has(eventId)) {
      console.log("[WEBHOOK] Duplicate event ignored:", eventId);
      return res.status(200).json({ status: "already_processed" });
    }
    processedWebhookEvents.add(eventId);
    // In production: store eventId in DB with a TTL index instead of a Set.

    // ── Handle specific events ────────────────────────────────────────────
    try {
      switch (event.event) {

        // payment.captured — primary fulfilment trigger
        case "payment.captured": {
          const payment = event.payload.payment.entity;
          await handlePaymentCaptured(payment);
          break;
        }

        // payment.failed — notify user / revert stock reservation
        case "payment.failed": {
          const payment = event.payload.payment.entity;
          await handlePaymentFailed(payment);
          break;
        }

        // refund.processed — mark order refunded in DB
        case "refund.processed": {
          const refund = event.payload.refund.entity;
          await handleRefundProcessed(refund);
          break;
        }

        default:
          // Acknowledge unknown events so Razorpay doesn't retry them
          console.log("[WEBHOOK] Unhandled event type:", event.event);
      }
    } catch (err) {
      console.error("[WEBHOOK] Handler error:", err);
      // Return 200 to prevent Razorpay retrying — log for manual review
      return res.status(200).json({ status: "handler_error_logged" });
    }

    res.status(200).json({ status: "ok" });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// COD ORDER
// POST /api/orders/cod
// ─────────────────────────────────────────────────────────────────────────────
router.post("/cod", protect, async (req, res) => {
  try {
    const { items, billing, couponCode, deliveryCharge, totalGst, couponDiscount } = req.body;

    const serverTotal = await recomputeOrderTotal(items, couponCode, deliveryCharge);
    if (serverTotal < COD_MINIMUM_SERVER) {
      return res.status(400).json({
        message: `COD requires a minimum order of ₹${COD_MINIMUM_SERVER}.`,
      });
    }

    const order = await Order.create({
      user:           req.user._id,
      items,
      billing,
      grandTotal:     serverTotal,
      deliveryCharge: deliveryCharge ?? 0,
      totalGst:       totalGst       ?? 0,
      couponCode:     couponCode     ?? null,
      couponDiscount: couponDiscount ?? 0,
      paymentMethod:  "cod",
      status:         "pending",
    });

    res.status(201).json({
      success:  true,
      orderId:  order._id,
    });
  } catch (err) {
    console.error("[COD] Error:", err);
    res.status(500).json({ message: "Failed to place order. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const COD_MINIMUM_SERVER      = 199;
const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_CHARGE         = 49;
const DEFAULT_GST_RATE        = 18;

// In-memory dedup set — replace with DB in production
const processedWebhookEvents = new Set();

/**
 * Recompute the order total server-side.
 * Replace this stub with your actual product DB lookup + GST calculation.
 * The frontend-supplied prices must NEVER be trusted for the final charge.
 */
async function recomputeOrderTotal(items = [], couponCode = null, clientDeliveryCharge = null) {
  // ── 1. Fetch authoritative prices from DB ─────────────────────────────
  // const productIds = items.map(i => i.productId ?? i.id);
  // const dbProducts = await Product.find({ _id: { $in: productIds } });
  // ... compute subtotal from dbProducts ...

  // ── STUB: uses client-supplied prices (replace in production) ─────────
  const subtotal = items.reduce((sum, item) => {
    const basePrice  = item.basePrice  ?? (item.price / (1 + DEFAULT_GST_RATE / 100));
    const priceWithGst = basePrice * (1 + DEFAULT_GST_RATE / 100);
    return sum + priceWithGst * (item.quantity ?? item.qty ?? 1);
  }, 0);

  // ── 2. Coupon validation (look up from DB, don't trust client value) ──
  let discount = 0;
  if (couponCode) {
    // const coupon = await Coupon.findOne({ code: couponCode, active: true });
    // if (coupon) { discount = computeDiscount(coupon, subtotal); }
  }

  // ── 3. Delivery ───────────────────────────────────────────────────────
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;

  return Math.max(subtotal + delivery - discount, 0);
}

async function handlePaymentCaptured(payment) {
  const order = await Order.findOne({ razorpayOrderId: payment.order_id });
  if (!order) {
    console.warn("[WEBHOOK] No order found for razorpay order:", payment.order_id);
    return;
  }

  // Cross-check amount (webhook is the source of truth)
  const expectedPaise = Math.round(order.grandTotal * 100);
  if (payment.amount < expectedPaise) {
    console.error("[WEBHOOK] Captured amount less than expected!", {
      captured:  payment.amount,
      expected:  expectedPaise,
      orderId:   order._id,
    });
    // Flag for manual review — do NOT fulfil
    await Order.findByIdAndUpdate(order._id, { status: "amount_mismatch" });
    return;
  }

  await Order.findByIdAndUpdate(order._id, {
    status:    "confirmed",
    paymentId: payment.id,
    paidAt:    new Date(payment.created_at * 1000),
  });

  console.log("[WEBHOOK] Order confirmed via webhook:", order._id);
  // TODO: send confirmation email, trigger inventory deduction, etc.
}

async function handlePaymentFailed(payment) {
  await Order.findOneAndUpdate(
    { razorpayOrderId: payment.order_id },
    { status: "payment_failed" },
  );
  console.log("[WEBHOOK] Payment failed for order:", payment.order_id);
  // TODO: notify user, release stock reservation
}

async function handleRefundProcessed(refund) {
  await Order.findOneAndUpdate(
    { paymentId: refund.payment_id },
    { status: "refunded", refundId: refund.id, refundedAt: new Date() },
  );
  console.log("[WEBHOOK] Refund processed:", refund.id);
}

export default router;


// ─────────────────────────────────────────────────────────────────────────────
// HOW TO MOUNT IN app.js / server.js
// ─────────────────────────────────────────────────────────────────────────────
/*
import express          from "express";
import razorpayRoutes   from "./routes/razorpayRoutes.js";
import orderRoutes      from "./routes/orderRoutes.js";

const app = express();

// ⚠️ CRITICAL: webhook route must receive RAW body BEFORE express.json() parses it.
// The route handler uses its own express.raw() inline, so this just mounts it first:
app.use("/api/orders", razorpayRoutes);

// All other routes use JSON body parser
app.use(express.json());
app.use("/api/orders", orderRoutes);

export default app;
*/


// ─────────────────────────────────────────────────────────────────────────────
// REQUIRED ENVIRONMENT VARIABLES (.env)
// ─────────────────────────────────────────────────────────────────────────────
/*
# Razorpay API credentials (server-side only, never expose to client)
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Separate secret set in Razorpay Dashboard → Settings → Webhooks
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Frontend (Vite) — only the KEY ID is safe to expose, never the secret
VITE_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX
*/