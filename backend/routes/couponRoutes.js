// ─────────────────────────────────────────────────────────────────────
//  routes/couponRoutes.js
// ─────────────────────────────────────────────────────────────────────
import express from "express";
import {
  listPublicCoupons,
  applyCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  adminListCoupons,
  getCouponUsage,
  bulkGenerateCoupons,
  getExpiringCoupons,
} from "../controllers/couponController.js";
import { adminOrSuperAdminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Public
router.get("/public", listPublicCoupons);
router.post("/apply",  applyCoupon);

// Admin (protected)
router.get("/admin",          adminOrSuperAdminAuth, adminListCoupons);
router.get("/expiring-soon",  adminOrSuperAdminAuth, getExpiringCoupons);
router.get("/:id/usage",      adminOrSuperAdminAuth, getCouponUsage);
router.post("/",              adminOrSuperAdminAuth, createCoupon);
router.post("/bulk-generate", adminOrSuperAdminAuth, bulkGenerateCoupons);
router.put("/:id",            adminOrSuperAdminAuth, updateCoupon);
router.delete("/:id",         adminOrSuperAdminAuth, deleteCoupon);

export default router;