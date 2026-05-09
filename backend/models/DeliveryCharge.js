// ─────────────────────────────────────────────────────────────────────
//  models/DeliveryCharge.js
//  Slab-based delivery pricing with pin-code / region / weight rules.
//  Relations:
//    • referenced by Order.deliveryCharge  (delivery rule applied)
//    • referenced by Cart.deliveryCharge   (currently computed rule)
// ─────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";

const deliveryChargeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // e.g. "Standard Delivery", "Express Delivery"
    },

    method: {
      type: String,
      enum: ["standard", "express", "same_day", "pickup"],
      required: true,
      default: "standard",
    },

    // Cart subtotal below which this charge applies.
    // charge = 0 when subtotal >= freeAbove
    freeAbove: {
      type: Number,
      required: true,
      default: 499,
      min: 0,
    },

    // Flat fee when subtotal < freeAbove
    charge: {
      type: Number,
      required: true,
      default: 49,
      min: 0,
    },

    // Optional extra fee per kg above baseWeight
    baseWeight: { type: Number, default: 1, min: 0 },      // kg
    perKgExtra: { type: Number, default: 0, min: 0 },      // ₹/kg above base

    // Estimated delivery window in business days
    estimatedDaysMin: { type: Number, default: 4, min: 0 },
    estimatedDaysMax: { type: Number, default: 7, min: 0 },

    // Pin-code / region targeting
    applicablePincodes: [{ type: String, trim: true }],    // empty → all
    applicableRegions:  [{ type: String, trim: true }],    // e.g. ["Karnataka", "Metro"]

    // Order of preference when multiple rules match (lower = higher priority)
    priority: { type: Number, default: 100 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Instance method: compute final delivery charge for a cart ────────
deliveryChargeSchema.methods.computeCharge = function ({ subtotal, weight = 0, pincode = "" }) {
  if (!this.isActive) return { charge: 0, applicable: false, reason: "inactive" };

  // Pin-code filter
  if (
    this.applicablePincodes.length > 0 &&
    pincode &&
    !this.applicablePincodes.includes(pincode)
  ) {
    return { charge: 0, applicable: false, reason: "pincode_not_served" };
  }

  // Free over threshold
  if (subtotal >= this.freeAbove) {
    return {
      charge: 0,
      applicable: true,
      freeDelivery: true,
      estimatedDaysMin: this.estimatedDaysMin,
      estimatedDaysMax: this.estimatedDaysMax,
    };
  }

  // Base + weight-based surcharge
  let total = this.charge;
  if (weight > this.baseWeight && this.perKgExtra > 0) {
    total += Math.ceil(weight - this.baseWeight) * this.perKgExtra;
  }

  return {
    charge: total,
    applicable: true,
    freeDelivery: false,
    estimatedDaysMin: this.estimatedDaysMin,
    estimatedDaysMax: this.estimatedDaysMax,
  };
};

export default mongoose.model("DeliveryCharge", deliveryChargeSchema);