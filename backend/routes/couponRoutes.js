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
} from "../controllers/couponController.js";
// import { isAuth, isAdmin } from "../middleware/auth.js"; // if you have auth

const router = express.Router();

// Public
router.get("/public", listPublicCoupons);
router.post("/apply",  applyCoupon);

// Admin — plug your auth middleware in
router.post("/",        /* isAuth, isAdmin, */ createCoupon);
router.put("/:id",      /* isAuth, isAdmin, */ updateCoupon);
router.delete("/:id",   /* isAuth, isAdmin, */ deleteCoupon);

export default router;