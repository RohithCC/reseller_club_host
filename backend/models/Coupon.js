// ─────────────────────────────────────────────────────────────────────
//  models/Coupon.js
//  Mongoose schema for discount coupons
// ─────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      index: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
      // e.g. "10% off your order"
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // "percent" → value is a %, "flat" → value is rupees
    type: {
      type: String,
      enum: ["percent", "flat"],
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 1,
    },

    // Minimum cart subtotal required to use this coupon
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Cap on discount amount (only meaningful for percent coupons)
    maxDiscount: {
      type: Number,
      default: null, // null → no cap
      min: 0,
    },

    // Total times this coupon can be redeemed across all users
    usageLimit: {
      type: Number,
      default: null, // null → unlimited
      min: 0,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Per-user redemption cap
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Restrict to specific sub-categories ([] → all)
    applicableSubCategories: [
      {
        type: String,
        trim: true,
      },
    ],

    // Only certain users (empty → everyone, e.g. "firstOrder")
    eligibility: {
      type: String,
      enum: ["all", "firstOrder", "vip"],
      default: "all",
    },

    validFrom: {
      type: Date,
      default: Date.now,
    },

    validTill: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Virtual: is the coupon currently usable? ─────────────────────────
couponSchema.virtual("isValid").get(function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (now < this.validFrom || now > this.validTill) return false;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
  return true;
});

// ── Instance method: compute discount on a given subtotal ────────────
couponSchema.methods.calculateDiscount = function (subtotal) {
  let discount = 0;
  if (this.type === "percent") {
    discount = Math.round((subtotal * this.value) / 100);
    if (this.maxDiscount !== null) discount = Math.min(discount, this.maxDiscount);
  } else {
    // flat
    discount = this.value;
  }
  // Never discount below zero
  return Math.min(discount, subtotal);
};

couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });

export default mongoose.model("Coupon", couponSchema);