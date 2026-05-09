// ─────────────────────────────────────────────────────────────────────
//  controllers/couponController.js
// ─────────────────────────────────────────────────────────────────────
import Coupon from "../models/Coupon.js";

// ── GET /api/coupons/public ──────────────────────────────────────────
// List all currently-valid, publicly-advertised coupons (for the UI chips)
export const listPublicCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validTill: { $gte: now },
    })
      .select("code label description type value minOrderValue maxDiscount validTill")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, coupons });
  } catch (err) {
    console.error("listPublicCoupons:", err);
    res.status(500).json({ success: false, message: "Failed to fetch coupons" });
  }
};

// ── POST /api/coupons/apply ──────────────────────────────────────────
// Body: { code: "AMULYA10", subtotal: 1299, userId?: "..." }
// Returns: { success, coupon: {...}, discount: Number }
export const applyCoupon = async (req, res) => {
  try {
    const { code, subtotal, userId } = req.body;

    if (!code || typeof subtotal !== "number") {
      return res.status(400).json({
        success: false,
        message: "Coupon code and cart subtotal are required.",
      });
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code." });
    }

    // Validity checks
    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: "This coupon is no longer active." });
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      return res.status(400).json({ success: false, message: "This coupon is not yet active." });
    }
    if (now > coupon.validTill) {
      return res.status(400).json({ success: false, message: "This coupon has expired." });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its usage limit.",
      });
    }

    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`,
      });
    }

    // Compute discount
    const discount = coupon.calculateDiscount(subtotal);

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied — ${coupon.label}`,
      coupon: {
        code: coupon.code,
        label: coupon.label,
        type: coupon.type,
        value: coupon.value,
      },
      discount,
    });
  } catch (err) {
    console.error("applyCoupon:", err);
    res.status(500).json({ success: false, message: "Failed to apply coupon." });
  }
};

// ── POST /api/coupons  (admin) ───────────────────────────────────────
export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Coupon code already exists." });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── PUT /api/coupons/:id  (admin) ────────────────────────────────────
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/coupons/:id  (admin) ─────────────────────────────────
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    res.json({ success: true, message: "Coupon deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Internal helper for Order controller — atomically increments usedCount
export const incrementCouponUsage = async (code) => {
  if (!code) return null;
  return Coupon.findOneAndUpdate(
    { code: code.toUpperCase() },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
};