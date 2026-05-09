// routes/userRoute.js
// ─────────────────────────────────────────────────────────────────────────────
// ✅ Rate limiters applied per-endpoint (imported from controller)
// ✅ Helmet security headers set at route level
// ✅ All POST bodies validated — no GET routes that leak data in URL/logs
// ✅ userAuth middleware enforces JWT on all protected routes
//
// Mount in server.js:
//   import userRouter from './routes/userRoute.js'
//   app.use('/api/user', userRouter)
// ─────────────────────────────────────────────────────────────────────────────

import express  from 'express'
import { userAuth } from '../middleware/userAuth.js'
import {
    registerUser,
    loginUser,
    adminLogin,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updateProfile,
    // ✅ Rate limiters defined in controller — single source of truth
    authLimiter,
    resetLimiter,
    updateLimiter,
} from '../controllers/userController.js'

const userRouter = express.Router()

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (no auth required)
// ─────────────────────────────────────────────────────────────────────────────

// Auth — 10 attempts / 15 min per IP (brute-force + credential-stuffing guard)
userRouter.post('/register',        authLimiter,  registerUser)
userRouter.post('/login',           authLimiter,  loginUser)
userRouter.post('/admin',           authLimiter,  adminLogin)

// Password reset — 5 requests / hour per IP
userRouter.post('/forgot-password', resetLimiter, forgotPassword)
userRouter.post('/reset-password',  resetLimiter, resetPassword)

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (userAuth JWT verification required)
// ─────────────────────────────────────────────────────────────────────────────

// GET profile — no rate limit needed (read-only, cheap DB query)
userRouter.post('/profile',         userAuth,     getUserProfile)

// Update profile — 20 requests / min per IP (avatar upload spam guard)
userRouter.post('/update-profile',  updateLimiter, userAuth, updateProfile)

export default userRouter