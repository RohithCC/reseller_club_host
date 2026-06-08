// models/userModel.js
// ─────────────────────────────────────────────────────────────────────────────
//  ✅ Google OAuth fields added   (googleId, authProvider)
//  ✅ password made optional      (Google users have no local password)
//  ✅ select: false on password   (never leak hash in queries)
//  ✅ select: false on tokens     (reset / verify tokens hidden by default)
//  ✅ index on googleId           (fast OAuth lookup)
//  ✅ loginAttempts + lockUntil   (account lock-out support)
//  ✅ All previous fields intact  (addresses, cart, wishlist, wallet …)
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose'

// ── Sub-schema: address ───────────────────────────────────────────────────────
const addressSchema = new mongoose.Schema({
    fullName:  { type: String, required: true },
    phone:     { type: String, required: true },
    street:    { type: String, required: true },
    city:      { type: String, required: true },
    state:     { type: String, required: true },
    pincode:   { type: String, required: true },
    country:   { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
    label:     { type: String, default: 'Home' },   // Home / Work / Other
})

// ── Main schema ───────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
    {
        // ── Core identity ────────────────────────────────────────────────────
        name:   { type: String, required: true, trim: true },
        email:  { type: String, required: true, unique: true, lowercase: true, trim: true },

        // ── Auth provider ────────────────────────────────────────────────────
        // 'local' = email+password   |   'google' = OAuth
        authProvider: {
            type:    String,
            enum:    ['local', 'google'],
            default: 'local',
        },

        // ── Local-auth password (hidden unless explicitly selected) ───────────
        // Optional because Google users have no local password.
        // select:false means .find() / .findOne() NEVER return it by default.
        password: {
            type:     String,
            required: false,
            select:   false,          // ✅ never exposed unless .select('+password')
        },

        // ── Google OAuth ─────────────────────────────────────────────────────
        googleId: {
            type:   String,
            sparse: true,             // unique index but allows multiple nulls
            unique: true,
            index:  true,
        },

        // ── Profile ──────────────────────────────────────────────────────────
        phone:  { type: String, default: '' },
        avatar: { type: String, default: '' },      // /uploads/ avatar or external URL

        // ── Address book ─────────────────────────────────────────────────────
        addresses: { type: [addressSchema], default: [] },

        // ── Cart  { productId: { qty:2, selectedSize:'M' }, … } ──────────────
        cartData:  { type: Object, default: {} },

        // ── Wishlist  [productId, …] ──────────────────────────────────────────
        wishlist:  { type: [String], default: [] },

        // ── Role (admin panel users only) ────────────────────────────────────
        // customer = regular site user, admin/staff = admin panel users
        role: {
            type:    String,
            enum:    ['customer', 'admin', 'staff'],
            default: 'customer',
        },

        // ── Account status ───────────────────────────────────────────────────
        isVerified: { type: Boolean, default: false },
        isBlocked:  { type: Boolean, default: false },

        // ── Brute-force protection ────────────────────────────────────────────
        // loginAttempts counts consecutive failures; lockUntil is epoch ms.
        // Controller increments on bad password, resets on success.
        loginAttempts: { type: Number, default: 0 },
        lockUntil:     { type: Number, default: 0 },    // 0 = not locked

        // ── Loyalty / Wallet ─────────────────────────────────────────────────
        walletBalance: { type: Number, default: 0 },
        loyaltyPoints: { type: Number, default: 0 },

        // ── Auth tokens (hidden by default) ───────────────────────────────────
        resetToken:       { type: String, default: '', select: false },
        resetTokenExpiry: { type: Number, default: 0,  select: false },
        verifyToken:      { type: String, default: '', select: false },

        // ── Timestamps ───────────────────────────────────────────────────────
        date: { type: Number, default: Date.now },
    },
    {
        minimize:   false,       // keep empty objects in cartData
        timestamps: true,        // adds createdAt / updatedAt automatically
    }
)

// ── Virtual: account is currently locked ─────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
    return this.lockUntil > Date.now()
})

const userModel = mongoose.models.user || mongoose.model('user', userSchema)
export default userModel