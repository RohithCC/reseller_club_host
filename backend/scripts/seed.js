// ─────────────────────────────────────────────────────────────────────
//  backend/scripts/seed.js
//  Run once with:  npm run seed
//
//  Uses the same local MongoDB URI as your connectDB config.
// ─────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";

import Coupon from "../models/Coupon.js";
import DeliveryCharge from "../models/DeliveryCharge.js";

// ── Match your connectDB config ──────────────────────────────────────
const MONGO_URI = "mongodb://127.0.0.1:27017/ecom";

const oneYearFromNow = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
};

async function run() {
  console.log("→ Connecting to local MongoDB (ecom)...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected");

  // ─ COUPONS ─
  await Coupon.deleteMany({});
  await Coupon.insertMany([
    {
      code: "AMULYA10",
      label: "10% off your order",
      description: "Save 10% on your entire order.",
      type: "percent",
      value: 10,
      minOrderValue: 0,
      maxDiscount: 500,
      validTill: oneYearFromNow(),
    },
    {
      code: "FIRST50",
      label: "₹50 flat off",
      description: "Flat ₹50 off for first-time customers.",
      type: "flat",
      value: 50,
      minOrderValue: 199,
      eligibility: "firstOrder",
      validTill: oneYearFromNow(),
    },
    {
      code: "SAVE20",
      label: "20% off your order",
      description: "20% off on orders above ₹999.",
      type: "percent",
      value: 20,
      minOrderValue: 999,
      maxDiscount: 1000,
      validTill: oneYearFromNow(),
    },
  ]);
  console.log("✅ Seeded 3 coupons");

  // ─ DELIVERY RULES ─
  await DeliveryCharge.deleteMany({});
  await DeliveryCharge.insertMany([
    {
      name: "Standard Delivery",
      method: "standard",
      freeAbove: 499,
      charge: 49,
      estimatedDaysMin: 4,
      estimatedDaysMax: 7,
      priority: 10,
    },
    {
      name: "Express Delivery",
      method: "express",
      freeAbove: 1999,
      charge: 149,
      estimatedDaysMin: 1,
      estimatedDaysMax: 2,
      priority: 20,
    },
  ]);
  console.log("✅ Seeded 2 delivery rules");

  await mongoose.disconnect();
  console.log("✅ Done — disconnected");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
