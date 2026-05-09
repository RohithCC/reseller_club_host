// models/userModel.js
import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
    fullName:   { type: String, required: true },
    phone:      { type: String, required: true },
    street:     { type: String, required: true },
    city:       { type: String, required: true },
    state:      { type: String, required: true },
    pincode:    { type: String, required: true },
    country:    { type: String, default: 'India' },
    isDefault:  { type: Boolean, default: false },
    label:      { type: String, default: 'Home' }  // Home / Work / Other
})

const userSchema = new mongoose.Schema({
    // ── Core ──────────────────────────────────────────────
    name:           { type: String, required: true },
    email:          { type: String, required: true, unique: true },
    password:       { type: String, required: true },
    phone:          { type: String, default: '' },
    avatar:         { type: String, default: '' },      // Cloudinary URL

    // ── Address Book ──────────────────────────────────────
    addresses:      { type: [addressSchema], default: [] },

    // ── Cart ─────────────────────────────────────────────
    // { productId: { qty: 2, selectedSize: 'M' }, ... }
    cartData:       { type: Object, default: {} },

    // ── Wishlist ──────────────────────────────────────────
    wishlist:       { type: [String], default: [] },    // array of productIds

    // ── Account Status ────────────────────────────────────
    isVerified:     { type: Boolean, default: false },
    isBlocked:      { type: Boolean, default: false },

    // ── Loyalty / Wallet ──────────────────────────────────
    walletBalance:  { type: Number, default: 0 },
    loyaltyPoints:  { type: Number, default: 0 },

    // ── Auth Tokens ───────────────────────────────────────
    resetToken:         { type: String, default: '' },
    resetTokenExpiry:   { type: Number, default: 0 },
    verifyToken:        { type: String, default: '' },

    date:           { type: Number, default: Date.now }

}, { minimize: false })

const userModel = mongoose.models.user || mongoose.model('user', userSchema)
export default userModel