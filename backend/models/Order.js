// backend/models/Order.js
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String,  required: true },
    name:      { type: String,  required: true },
    image:     { type: String,  default:  "" },
    price:     { type: Number,  required: true, min: 0 },
    mrp:       { type: Number,  required: true, min: 0 },
    quantity:  { type: Number,  required: true, min: 1 },
    subcat:    { type: String,  default:  "" },
  },
  { _id: false }
);

const billingSchema = new mongoose.Schema(
  {
    firstName:  { type: String, required: true, trim: true },
    lastName:   { type: String, required: true, trim: true },
    email:      { type: String, required: true, trim: true, lowercase: true },
    phone:      { type: String, required: true, trim: true },
    address:    { type: String, required: true, trim: true },
    apartment:  { type: String, default: "",    trim: true },
    city:       { type: String, required: true, trim: true },
    state:      { type: String, required: true, trim: true },
    pincode:    { type: String, required: true, trim: true },
    country:    { type: String, default: "India" },
    orderNotes: { type: String, default: "" },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type:     String,
      enum:     ["razorpay", "cod"],
      required: true,
    },
    razorpayOrderId:   { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    status: {
      type:    String,
      enum:    ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paidAt: { type: Date, default: null },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// ★ UPDATED — TRACKING SUB-SCHEMA
// Now stores the full tracking identity PLUS courier name &
// estimated-delivery date so the admin's update has one home.
// ─────────────────────────────────────────────────────────────────────────────
const trackingSchema = new mongoose.Schema(
  {
    provider:     { type: String, default: "" },   // legacy field — same as courierName
    courierName:  { type: String, default: "" },   // ★ e.g. "Delhivery", "BlueDart"
    trackingId:   { type: String, default: "" },   // legacy field — same as trackingNumber
    trackingNumber:{ type: String, default: "" },  // ★ friendlier alias used by admin UI
    trackingUrl:  { type: String, default: "" },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// ★ NEW — STATUS-HISTORY SUB-SCHEMA
// Every time an admin updates the order status, we PUSH one entry.
// Gives you a full audit trail that the customer can see on "Track Order".
// ─────────────────────────────────────────────────────────────────────────────
const statusHistorySchema = new mongoose.Schema(
  {
    status:   { type: String, required: true },
    message:  { type: String, default: "" },
    location: { type: String, default: "" },
    updatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    at:       { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderCouponSchema = new mongoose.Schema(
  {
    ref:      { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    code:     { type: String, default: "" },
    label:    { type: String, default: "" },
    type:     { type: String, enum: ["percent", "flat", ""], default: "" },
    value:    { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const orderDeliverySchema = new mongoose.Schema(
  {
    ref:              { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryCharge", default: null },
    name:             { type: String, default: "Standard Delivery" },
    method:           { type: String, enum: ["standard", "express", "same_day", "pickup"], default: "standard" },
    charge:           { type: Number, default: 0, min: 0 },
    freeDelivery:     { type: Boolean, default: false },
    estimatedDaysMin: { type: Number, default: null },
    estimatedDaysMax: { type: Number, default: null },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ORDER SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "user",
      default: null,
      index:   true,
    },

    orderNumber: {
      type:   String,
      unique: true,
      index:  true,
    },

    items:    { type: [orderItemSchema], required: true },
    billing:  { type: billingSchema,     required: true },
    payment:  { type: paymentSchema,     required: true },
    tracking: { type: trackingSchema,    default: () => ({}) },
    coupon:   { type: orderCouponSchema,   default: () => ({}) },
    delivery: { type: orderDeliverySchema, default: () => ({}) },

    // Financial summary
    mrpTotal:       { type: Number, default: 0,     min: 0 },
    subtotal:       { type: Number, required: true, min: 0 },
    discountOnMrp:  { type: Number, default: 0,     min: 0 },
    couponDiscount: { type: Number, default: 0,     min: 0 },
    deliveryCharge: { type: Number, required: true, min: 0, default: 0 },
    grandTotal:     { type: Number, required: true, min: 0 },
    savedAmount:    { type: Number, default: 0,     min: 0 },

    status: {
      type:    String,
      enum:    ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "placed",
    },

    estimatedDelivery: { type: Date, default: null },

    // ★ NEW — full audit trail of every status change
    statusHistory: { type: [statusHistorySchema], default: [] },

    // ★ NEW — internal notes only admins see (hide from customer API responses)
    adminNote: { type: String, default: "" },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PRE-SAVE HOOK — orderNumber + keep mirrors in sync
// ─────────────────────────────────────────────────────────────────────────────
orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    const date   = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.orderNumber = `AE-${date}-${random}`;
  }
  if (this.coupon && typeof this.coupon.discount === "number") {
    this.couponDiscount = this.coupon.discount;
  }
  if (this.delivery && typeof this.delivery.charge === "number") {
    this.deliveryCharge = this.delivery.charge;
  }
  // Keep trackingId / trackingNumber in sync regardless of which one the
  // admin filled in — same for provider / courierName.
  if (this.tracking) {
    if (this.tracking.trackingNumber && !this.tracking.trackingId) {
      this.tracking.trackingId = this.tracking.trackingNumber;
    } else if (this.tracking.trackingId && !this.tracking.trackingNumber) {
      this.tracking.trackingNumber = this.tracking.trackingId;
    }
    if (this.tracking.courierName && !this.tracking.provider) {
      this.tracking.provider = this.tracking.courierName;
    } else if (this.tracking.provider && !this.tracking.courierName) {
      this.tracking.courierName = this.tracking.provider;
    }
  }
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// INSTANCE METHOD — pushTracking(status, message, location, adminUserId?)
// Call this from the admin controller to append an entry to statusHistory.
// ─────────────────────────────────────────────────────────────────────────────
orderSchema.methods.pushTracking = function (status, message = "", location = "", updatedBy = null) {
  this.statusHistory.push({
    status,
    message,
    location,
    updatedBy,
    at: new Date(),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 },                        { unique: true });
orderSchema.index({ "payment.razorpayOrderId":   1 });
orderSchema.index({ "payment.razorpayPaymentId": 1 });
orderSchema.index({ "coupon.ref":   1 });
orderSchema.index({ "coupon.code":  1 });
orderSchema.index({ "delivery.ref": 1 });
orderSchema.index({ "tracking.trackingNumber": 1 });

const Order = mongoose.models?.Order ?? mongoose.model("Order", orderSchema);
export default Order;