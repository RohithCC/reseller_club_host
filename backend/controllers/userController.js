// controllers/userController.js
// ─────────────────────────────────────────────────────────────────────────────
//  ✅ Register          — all previous measures + max-name-length, strong-pw
//  ✅ Login             — timing-safe + account lock-out (5 fails → 15 min)
//  ✅ Google OAuth      — googleLogin() finds-or-creates user, issues JWT
//  ✅ Admin login       — env-only creds, timing-safe compare (unchanged)
//  ✅ Forgot/Reset pw   — SHA-256 token, 1 h TTL, one-use (unchanged)
//  ✅ Get/Update profile— JWT userId only
//  ✅ Rate limiters     — exported for userRoute.js
//  ✅ Customer 360°     — enriched profile + LTV chart + wishlist cross-ref + comms
// ─────────────────────────────────────────────────────────────────────────────

import jwt          from 'jsonwebtoken'
import bcrypt       from 'bcryptjs'
import crypto       from 'crypto'
import validator    from 'validator'
import rateLimit    from 'express-rate-limit'
import { OAuth2Client } from 'google-auth-library'
import { writeFileSync, rmSync, existsSync, mkdirSync } from 'fs'
import path         from 'path'
import userModel    from '../models/userModel.js'
import Cart         from '../models/Cart.js'
import Order        from '../models/Order.js'
import nodemailer   from 'nodemailer'
import CustomerCommunication from '../models/CustomerCommunication.js'
import productModel from '../models/productModel.js'

// ─────────────────────────────────────────────────────────────────────────────
// STARTUP GUARDS
// ─────────────────────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET)
    throw new Error('[userController] JWT_SECRET env var is not set.')
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
    throw new Error('[userController] ADMIN_EMAIL / ADMIN_PASSWORD env vars are not set.')
if (!process.env.GOOGLE_CLIENT_ID)
    throw new Error('[userController] GOOGLE_CLIENT_ID env var is not set.')

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITERS  (exported → applied per-endpoint in userRoute.js)
// ─────────────────────────────────────────────────────────────────────────────

 const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 min
    max: 10,
    standardHeaders: true, legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
})

 const resetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: 5,
    standardHeaders: true, legacyHeaders: false,
    message: { success: false, message: 'Too many reset requests. Try again in 1 hour.' },
})

 const updateLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 min
    max: 20,
    standardHeaders: true, legacyHeaders: false,
    message: { success: false, message: 'Too many update requests. Slow down.' },
})

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS      = 12
const JWT_EXPIRY         = '7d'
const RESET_TTL_MS       = 60 * 60 * 1000           // 1 hour
const MAX_AVATAR_BYTES   = 5 * 1024 * 1024           // 5 MB
const ALLOWED_MIME       = ['image/jpeg','image/png','image/webp','image/gif']
const MAX_LOGIN_ATTEMPTS = 5                         // lock after N bad attempts
const LOCK_DURATION_MS   = 15 * 60 * 1000            // 15-minute lock

// Strong-password regex: ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special char
const STRONG_PW_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/`~]).{8,128}$/

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const createToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY })

/** Strip HTML tags + dangerous chars, trim */
const sanitize = (str = '') =>
    String(str)
        .replace(/<[^>]*>/g, '')
        .replace(/[<>"'`]/g, '')
        .trim()

/** Normalise email — lowercase, trim, no alias tricks */
const normalizeEmail = (email = '') =>
    validator.normalizeEmail(email.toLowerCase().trim()) || ''

const base64ByteSize = (b64) => {
    const base = b64.replace(/^data:[^;]+;base64,/, '')
    return Math.ceil((base.length * 3) / 4)
}
const base64Mime = (b64) => {
    const m = b64.match(/^data:([a-zA-Z0-9/+]+);base64,/)
    return m ? m[1] : ''
}

/** Send email via nodemailer (Gmail SMTP) */
const sendEmail = async ({ to, subject, html }) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
    await transporter.sendMail({
        from: `"Amulya Electronics" <${process.env.EMAIL_USER}>`,
        to, subject, html,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// POST /api/user/register
// ─────────────────────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
    try {
        const name     = sanitize(req.body.name     || '')
        const email    = normalizeEmail(req.body.email || '')
        const password = String(req.body.password   || '')

        if (!name || !email || !password)
            return res.status(400).json({ success: false, message: 'All fields are required' })

        if (name.length < 2 || name.length > 80)
            return res.status(400).json({ success: false, message: 'Name must be 2–80 characters' })
        if (!/^[\p{L}\p{M}'\- ]+$/u.test(name))
            return res.status(400).json({ success: false, message: 'Name contains invalid characters' })

        if (!validator.isEmail(email))
            return res.status(400).json({ success: false, message: 'Please enter a valid email' })

        if (!STRONG_PW_RE.test(password))
            return res.status(400).json({
                success: false,
                message: 'Password must be 8–128 chars and include an uppercase letter, lowercase letter, number, and special character',
            })

        const exists = await userModel.findOne({ email }).select('_id').lean()
        if (exists)
            return res.status(409).json({ success: false, message: 'An account with this email already exists' })

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
        const user = await userModel.create({
            name,
            email,
            password: hashedPassword,
            authProvider: 'local',
        })
        const token = createToken(user._id)

        res.status(201).json({ success: true, token, message: 'Account created successfully' })
    } catch (error) {
        console.error('[registerUser]', error.message)
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// POST /api/user/login
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_HASH = '$2b$12$invalidsaltpaddingtomakeTimingConstantXXXXXXXXXXXXXXX'

const loginUser = async (req, res) => {
    try {
        const email    = normalizeEmail(req.body.email || '')
        const password = String(req.body.password     || '')

        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password are required' })

        const user = await userModel
            .findOne({ email })
            .select('+password +loginAttempts +lockUntil')
            .lean()

        if (user && user.lockUntil > Date.now())
            return res.status(423).json({
                success: false,
                message: `Account locked due to too many failed attempts. Try again after ${new Date(user.lockUntil).toLocaleTimeString()}.`,
            })

        if (user && user.authProvider === 'google' && !user.password)
            return res.status(400).json({
                success: false,
                message: 'This account was created with Google. Please use "Continue with Google" to sign in.',
            })

        const isMatch = await bcrypt.compare(password, user?.password ?? DUMMY_HASH)

        if (!user || !isMatch) {
            if (user) {
                const attempts = (user.loginAttempts || 0) + 1
                const update   = { loginAttempts: attempts }
                if (attempts >= MAX_LOGIN_ATTEMPTS) {
                    update.lockUntil     = Date.now() + LOCK_DURATION_MS
                    update.loginAttempts = 0
                }
                await userModel.updateOne({ _id: user._id }, { $set: update })
            }
            return res.status(401).json({ success: false, message: 'Incorrect email or password' })
        }

        if (user.isBlocked)
            return res.status(403).json({ success: false, message: 'Your account has been suspended' })

        await userModel.updateOne(
            { _id: user._id },
            { $set: { loginAttempts: 0, lockUntil: 0 } }
        )

        const token = createToken(user._id)
        res.json({ success: true, token, message: 'Login successful' })
    } catch (error) {
        console.error('[loginUser]', error.message)
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE LOGIN
// POST /api/user/google
// ─────────────────────────────────────────────────────────────────────────────
const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body
        if (!idToken)
            return res.status(400).json({ success: false, message: 'Google ID token is required' })

        let payload
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            })
            payload = ticket.getPayload()
        } catch {
            return res.status(401).json({ success: false, message: 'Invalid or expired Google token' })
        }

        const { sub: googleId, email, name, picture, email_verified } = payload

        if (!email_verified)
            return res.status(401).json({ success: false, message: 'Google account email is not verified' })

        const normalEmail = normalizeEmail(email)

        let user = await userModel.findOne({
            $or: [{ googleId }, { email: normalEmail }],
        }).lean()

        if (user) {
            if (!user.googleId) {
                await userModel.updateOne(
                    { _id: user._id },
                    { $set: { googleId, authProvider: 'google', isVerified: true } }
                )
            }
        } else {
            user = await userModel.create({
                name:         sanitize(name || 'User'),
                email:        normalEmail,
                googleId,
                authProvider: 'google',
                avatar:       picture || '',
                isVerified:   true,
            })
        }

        if (user.isBlocked)
            return res.status(403).json({ success: false, message: 'Your account has been suspended' })

        const token = createToken(user._id)
        res.json({ success: true, token, message: 'Google login successful' })
    } catch (error) {
        console.error('[googleLogin]', error.message)
        res.status(500).json({ success: false, message: 'Google login failed. Please try again.' })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LOGIN
// POST /api/user/admin
// ─────────────────────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
    try {
        const email    = normalizeEmail(req.body.email || '')
        const password = String(req.body.password     || '')

        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password are required' })

        const expectedEmail = process.env.ADMIN_EMAIL.toLowerCase().trim()
        const expectedPass  = process.env.ADMIN_PASSWORD

        const eB = Buffer.from(email)
        const eE = Buffer.from(expectedEmail)
        const emailMatch =
            eB.length === eE.length && crypto.timingSafeEqual(eB, eE)

        let passMatch = false
        if (expectedPass.startsWith('$2b$') || expectedPass.startsWith('$2a$')) {
            passMatch = await bcrypt.compare(password, expectedPass)
        } else {
            const pB = Buffer.from(password)
            const pE = Buffer.from(expectedPass)
            passMatch = pB.length === pE.length && crypto.timingSafeEqual(pB, pE)
        }

        if (emailMatch && passMatch) {
            const token = jwt.sign(
                { email, name: 'Super Admin', isAdmin: true, role: 'super_admin' },
                process.env.JWT_SECRET,
                { expiresIn: JWT_EXPIRY }
            )
            return res.json({ success: true, token })
        }

        const user = await userModel
            .findOne({ email, role: { $in: ['admin', 'staff', 'bloger'] } })
            .select('+password name role isBlocked loginAttempts lockUntil')
            .lean()

        if (!user)
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' })

        if (user.isBlocked)
            return res.status(403).json({ success: false, message: 'Account has been suspended' })

        if (user.lockUntil > Date.now())
            return res.status(423).json({ success: false, message: 'Account locked. Try again later.' })

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            const attempts = (user.loginAttempts || 0) + 1
            const update = { loginAttempts: attempts }
            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                update.lockUntil = Date.now() + LOCK_DURATION_MS
                update.loginAttempts = 0
            }
            await userModel.updateOne({ _id: user._id }, { $set: update })
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' })
        }

        await userModel.updateOne(
            { _id: user._id },
            { $set: { loginAttempts: 0, lockUntil: 0 } }
        )

        const token = jwt.sign(
            { id: user._id, name: user.name, role: user.role, email: user.email, isAdmin: true },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        )
        res.json({ success: true, token })
    } catch (error) {
        console.error('[adminLogin]', error.message)
        res.status(500).json({ success: false, message: 'Admin login failed.' })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// POST /api/user/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email || '')
        if (!email || !validator.isEmail(email))
            return res.status(400).json({ success: false, message: 'A valid email is required' })

        const SAFE_RESPONSE = { success: true, message: 'If an account exists, a reset link has been sent.' }

        const user = await userModel.findOne({ email }).lean()
        if (!user) return res.json(SAFE_RESPONSE)

        if (user.authProvider === 'google' && !user.password)
            return res.json(SAFE_RESPONSE)

        const rawToken    = crypto.randomBytes(40).toString('hex')
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
        const expiry      = Date.now() + RESET_TTL_MS

        await userModel.findByIdAndUpdate(user._id, {
            resetToken:       hashedToken,
            resetTokenExpiry: expiry,
        })

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&id=${user._id}`

        await sendEmail({
            to:      user.email,
            subject: 'Reset your Amulya Electronics password',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px">
                    <h2 style="color:#1e3a5f">Reset Your Password</h2>
                    <p>Hi <strong>${sanitize(user.name)}</strong>,</p>
                    <p>We received a request to reset your password. This link expires in <strong>1 hour</strong>.</p>
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0">
                        Reset Password
                    </a>
                    <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
                    <p style="color:#9ca3af;font-size:11px">Amulya Electronics · Dharwad, Karnataka</p>
                </div>
            `,
        })

        res.json(SAFE_RESPONSE)
    } catch (error) {
        console.error('[forgotPassword]', error.message)
        res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// POST /api/user/reset-password
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
    try {
        const userId      = sanitize(req.body.userId      || '')
        const token       = sanitize(req.body.token       || '')
        const newPassword = String(req.body.newPassword   || '')

        if (!userId || !token || !newPassword)
            return res.status(400).json({ success: false, message: 'All fields are required' })

        if (!STRONG_PW_RE.test(newPassword))
            return res.status(400).json({
                success: false,
                message: 'Password must be 8–128 chars and include uppercase, lowercase, number, and special character',
            })

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

        const user = await userModel.findOne({
            _id:              userId,
            resetToken:       hashedToken,
            resetTokenExpiry: { $gt: Date.now() },
        })

        if (!user)
            return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' })

        const hashedPass = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

        await userModel.findByIdAndUpdate(userId, {
            password:         hashedPass,
            resetToken:       '',
            resetTokenExpiry: 0,
            loginAttempts:    0,
            lockUntil:        0,
        })

        res.json({ success: true, message: 'Password reset successfully. Please log in.' })
    } catch (error) {
        console.error('[resetPassword]', error.message)
        res.status(500).json({ success: false, message: 'Password reset failed. Please try again.' })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE
// POST /api/user/profile
// ─────────────────────────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
    try {
        const userId = req.userId
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

        const user = await userModel
            .findById(userId)
            .select('-password -resetToken -resetTokenExpiry -verifyToken -__v')
            .lean()

        if (!user) return res.status(404).json({ success: false, message: 'User not found' })
        res.json({ success: true, user })
    } catch (error) {
        console.error('[getUserProfile]', error.message)
        res.status(500).json({ success: false, message: 'Failed to fetch profile' })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE
// POST /api/user/update-profile
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

        const name   = sanitize(req.body.name   || '')
        const phone  = sanitize(req.body.phone  || '')
        const avatar = req.body.avatar || ''

        const updates = {}

        if (name) {
            if (name.length < 2 || name.length > 80)
                return res.status(400).json({ success: false, message: 'Name must be 2–80 characters' })
            if (!/^[\p{L}\p{M}'\- ]+$/u.test(name))
                return res.status(400).json({ success: false, message: 'Name contains invalid characters' })
            updates.name = name
        }

        if (phone) {
            const digits = phone.replace(/[\s\-().+]/g, '').replace(/^(91|0)/, '')
            if (!/^[6-9]\d{9}$/.test(digits))
                return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number' })
            updates.phone = phone
        }

        if (avatar) {
            if (avatar.startsWith('data:')) {
                const mime = base64Mime(avatar)
                if (!ALLOWED_MIME.includes(mime))
                    return res.status(400).json({ success: false, message: `Invalid image type: ${mime}. Allowed: JPG, PNG, WebP, GIF` })

                const sizeBytes = base64ByteSize(avatar)
                if (sizeBytes > MAX_AVATAR_BYTES)
                    return res.status(400).json({ success: false, message: `Image too large (${(sizeBytes / 1024 / 1024).toFixed(1)} MB). Max is 5 MB.` })

                try {
                    const matches = avatar.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
                    if (!matches) return res.status(400).json({ success: false, message: 'Invalid image format' })

                    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
                    const buffer = Buffer.from(matches[2], 'base64')

                    const avatarDir = path.resolve('uploads/avatars')
                    mkdirSync(avatarDir, { recursive: true })

                    const filename = `avatar-${userId}-${Date.now()}.${ext}`
                    const filepath = path.join(avatarDir, filename)
                    writeFileSync(filepath, buffer)

                    const currentUser = await userModel.findById(userId).select('avatar').lean()
                    if (currentUser?.avatar?.startsWith('/uploads/')) {
                        const oldPath = `.${currentUser.avatar}`
                        try { if (existsSync(oldPath)) rmSync(oldPath) } catch {}
                    }

                    updates.avatar = `/uploads/avatars/${filename}`
                } catch (uploadErr) {
                    console.error('[updateProfile] Avatar upload error:', uploadErr.message)
                    return res.status(500).json({ success: false, message: 'Avatar upload failed. Please try again.' })
                }

            } else if (avatar.startsWith('https://')) {
                updates.avatar = avatar

            } else if (avatar === 'remove') {
                const currentUser = await userModel.findById(userId).select('avatar').lean()
                if (currentUser?.avatar?.startsWith('/uploads/')) {
                    const oldPath = `.${currentUser.avatar}`
                    try { if (existsSync(oldPath)) rmSync(oldPath) } catch {}
                }
                updates.avatar = ''
            }
        }

        if (Object.keys(updates).length === 0)
            return res.json({ success: true, message: 'No changes to save' })

        const updatedUser = await userModel
            .findByIdAndUpdate(userId, updates, { new: true })
            .select('-password -resetToken -resetTokenExpiry -verifyToken -__v')
            .lean()

        res.json({ success: true, message: 'Profile updated', user: updatedUser })
    } catch (error) {
        console.error('[updateProfile]', error.message)
        res.status(500).json({ success: false, message: 'Profile update failed. Please try again.' })
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const listAdminUsers = async (req, res) => {
    try {
        const users = await userModel
            .find({ role: { $in: ['admin', 'staff', 'bloger'] } })
            .select('name email role isBlocked date createdAt')
            .sort({ createdAt: -1 })
            .lean()

        res.json({ success: true, users })
    } catch (error) {
        console.error('[listAdminUsers]', error.message)
        res.status(500).json({ success: false, message: 'Failed to fetch admin users' })
    }
}

const addAdminUser = async (req, res) => {
    try {
        const name     = sanitize(req.body.name     || '')
        const email    = normalizeEmail(req.body.email || '')
        const password = String(req.body.password   || '')
        const role     = req.body.role === 'bloger' ? 'bloger' : req.body.role === 'staff' ? 'staff' : 'admin'

        if (!name || !email || !password)
            return res.status(400).json({ success: false, message: 'Name, email and password are required' })

        if (!validator.isEmail(email))
            return res.status(400).json({ success: false, message: 'Valid email required' })

        if (!STRONG_PW_RE.test(password))
            return res.status(400).json({ success: false, message: 'Password must be 8+ chars with uppercase, lowercase, number and special character' })

        const exists = await userModel.findOne({ email }).select('_id').lean()
        if (exists)
            return res.status(409).json({ success: false, message: 'User with this email already exists' })

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
        const user = await userModel.create({
            name,
            email,
            password: hashedPassword,
            role,
            authProvider: 'local',
            isVerified: true,
        })

        res.status(201).json({
            success: true,
            message: `${role === 'admin' ? 'Admin' : role === 'bloger' ? 'Bloger' : 'Staff'} user created`,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        })
    } catch (error) {
        console.error('[addAdminUser]', error.message)
        res.status(500).json({ success: false, message: 'Failed to create user' })
    }
}

const updateAdminUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body

        if (!userId || !role)
            return res.status(400).json({ success: false, message: 'userId and role are required' })

        if (!['admin', 'staff', 'bloger'].includes(role))
            return res.status(400).json({ success: false, message: 'Role must be admin, staff, or bloger' })

        const user = await userModel.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('name email role').lean()

        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        res.json({ success: true, message: 'Role updated', user })
    } catch (error) {
        console.error('[updateAdminUserRole]', error.message)
        res.status(500).json({ success: false, message: 'Failed to update role' })
    }
}

const changeAdminUserPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body

        if (!userId || !newPassword)
            return res.status(400).json({ success: false, message: 'userId and newPassword are required' })

        if (!STRONG_PW_RE.test(newPassword))
            return res.status(400).json({ success: false, message: 'Password must be 8+ chars with uppercase, lowercase, number and special character' })

        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
        const user = await userModel.findByIdAndUpdate(
            userId,
            { password: hashedPassword },
            { new: true }
        ).select('name email').lean()

        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        res.json({ success: true, message: 'Password changed successfully' })
    } catch (error) {
        console.error('[changeAdminUserPassword]', error.message)
        res.status(500).json({ success: false, message: 'Failed to change password' })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE OWN PASSWORD  (self-service for any authenticated user)
// POST /api/user/change-password
// ─────────────────────────────────────────────────────────────────────────────
const changeOwnPassword = async (req, res) => {
    try {
        const userId = req.userId
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword)
            return res.status(400).json({ success: false, message: 'Current password and new password are required' })

        if (!STRONG_PW_RE.test(newPassword))
            return res.status(400).json({ success: false, message: 'Password must be 8+ chars with uppercase, lowercase, number and special character' })

        if (currentPassword === newPassword)
            return res.status(400).json({ success: false, message: 'New password must be different from current password' })

        const user = await userModel.findById(userId).select('+password').lean()
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' })

        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
        await userModel.findByIdAndUpdate(userId, { password: hashedPassword })

        res.json({ success: true, message: 'Password changed successfully' })
    } catch (error) {
        console.error('[changeOwnPassword]', error.message)
        res.status(500).json({ success: false, message: 'Failed to change password' })
    }
}

const deleteAdminUser = async (req, res) => {
    try {
        const { userId } = req.body

        if (!userId) return res.status(400).json({ success: false, message: 'userId is required' })

        const user = await userModel.findById(userId).select('role').lean()
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })
        if (user.role === 'super_admin')
            return res.status(400).json({ success: false, message: 'Cannot delete super admin' })

        let deletedOrders = 0
        let cartDeleted = false
        try {
            const [delResult, cartResult] = await Promise.all([
                Order.deleteMany({ userId }),
                Cart.deleteOne({ user: userId }),
            ])
            deletedOrders = delResult?.deletedCount || 0
            cartDeleted = (cartResult?.deletedCount || 0) > 0
        } catch (cleanupErr) {
            console.error('[deleteAdminUser] cleanup error:', cleanupErr.message)
        }

        await userModel.findByIdAndDelete(userId)

        const parts = []
        if (deletedOrders > 0) parts.push(`${deletedOrders} order(s)`)
        if (cartDeleted) parts.push('cart')
        const suffix = parts.length > 0 ? ` along with ${parts.join(' and ')}` : ''

        res.json({
            success: true,
            message: `User deleted${suffix}`,
        })
    } catch (error) {
        console.error('[deleteAdminUser]', error.message)
        res.status(500).json({ success: false, message: 'Failed to delete user' })
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CUSTOMER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const listCustomers = async (req, res) => {
    try {
        const { search, dateFrom, dateTo, page = 1, limit = 20 } = req.query

        const query = { role: 'customer' }
        if (search) {
            query.$or = [
                { name:  { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ]
        }

        let orderDateFilter = {}
        if (dateFrom || dateTo) {
            if (dateFrom) orderDateFilter.$gte = new Date(dateFrom)
            if (dateTo) {
                const endOfDay = new Date(dateTo)
                endOfDay.setHours(23, 59, 59, 999)
                orderDateFilter.$lte = endOfDay
            }
        }

        const total = await userModel.countDocuments(query)

        const users = await userModel
            .find(query)
            .select('name email phone addresses date createdAt isBlocked')
            .lean()

        const userIds = users.map(u => u._id)
        const orderMatch = { userId: { $in: userIds } }
        const isDateFiltered = Object.keys(orderDateFilter).length > 0
        if (isDateFiltered) {
            orderMatch.createdAt = orderDateFilter
        }
        const orderStats = await Order.aggregate([
            { $match: orderMatch },
            { $sort:  { createdAt: -1 } },
            {
                $group: {
                    _id:            '$userId',
                    totalOrders:    { $sum: 1 },
                    totalSpent:     { $sum: '$grandTotal' },
                    lastOrderDate:  { $max: '$createdAt' },
                    lastOrderId:    { $first: '$_id' },
                    lastOrderNumber:{ $first: '$orderNumber' },
                    lastOrderStatus:{ $first: '$status' },
                    codOrders:      { $sum: { $cond: [{ $eq: ['$payment.method', 'cod'] }, 1, 0] } },
                    razorpayOrders: { $sum: { $cond: [{ $eq: ['$payment.method', 'razorpay'] }, 1, 0] } },
                    pickupOrders:   { $sum: { $cond: [{ $eq: ['$delivery.method', 'pickup'] }, 1, 0] } },
                },
            },
        ])

        const statsMap = {}
        for (const s of orderStats) {
            statsMap[s._id.toString()] = s
        }

        let customers = users.map(u => {
            const s = statsMap[u._id.toString()] || {}
            return {
                _id:            u._id,
                name:           u.name,
                email:          u.email,
                phone:          u.phone,
                date:           u.date,
                createdAt:      u.createdAt,
                isBlocked:      u.isBlocked,
                addresses:      u.addresses,
                totalOrders:    s.totalOrders    || 0,
                totalSpent:     s.totalSpent     || 0,
                lastOrderDate:  s.lastOrderDate  || null,
                lastOrderNumber:s.lastOrderNumber|| '',
                lastOrderStatus:s.lastOrderStatus|| '',
                codOrders:      s.codOrders      || 0,
                razorpayOrders: s.razorpayOrders || 0,
                pickupOrders:   s.pickupOrders   || 0,
            }
        })

        if (isDateFiltered) {
            customers = customers.filter(c => c.totalOrders > 0)
        }

        customers.sort((a, b) => {
            if (a.lastOrderDate && b.lastOrderDate) {
                return new Date(b.lastOrderDate) - new Date(a.lastOrderDate)
            }
            if (a.lastOrderDate) return -1
            if (b.lastOrderDate) return 1
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        })

        const filteredTotal = customers.length
        const pageNum = Number(page)
        const limitNum = Number(limit)
        const skip = (pageNum - 1) * limitNum
        const paginatedCustomers = customers.slice(skip, skip + limitNum)

        res.json({
            success: true,
            customers: paginatedCustomers,
            pagination: {
                total:       filteredTotal,
                page:        pageNum,
                limit:       limitNum,
                totalPages:  Math.ceil(filteredTotal / limitNum) || 1,
            },
        })
    } catch (error) {
        console.error('[listCustomers]', error.message)
        res.status(500).json({ success: false, message: 'Failed to fetch customers' })
    }
}

const getCustomerOrders = async (req, res) => {
    try {
        const { userId } = req.body
        if (!userId) return res.status(400).json({ success: false, message: 'userId is required' })

        const orders = await Order
            .find({ userId })
            .sort({ createdAt: -1 })
            .lean()

        res.json({ success: true, orders })
    } catch (error) {
        console.error('[getCustomerOrders]', error.message)
        res.status(500).json({ success: false, message: 'Failed to fetch customer orders' })
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CUSTOMER 360° VIEW  (enriched profile + LTV + wishlist cross-ref + comms)
// ═══════════════════════════════════════════════════════════════════════════════

const getCustomer360 = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId)
      return res.status(400).json({ success: false, message: "userId is required" });

    const [
      user,
      orderStats,
      monthlyBreakdown,
      orders,
      comms,
      wishlistProducts,
    ] = await Promise.all([
      userModel
        .findById(userId)
        .select("name email phone addresses createdAt isBlocked")
        .lean(),

      Order.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id:            null,
            totalOrders:    { $sum: 1 },
            totalSpent:     { $sum: "$grandTotal" },
            totalPaid:      { $sum: { $cond: [{ $eq: ["$payment.status", "paid"] }, "$grandTotal", 0] } },
            totalSaved:     { $sum: "$savedAmount" },
            avgOrderValue:  { $avg: "$grandTotal" },
            firstOrderDate: { $min: "$createdAt" },
            lastOrderDate:  { $max: "$createdAt" },
            codOrders:      { $sum: { $cond: [{ $eq: ["$payment.method", "cod"] }, 1, 0] } },
            rzpOrders:      { $sum: { $cond: [{ $eq: ["$payment.method", "razorpay"] }, 1, 0] } },
            cancelledOrders:{ $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
            itemsPurchased: { $sum: { $sum: "$items.quantity" } },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: {
              $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
            },
          },
        },
        {
          $group: {
            _id: {
              year:  { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            orders:  { $sum: 1 },
            revenue: { $sum: "$grandTotal" },
            items:   { $sum: { $sum: "$items.quantity" } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
          $project: {
            _id:    0,
            year:   "$_id.year",
            month:  "$_id.month",
            orders: 1,
            revenue: { $round: ["$revenue", 0] },
            items:  1,
          },
        },
      ]),

      Order.find({ userId })
        .select("items orderNumber createdAt")
        .sort({ createdAt: -1 })
        .lean(),

      CustomerCommunication.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),

      (async () => {
        const profile = await userModel
          .findById(userId)
          .select("wishlist")
          .lean();
        if (!profile || !profile.wishlist || profile.wishlist.length === 0)
          return [];
        return productModel
          .find({ _id: { $in: profile.wishlist } })
          .select("name price mrp image category stockCount inStock")
          .lean();
      })(),
    ]);

    if (!user)
      return res.status(404).json({ success: false, message: "Customer not found" });

    const stats = orderStats[0] || {};
    const purchasedProductIds = new Set();
    for (const order of orders) {
      for (const item of order.items || []) {
        if (item.productId) purchasedProductIds.add(item.productId.toString());
      }
    }

    const wishlistWithStatus = wishlistProducts.map((p) => {
      const pid = p._id.toString();
      const alreadyBought = purchasedProductIds.has(pid);
      const lastBoughtOrder = alreadyBought
        ? orders.find((o) =>
            o.items?.some((i) => i.productId?.toString() === pid)
          )
        : null;
      return {
        _id:           p._id,
        name:          p.name,
        price:         p.price,
        mrp:           p.mrp,
        image:         Array.isArray(p.image) ? p.image[0] : p.image,
        category:      p.category,
        inStock:       p.inStock,
        stockCount:    p.stockCount,
        alreadyBought,
        lastBoughtAt:  lastBoughtOrder?.createdAt || null,
        lastOrderNum:  lastBoughtOrder?.orderNumber || "",
      };
    });

    const MONTH_NAMES = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ];
    const now = new Date();
    const last12 = [];
    for (let i = 11; i >= 0; i--) {
      const d       = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year    = d.getFullYear();
      const month   = d.getMonth() + 1;
      const label   = MONTH_NAMES[month - 1];
      const existing = monthlyBreakdown.find(
        (m) => m.year === year && m.month === month
      );
      last12.push({
        year,
        month,
        label: `${label} ${year === now.getFullYear() ? "" : year}`.trim(),
        orders:  existing?.orders  ?? 0,
        revenue: existing?.revenue ?? 0,
        items:   existing?.items   ?? 0,
      });
    }

    const firstOrder = orders.length > 0
      ? orders[orders.length - 1]
      : null;
    const lastOrder  = orders.length > 0 ? orders[0] : null;

    const lifetimeValue = stats.totalSpent || 0;

    res.json({
      success: true,
      data: {
        profile: {
          _id:       user._id,
          name:      user.name,
          email:     user.email,
          phone:     user.phone || "",
          createdAt: user.createdAt,
          isBlocked: user.isBlocked,
          addresses: user.addresses || [],
        },
        stats: {
          totalOrders:      stats.totalOrders    || 0,
          totalSpent:       stats.totalSpent     || 0,
          totalPaid:        stats.totalPaid      || 0,
          totalSaved:       stats.totalSaved     || 0,
          avgOrderValue:    Math.round((stats.avgOrderValue || 0) * 100) / 100,
          lifetimeValue,
          codOrders:        stats.codOrders      || 0,
          rzpOrders:        stats.rzpOrders      || 0,
          cancelledOrders:  stats.cancelledOrders|| 0,
          itemsPurchased:   stats.itemsPurchased || 0,
          firstOrderDate:   firstOrder?.createdAt || null,
          lastOrderDate:    lastOrder?.createdAt  || null,
          firstOrderNumber: firstOrder?.orderNumber || "",
          lastOrderNumber:  lastOrder?.orderNumber  || "",
          monthsActive:     last12.filter((m) => m.orders > 0).length,
        },
        monthlySpending: last12,
        wishlist: wishlistWithStatus,
        communications: comms,
      },
    });
  } catch (error) {
    console.error("[getCustomer360]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch customer 360 data" });
  }
};

// ─── ADD COMMUNICATION ───────────────────────────────────────────────────────
const addCustomerCommunication = async (req, res) => {
  try {
    const { userId, type, subject, body, recipient } = req.body;
    if (!userId || !type)
      return res.status(400).json({ success: false, message: "userId and type are required" });

    const comm = await CustomerCommunication.create({
      userId,
      type: type === "sms" ? "sms" : "email",
      subject: subject || "",
      body:    body    || "",
      recipient: recipient || "",
      sentBy:  req.userId || null,
      status:  "sent",
    });

    res.json({ success: true, message: "Communication logged", communication: comm });
  } catch (error) {
    console.error("[addCustomerCommunication]", error.message);
    res.status(500).json({ success: false, message: "Failed to log communication" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export {
    registerUser,
    loginUser,
    googleLogin,
    adminLogin,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updateProfile,
    listAdminUsers,
    addAdminUser,
    updateAdminUserRole,
    changeAdminUserPassword,
    deleteAdminUser,
    listCustomers,
    getCustomerOrders,
    getCustomer360,
    addCustomerCommunication,
    changeOwnPassword,
    authLimiter,
    resetLimiter,
    updateLimiter,
}
