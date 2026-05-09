// ─────────────────────────────────────────────────────────────────────
//  routes/deliveryRoutes.js
// ─────────────────────────────────────────────────────────────────────
import express from "express";
import {
  calculateDelivery,
  listDeliveryOptions,
  createDeliveryCharge,
  updateDeliveryCharge,
  deleteDeliveryCharge,
} from "../controllers/deliveryChargeController.js";
// import { isAuth, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public
router.post("/calculate", calculateDelivery);
router.get("/options",    listDeliveryOptions);

// Admin
router.post("/",       /* isAuth, isAdmin, */ createDeliveryCharge);
router.put("/:id",     /* isAuth, isAdmin, */ updateDeliveryCharge);
router.delete("/:id",  /* isAuth, isAdmin, */ deleteDeliveryCharge);

export default router;