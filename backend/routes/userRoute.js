// routes/userRoute.js
// ─────────────────────────────────────────────────────────────────────────────
//  ✅ Google OAuth route added    POST /api/user/google
//  ✅ Rate limiters per-endpoint  (imported from controller)
//  ✅ userAuth JWT on all protected routes
//  ✅ All previous routes intact  (register, login, admin, forgot, reset, profile, update)
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express'
import { userAuth } from '../middleware/userAuth.js'
import {
    registerUser,
    loginUser,
    googleLogin,
    adminLogin,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updateProfile,
    changeOwnPassword,
    listAdminUsers,
    addAdminUser,
    updateAdminUserRole,
    changeAdminUserPassword,
    deleteAdminUser,
    listCustomers,
    getCustomerOrders,
    getCustomer360,
    addCustomerCommunication,
    authLimiter,
    resetLimiter,
    updateLimiter,
} from '../controllers/userController.js'

const userRouter = express.Router()

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Local auth — 10 attempts / 15 min per IP
userRouter.post('/register',        authLimiter,  registerUser)
userRouter.post('/login',           authLimiter,  loginUser)
userRouter.post('/admin',           authLimiter,  adminLogin)

// Google OAuth — same rate limit as local auth
// Expects body: { idToken: '<Google ID token>' }
userRouter.post('/google',          authLimiter,  googleLogin)

// Password reset — 5 requests / hour per IP
userRouter.post('/forgot-password', resetLimiter, forgotPassword)
userRouter.post('/reset-password',  resetLimiter, resetPassword)

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES  (JWT required via userAuth)
// ─────────────────────────────────────────────────────────────────────────────

userRouter.post('/profile',         userAuth,                  getUserProfile)
userRouter.post('/update-profile',  updateLimiter, userAuth,   updateProfile)
userRouter.post('/change-password',                userAuth,   changeOwnPassword)

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN USER MANAGEMENT ROUTES  (requires super-admin auth)
// ─────────────────────────────────────────────────────────────────────────────
import { superAdminAuth, staffOrAboveAuth } from '../middleware/adminAuth.js'

userRouter.post('/admin-users',             superAdminAuth,  listAdminUsers)
userRouter.post('/admin-users/add',         superAdminAuth,  addAdminUser)
userRouter.post('/admin-users/update',      superAdminAuth,  updateAdminUserRole)
userRouter.post('/admin-users/change-password', superAdminAuth, changeAdminUserPassword)
userRouter.post('/admin-users/delete',      superAdminAuth,  deleteAdminUser)

// ── Customer management (staff+ can view) ─────────────────────────────────────
userRouter.get('/customers',         staffOrAboveAuth, listCustomers)
userRouter.post('/customer-orders',   staffOrAboveAuth, getCustomerOrders)
userRouter.get('/customer-360/:userId', staffOrAboveAuth, getCustomer360)
userRouter.post('/customer-comms',    staffOrAboveAuth, addCustomerCommunication)

export default userRouter