import express from "express"
import { checkCodAvailability, adminListCodSettings, adminUpdateCodSetting } from "../controllers/codController.js"
import { adminOrSuperAdminAuth } from "../middleware/adminAuth.js"

const router = express.Router()

// Public
router.post("/check", checkCodAvailability)

// Admin
router.get("/admin", adminOrSuperAdminAuth, adminListCodSettings)
router.put("/admin/:state", adminOrSuperAdminAuth, adminUpdateCodSetting)

export default router
