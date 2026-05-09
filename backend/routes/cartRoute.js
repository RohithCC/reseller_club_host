// ─────────────────────────────────────────────────────────────────────
//  backend/routes/cartRoutes.js
// ─────────────────────────────────────────────────────────────────────
import express from "express";
import {
  getCart,
  addToCart,
  updateQuantity,
  removeItem,
  clearCart,
  syncGuestCart,
  setCoupon,
} from "../controllers/cartController.js";

import authUser from "../middleware/auth.js";

const router = express.Router();

router.get   ("/",                authUser, getCart);
router.post  ("/add",             authUser, addToCart);
router.put   ("/update",          authUser, updateQuantity);
router.delete("/item/:productId", authUser, removeItem);
router.delete("/clear",           authUser, clearCart);
router.post  ("/sync",            authUser, syncGuestCart);
router.put   ("/coupon",          authUser, setCoupon);

export default router;