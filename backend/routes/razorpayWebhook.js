// backend/routes/razorpayWebhook.js
// ─────────────────────────────────────────────────────────────────────────────
// SECURE RAZORPAY WEBHOOK — Zero-trust design
//
// SECURITY MODEL:
//  1. HMAC-SHA256 signature verified server-side using raw request body.
//     Any tampering of body bytes (even whitespace) invalidates the signature.
//  2. Raw body buffering: express.json() must NOT parse this route before
//     we verify — we need the original Buffer, not the parsed object.
//  3. Webhook secret stored in environment variable only — never in code.
//  4. Idempotency: each payment_id stored in DB; duplicate webhooks are
//     silently ignored (always return 200 to Razorpay to stop retries).
//  5. event allowlist: only "payment.captured" triggers order fulfillment.
//     Other events are acknowledged but not acted upon.
//  6. No PII logged. Only IDs and event types are written to logs.
//  7. Response is always 200 OK — Razorpay retries on any non-200.
//     Errors are logged server-side; client never sees them.
//
// SETUP:
//  In your Express app entry point (app.js / server.js), mount this BEFORE
//  any body-parser / express.json() middleware so the raw buffer is intact:
//
//    const webhookRouter = require("./routes/razorpayWebhook");
//    app.use("/api/razorpay/webhook", webhookRouter);
//    app.use(express.json()); // ← only after webhook route
//
//  Environment variables required:
//    RAZORPAY_WEBHOOK_SECRET  — copy from Razorpay Dashboard → Webhooks
//    RAZORPAY_KEY_ID          — your Razorpay key ID
//    RAZORPAY_KEY_SECRET      — your Razorpay secret (for order creation API)
// ─────────────────────────────────────────────────────────────────────────────

const express  = require("express");
const crypto   = require("crypto");
const router   = express.Router();

// ─── DB / Order model — adjust import path for your project ──────────────────
const Order    = require("../models/Order");   // Mongoose / Sequelize / etc.
// ─────────────────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  // Crash at startup rather than silently accepting unverified webhooks
  throw new Error(
    "[razorpayWebhook] RAZORPAY_WEBHOOK_SECRET env variable is not set. " +
    "Set it in your .env file before starting the server."
  );
}

// ── Raw body capture middleware (ONLY for this route) ────────────────────────
// express.raw() gives us a Buffer that matches exactly what Razorpay signed.
// DO NOT use express.json() here — JSON.parse + re-stringify changes byte order.
router.use(
  express.raw({ type: "application/json", limit: "1mb" })
);

// ── Main webhook handler ──────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  // 1. Always respond 200 first? — NO. We verify first, log on failure, then 200.
  //    Razorpay only stops retrying when it receives a 200 in the response body.
  //    We return 200 even on signature mismatch (to avoid leaking error details),
  //    but we do NOT process the event.

  const receivedSig = req.headers["x-razorpay-signature"];

  if (!receivedSig) {
    console.warn("[razorpay-webhook] Missing X-Razorpay-Signature header");
    // Return 200 to stop Razorpay retrying a request we cannot verify
    return res.status(200).json({ status: "ignored", reason: "no_signature" });
  }

  // 2. Compute expected signature using HMAC-SHA256 over the RAW body buffer
  const expectedSig = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(req.body) // req.body is a Buffer here (not parsed JSON)
    .digest("hex");

  // 3. Constant-time comparison — prevents timing attacks
  const signaturesMatch = crypto.timingSafeEqual(
    Buffer.from(receivedSig,  "utf8"),
    Buffer.from(expectedSig,  "utf8")
  );

  if (!signaturesMatch) {
    // Signature mismatch — log for alerting, but still return 200 so Razorpay
    // does not retry endlessly (it would just fail again anyway).
    console.error(
      "[razorpay-webhook] ⚠️  SIGNATURE MISMATCH — possible spoofing attempt. " +
      `Event-type header: ${req.headers["x-razorpay-event-id"] ?? "unknown"}`
    );
    return res.status(200).json({ status: "ignored", reason: "signature_mismatch" });
  }

  // 4. Parse the verified body (safe to parse now — signature matched)
  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch (parseErr) {
    console.error("[razorpay-webhook] Failed to parse JSON body:", parseErr.message);
    return res.status(200).json({ status: "ignored", reason: "parse_error" });
  }

  const eventType = event?.event;
  console.info(`[razorpay-webhook] Received event: ${eventType}`);

  // 5. Event allowlist — only act on events we care about
  switch (eventType) {

    // ── PAYMENT CAPTURED ──────────────────────────────────────────────────
    // Razorpay fires this when funds are successfully captured.
    // This is the canonical "payment succeeded" event.
    case "payment.captured": {
      const payment   = event?.payload?.payment?.entity;
      const paymentId = payment?.id;
      const orderId   = payment?.order_id; // Razorpay order ID (rzp_order_xxx)
      const amount    = payment?.amount;   // In paise
      const currency  = payment?.currency;
      const method    = payment?.method;   // "upi", "card", "netbanking", etc.

      if (!paymentId || !orderId) {
        console.error("[razorpay-webhook] payment.captured: missing paymentId or orderId");
        break;
      }

      try {
        // Idempotency check — if we already processed this payment, skip
        const existing = await Order.findOne({ razorpayPaymentId: paymentId });
        if (existing) {
          console.info(`[razorpay-webhook] Duplicate event for paymentId ${paymentId} — ignored`);
          break;
        }

        // Update the order in DB
        // Adjust the query field name to match your Order schema.
        // Your order schema should store the Razorpay order_id set during order creation.
        const updated = await Order.findOneAndUpdate(
          { razorpayOrderId: orderId },
          {
            $set: {
              status:            "confirmed",
              paymentStatus:     "captured",
              razorpayPaymentId: paymentId,
              paidAmount:        amount / 100, // convert paise → ₹
              paidCurrency:      currency,
              paymentMethod:     method,
              paidAt:            new Date(),
            },
          },
          { new: true }
        );

        if (!updated) {
          // Order not found — could be race condition with verify endpoint.
          // Not an error per se; the verify endpoint may have already updated it.
          console.warn(
            `[razorpay-webhook] No order found for razorpayOrderId: ${orderId}. ` +
            "May have been fulfilled by /verify endpoint already."
          );
        } else {
          console.info(
            `[razorpay-webhook] ✅ Order ${updated._id} marked confirmed. ` +
            `Payment: ${paymentId}, Amount: ₹${amount / 100}`
          );
          // TODO: send confirmation email / push notification here
        }
      } catch (dbErr) {
        // Log the error but still return 200 — Razorpay should not retry DB errors
        console.error("[razorpay-webhook] DB error on payment.captured:", dbErr.message);
      }
      break;
    }

    // ── PAYMENT FAILED ────────────────────────────────────────────────────
    // Razorpay fires this when a payment attempt fails.
    // Log it and optionally update order status, but no fulfillment.
    case "payment.failed": {
      const payment   = event?.payload?.payment?.entity;
      const paymentId = payment?.id;
      const orderId   = payment?.order_id;
      const errorDesc = payment?.error_description ?? "Unknown error";

      console.warn(
        `[razorpay-webhook] Payment failed — paymentId: ${paymentId}, ` +
        `orderId: ${orderId}, reason: ${errorDesc}`
      );

      try {
        await Order.findOneAndUpdate(
          { razorpayOrderId: orderId },
          { $set: { paymentStatus: "failed", paymentFailReason: errorDesc } }
        );
      } catch (dbErr) {
        console.error("[razorpay-webhook] DB error on payment.failed:", dbErr.message);
      }
      break;
    }

    // ── ORDER PAID ────────────────────────────────────────────────────────
    // Fires when full order amount is paid (useful for split payments).
    // For most single-payment flows, payment.captured is sufficient.
    case "order.paid": {
      const rzpOrder  = event?.payload?.order?.entity;
      const orderId   = rzpOrder?.id;
      console.info(`[razorpay-webhook] order.paid for Razorpay order: ${orderId}`);
      // Handled by payment.captured above — no additional action needed here
      break;
    }

    // ── REFUND CREATED ────────────────────────────────────────────────────
    case "refund.created": {
      const refund    = event?.payload?.refund?.entity;
      const refundId  = refund?.id;
      const paymentId = refund?.payment_id;
      const amount    = refund?.amount;

      console.info(
        `[razorpay-webhook] Refund created — refundId: ${refundId}, ` +
        `paymentId: ${paymentId}, amount: ₹${amount / 100}`
      );

      try {
        await Order.findOneAndUpdate(
          { razorpayPaymentId: paymentId },
          {
            $set: {
              refundStatus: "initiated",
              refundId,
              refundAmount: amount / 100,
              refundedAt:   new Date(),
            },
          }
        );
      } catch (dbErr) {
        console.error("[razorpay-webhook] DB error on refund.created:", dbErr.message);
      }
      break;
    }

    // ── REFUND PROCESSED ──────────────────────────────────────────────────
    case "refund.processed": {
      const refund    = event?.payload?.refund?.entity;
      const refundId  = refund?.id;
      const paymentId = refund?.payment_id;

      console.info(
        `[razorpay-webhook] Refund processed — refundId: ${refundId}, paymentId: ${paymentId}`
      );

      try {
        await Order.findOneAndUpdate(
          { razorpayPaymentId: paymentId },
          { $set: { refundStatus: "processed", status: "refunded" } }
        );
      } catch (dbErr) {
        console.error("[razorpay-webhook] DB error on refund.processed:", dbErr.message);
      }
      break;
    }

    // ── ALL OTHER EVENTS ──────────────────────────────────────────────────
    default:
      console.info(`[razorpay-webhook] Unhandled event type: ${eventType} — ignored`);
      break;
  }

  // Always return 200 so Razorpay doesn't retry
  return res.status(200).json({ status: "ok" });
});

module.exports = router;