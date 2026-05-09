// ─────────────────────────────────────────────────────────────────────
//  backend/models/Cart.js
//  One cart per user. Saved on every add/remove/qty change.
//  Survives logout/login so users don't lose their items.
//
//  Relations:
//    • user   → User._id    (1-to-1, unique)
//    • coupon → Coupon._id  (optional, if user applied one)
// ─────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";

// ── Single item in the cart ──────────────────────────────────────────
const cartItemSchema = new mongoose.Schema(
  {
    // productId matches your Product._id (stored as String in your system)
    productId: { type: String, required: true },

    // Snapshot of product details at time of add — so display stays consistent
    // even if the product later changes price / name
    name:   { type: String, required: true },
    image:  { type: String, default: "" },
    price:  { type: Number, required: true, min: 0 },  // selling price
    mrp:    { type: Number, required: true, min: 0 },  // original MRP
    subcat: { type: String, default: "" },

    quantity: { type: Number, required: true, min: 1, max: 10, default: 1 },
  },
  { _id: false }
);

// ── Applied coupon (optional) ────────────────────────────────────────
const appliedCouponSchema = new mongoose.Schema(
  {
    ref:   { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    code:  { type: String, default: "" },
    label: { type: String, default: "" },
    type:  { type: String, enum: ["percent", "flat", ""], default: "" },
    value: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0 }, // ₹ saved at last recalc
  },
  { _id: false }
);

// ── Main cart ────────────────────────────────────────────────────────
const cartSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "user",       // matches your User model name (lowercase)
      required: true,
      unique:   true,         // one cart per user
      index:    true,
    },

    items: {
      type:    [cartItemSchema],
      default: [],
    },

    coupon: {
      type:    appliedCouponSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

// ── Virtuals: totals, computed on read ───────────────────────────────
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((s, i) => s + i.quantity, 0);
});

cartSchema.virtual("subtotal").get(function () {
  return this.items.reduce((s, i) => s + i.price * i.quantity, 0);
});

cartSchema.virtual("mrpTotal").get(function () {
  return this.items.reduce((s, i) => s + i.mrp * i.quantity, 0);
});

cartSchema.set("toJSON",   { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

// ── Helper: merge two carts (used on login, see controller) ──────────
// Takes an array of guest items, adds them to this cart.
// If the same productId exists → sum quantities (capped at 10).
cartSchema.methods.mergeItems = function (guestItems = []) {
  guestItems.forEach((g) => {
    if (!g.productId) return;
    const existing = this.items.find((i) => i.productId === g.productId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + (g.quantity || 1), 10);
    } else {
      this.items.push({
        productId: g.productId,
        name:      g.name,
        image:     g.image  || "",
        price:     g.price,
        mrp:       g.mrp    || g.price,
        subcat:    g.subcat || "",
        quantity:  Math.min(g.quantity || 1, 10),
      });
    }
  });
};

// ESM-safe export pattern (same as your Order.js)
const Cart = mongoose.models?.Cart ?? mongoose.model("Cart", cartSchema);

export default Cart;