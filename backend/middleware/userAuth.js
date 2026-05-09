// middleware/userAuth.js
// ─────────────────────────────────────────────────────────────────────────────
// JWT verification middleware for user-protected routes.
//
// ✅ Reads token from Authorization header (Bearer scheme) OR req.headers.token
//    — supports both patterns used across the codebase
// ✅ Sets req.userId from the verified JWT payload — NEVER from req.body
// ✅ Checks user still exists + not blocked (prevents access with old token
//    after account suspension or deletion)
// ✅ Token expiry, malformed token, and tampering all return 401
// ✅ No stack traces leaked to client
// ─────────────────────────────────────────────────────────────────────────────

import jwt       from 'jsonwebtoken'
import userModel from '../models/userModel.js'

export const userAuth = async (req, res, next) => {
    try {
        // ── Extract token ──────────────────────────────────────────────────────
        // Support both Authorization: Bearer <token>  AND  headers.token
        let token = null

        const authHeader = req.headers.authorization || req.headers.Authorization
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7).trim()
        } else if (req.headers.token) {
            token = String(req.headers.token).trim()
        }

        if (!token)
            return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' })

        // ── Verify signature + expiry ──────────────────────────────────────────
        let decoded
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET)
        } catch (jwtErr) {
            // Distinguish expiry from tampering for better UX messaging
            if (jwtErr.name === 'TokenExpiredError')
                return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
            return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' })
        }

        if (!decoded?.id)
            return res.status(401).json({ success: false, message: 'Invalid token payload.' })

        // ── Check user still exists and is not blocked ─────────────────────────
        // This catches: deleted accounts, suspended accounts, password resets
        // (for password-reset revocation, store a tokenVersion in userModel and
        //  compare decoded.iat against user.passwordChangedAt — see note below)
        const user = await userModel
            .findById(decoded.id)
            .select('_id isBlocked')
            .lean()

        if (!user)
            return res.status(401).json({ success: false, message: 'Account not found. Please log in again.' })

        if (user.isBlocked)
            return res.status(403).json({ success: false, message: 'Your account has been suspended.' })

        // ── Attach userId to request — used by controllers ─────────────────────
        // Controllers read req.userId — NEVER req.body.userId for protected ops
        req.userId = decoded.id

        next()
    } catch (error) {
        // Do not leak internal errors to client
        console.error('[userAuth]', error.message)
        res.status(500).json({ success: false, message: 'Authentication error. Please try again.' })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTE — Optional: Token revocation on password change
// Add to userModel:  passwordChangedAt: { type: Date, default: null }
// Add to loginUser:  passwordChangedAt: new Date()   (on every password change)
//
// Then add this check in userAuth after the user fetch:
//
//   if (user.passwordChangedAt) {
//     const changedTs = Math.floor(user.passwordChangedAt.getTime() / 1000)
//     if (decoded.iat < changedTs) {
//       return res.status(401).json({
//         success: false,
//         message: 'Password was recently changed. Please log in again.'
//       })
//     }
//   }
//
// This invalidates ALL tokens issued before the last password change,
// so a stolen old token can't be used after the user resets their password.
// ─────────────────────────────────────────────────────────────────────────────