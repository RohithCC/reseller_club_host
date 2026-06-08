// ─────────────────────────────────────────────────────────────────────
//  routes/deliveryRoutes.js
// ─────────────────────────────────────────────────────────────────────
import express from "express";
import {
  calculateDelivery,
  listDeliveryOptions,
  adminListDeliveryCharges,
  createDeliveryCharge,
  updateDeliveryCharge,
  deleteDeliveryCharge,
} from "../controllers/deliveryChargeController.js";
import { adminOrSuperAdminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Public
router.post("/calculate", calculateDelivery);
router.get("/options",    listDeliveryOptions);

// Admin (admin/super_admin only)
router.get("/admin/all", adminOrSuperAdminAuth, adminListDeliveryCharges);
router.post("/",         adminOrSuperAdminAuth, createDeliveryCharge);
router.put("/:id",       adminOrSuperAdminAuth, updateDeliveryCharge);
router.delete("/:id",    adminOrSuperAdminAuth, deleteDeliveryCharge);

export default router;