// backend/routes/razorpayOrders.js
// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY ORDER ROUTES
//
//  POST /api/orders/razorpay/create  — creates a Razorpay order server-side
//  POST /api/orders/razorpay/verify  — verifies HMAC-SHA256 signature & saves order
//  POST /api/orders/cod              — places a Cash on Delivery order
//
// Mount in app.js:
//   app.use("/api/orders", require("./routes/razorpayOrders"));
//
// Env vars required:
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET
// ─────────────────────────────────────────────────────────────────────────────

const express  = require("express");
const crypto   = require("crypto");
const Razorpay = require("razorpay");
const router   = express.Router();

// Adjust import paths to your project structure
const Order    = require("../models/Order");
const authMiddleware = require("../middleware/auth"); // optional but recommended

const rzp = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error(
    "[razorpayOrders] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET env variable is not set."
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/razorpay/create
// Creates a Razorpay order and returns { id, amount (paise), currency }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/razorpay/create", authMiddleware, async (req, res) => {
  const { amount } = req.body; // amount in ₹ (float)

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Invalid order amount." });
  }

  const amountInPaise = Math.round(amount * 100); // Razorpay needs paise (integer)

  try {
    const order = await rzp.orders.create({
      amount:          amountInPaise,
      currency:        "INR",
      receipt:         `rcpt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment on success
    });

    // Optionally save a "pending" order record in DB here for reconciliation
    // await Order.create({ razorpayOrderId: order.id, userId: req.user?.id, status: "pending", amount });

    return res.status(200).json({
      id:       order.id,
      amount:   order.amount,   // paise
      currency: order.currency,
    });
  } catch (err) {
    console.error("[razorpay/create] Error:", err?.error ?? err.message);
    return res.status(500).json({
      message: err?.error?.description ?? "Failed to create Razorpay order.",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/razorpay/verify
//
// SECURITY CRITICAL:
// This is the ONLY place where HMAC-SHA256 verification happens.
// The signature is: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id)
// using RAZORPAY_KEY_SECRET as the key.
//
// A valid signature proves:
//  - The payment was made on Razorpay's servers (only they know the key secret)
//  - The payment_id and order_id were not tampered with in transit
//  - The payment was for THIS specific order (order_id ties it to our record)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/razorpay/verify", authMiddleware, async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    orderDetails,
  } = req.body;

  // 1. Input validation
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing payment verification tokens." });
  }

  // 2. Compute expected signature
  //    Razorpay spec: HMAC-SHA256( razorpay_order_id + "|" + razorpay_payment_id )
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // 3. Constant-time comparison — prevents timing attacks
  let signaturesMatch = false;
  try {
    signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(razorpay_signature, "utf8"),
      Buffer.from(expectedSig,        "utf8")
    );
  } catch {
    // Buffers of different length throw — that means mismatch
    signaturesMatch = false;
  }

  if (!signaturesMatch) {
    console.error(
      `[razorpay/verify] ⚠️  Signature MISMATCH for orderId: ${razorpay_order_id}. ` +
      "Possible payment tampering."
    );
    return res.status(400).json({ message: "Payment signature verification failed." });
  }

  // 4. Signature verified — safe to fulfil the order
  try {
    // Idempotency: check if this payment was already processed
    const existingOrder = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existingOrder) {
      console.info(`[razorpay/verify] Duplicate verify call for paymentId: ${razorpay_payment_id}`);
      return res.status(200).json({
        success:   true,
        orderId:   existingOrder._id.toString(),
        paymentId: razorpay_payment_id,
        message:   "Order already confirmed.",
      });
    }

    // 5. Fetch payment details from Razorpay API to double-check amount
    //    (prevents "pay ₹1 for ₹10,000 order" attacks)
    const rzpPayment = await rzp.payments.fetch(razorpay_payment_id);

    if (rzpPayment.status !== "captured") {
      console.error(
        `[razorpay/verify] Payment ${razorpay_payment_id} status is "${rzpPayment.status}", not "captured".`
      );
      return res.status(400).json({ message: "Payment was not captured successfully." });
    }

    // 6. Verify amount matches what we expect (within 1 paise tolerance for rounding)
    const expectedAmountPaise = Math.round((orderDetails?.grandTotal ?? 0) * 100);
    if (Math.abs(rzpPayment.amount - expectedAmountPaise) > 1) {
      console.error(
        `[razorpay/verify] Amount mismatch! Expected: ${expectedAmountPaise} paise, ` +
        `Got: ${rzpPayment.amount} paise for orderId: ${razorpay_order_id}`
      );
      // Optionally: initiate a refund here for security
      return res.status(400).json({ message: "Payment amount does not match order total." });
    }

    // 7. Save confirmed order to DB
    const newOrder = await Order.create({
      userId:            req.user?.id ?? null,
      items:             orderDetails?.items          ?? [],
      billing:           orderDetails?.billing        ?? {},
      grandTotal:        orderDetails?.grandTotal     ?? 0,
      deliveryCharge:    orderDetails?.deliveryCharge ?? 0,
      totalGst:          orderDetails?.totalGst       ?? 0,
      couponCode:        orderDetails?.couponCode     ?? null,
      couponDiscount:    orderDetails?.couponDiscount ?? 0,
      paymentMethod:     "razorpay",
      paymentStatus:     "captured",
      status:            "confirmed",
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paidAt:            new Date(),
    });

    console.info(
      `[razorpay/verify] ✅ Order ${newOrder._id} created. ` +
      `PaymentId: ${razorpay_payment_id}, Amount: ₹${rzpPayment.amount / 100}`
    );

    // TODO: send order confirmation email here

    return res.status(200).json({
      success:   true,
      orderId:   newOrder._id.toString(),
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error("[razorpay/verify] DB/API error:", err.message);
    return res.status(500).json({
      message: "Order could not be saved. Payment was successful — please contact support with your payment ID.",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/cod
// ─────────────────────────────────────────────────────────────────────────────
router.post("/cod", authMiddleware, async (req, res) => {
  const {
    items, billing, grandTotal, deliveryCharge,
    totalGst, couponCode, couponDiscount,
  } = req.body;

  if (!items?.length || !billing || !grandTotal) {
    return res.status(400).json({ message: "Missing required order fields." });
  }

  if (grandTotal < 199) {
    return res.status(400).json({ message: "COD requires a minimum order of ₹199." });
  }

  try {
    const newOrder = await Order.create({
      userId:         req.user?.id ?? null,
      items,
      billing,
      grandTotal,
      deliveryCharge: deliveryCharge ?? 0,
      totalGst:       totalGst       ?? 0,
      couponCode:     couponCode     ?? null,
      couponDiscount: couponDiscount ?? 0,
      paymentMethod:  "cod",
      paymentStatus:  "pending",
      status:         "confirmed",
      placedAt:       new Date(),
    });

    console.info(`[cod] ✅ COD Order ${newOrder._id} placed. Amount: ₹${grandTotal}`);

    return res.status(200).json({ orderId: newOrder._id.toString() });
  } catch (err) {
    console.error("[cod] DB error:", err.message);
    return res.status(500).json({ message: "Failed to place order. Please try again." });
  }
});

module.exports = router;