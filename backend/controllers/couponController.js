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

// ── GET /api/coupons/admin ──────────────────────────────────────────
// List all coupons for admin with full details
export const adminListCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const enriched = coupons.map(c => ({
      ...c,
      isExpired: now > c.validTill,
      isExpiringSoon: c.validTill && !c.isExpired && (c.validTill - now) / (1000 * 60 * 60 * 24) <= 7,
      usagePercent: c.usageLimit ? Math.round((c.usedCount / c.usageLimit) * 100) : null,
      uniqueUsers: new Set(c.usedBy?.map(u => u.userId?.toString()) || []).size,
    }))

    res.json({ success: true, coupons: enriched });
  } catch (err) {
    console.error("adminListCoupons:", err);
    res.status(500).json({ success: false, message: "Failed to fetch coupons" });
  }
};

// ── GET /api/coupons/:id/usage ──────────────────────────────────────
// Return usage details for a specific coupon
export const getCouponUsage = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .select("code usedBy usedCount usageLimit")
      .lean();

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    res.json({
      success: true,
      couponCode: coupon.code,
      usedCount: coupon.usedCount,
      usageLimit: coupon.usageLimit,
      usedBy: (coupon.usedBy || []).sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt)),
    });
  } catch (err) {
    console.error("getCouponUsage:", err);
    res.status(500).json({ success: false, message: "Failed to fetch usage details" });
  }
};

// ── POST /api/coupons/bulk-generate ─────────────────────────────────
// Generate multiple coupon codes at once
export const bulkGenerateCoupons = async (req, res) => {
  try {
    const { count = 10, prefix = "CAMPAIGN", template } = req.body;

    if (!template) {
      return res.status(400).json({ success: false, message: "Template config is required (type, value, validTill, etc.)" });
    }

    const maxCount = Math.min(count, 500);
    const codes = [];
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

    const generateCode = () => {
      let code = prefix.toUpperCase();
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    };

    // Generate unique codes
    while (codes.length < maxCount) {
      const code = generateCode();
      const exists = await Coupon.findOne({ code });
      if (!exists && !codes.includes(code)) {
        codes.push(code);
      }
    }

    // Create coupons
    const couponsData = codes.map(code => ({
      ...template,
      code,
      label: template.label || `${prefix} Campaign`,
      isActive: true,
    }));

    const created = await Coupon.insertMany(couponsData, { ordered: false });

    res.status(201).json({
      success: true,
      message: `${created.length} coupons generated with prefix "${prefix}"`,
      count: created.length,
      sampleCodes: created.slice(0, 5).map(c => c.code),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Some codes conflicted. Try a different prefix." });
    }
    console.error("bulkGenerateCoupons:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/coupons/expiring-soon ──────────────────────────────────
// Coupons expiring within 7 days (for dashboard/notifications)
export const getExpiringCoupons = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const coupons = await Coupon.find({
      isActive: true,
      validTill: { $gte: now, $lte: sevenDaysLater },
    })
      .select("code label validTill usedCount usageLimit")
      .sort({ validTill: 1 })
      .lean();

    res.json({ success: true, coupons });
  } catch (err) {
    console.error("getExpiringCoupons:", err);
    res.status(500).json({ success: false, message: "Failed to fetch expiring coupons" });
  }
};

// ── Internal helper for Order controller — atomically increments usedCount
//    and tracks per-customer usage
export const incrementCouponUsage = async (code, userInfo = {}) => {
  if (!code) return null;
  const { userId, email, orderId } = userInfo;
  const update = { $inc: { usedCount: 1 } };
  if (userId || email) {
    update.$push = {
      usedBy: {
        ...(userId  ? { userId }  : {}),
        ...(email   ? { email }   : {}),
        ...(orderId ? { orderId } : {}),
        usedAt: new Date(),
      },
    };
  }
  return Coupon.findOneAndUpdate(
    { code: code.toUpperCase() },
    update,
    { new: true }
  );
};