// middleware/adminAuth.js
// Role-based authorization for admin panel users.
// Roles: super_admin (env-var), admin (DB), staff (DB - limited)

import jwt from 'jsonwebtoken'

// Generic auth: any admin panel user (super_admin, admin, staff)
const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.token || req.headers.authorization?.split(' ')[1]
        if (!token) return res.json({ success: false, message: 'No token provided' })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isAdmin && !decoded.role) return res.json({ success: false, message: 'Not Authorized' })

        req.adminRole = decoded.role || 'super_admin'
        req.adminUserId = decoded.id || null
        req.adminEmail = decoded.email || ''
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Super-admin only (user management)
const superAdminAuth = async (req, res, next) => {
    try {
        const token = req.headers.token || req.headers.authorization?.split(' ')[1]
        if (!token) return res.json({ success: false, message: 'No token provided' })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isAdmin) return res.json({ success: false, message: 'Super admin only' })

        req.adminRole = 'super_admin'
        req.adminUserId = decoded.id || null
        req.adminEmail = decoded.email || ''
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Staff or above (orders + products access)
const staffOrAboveAuth = async (req, res, next) => {
    try {
        const token = req.headers.token || req.headers.authorization?.split(' ')[1]
        if (!token) return res.json({ success: false, message: 'No token provided' })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isAdmin && !decoded.role) return res.json({ success: false, message: 'Not Authorized' })

        const role = decoded.role || 'super_admin'
        if (!['super_admin', 'admin', 'staff'].includes(role)) return res.json({ success: false, message: 'Insufficient permissions' })

        req.adminRole = role
        req.adminUserId = decoded.id || null
        req.adminEmail = decoded.email || ''
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Admin or Super Admin only (rejects staff)
const adminOrSuperAdminAuth = async (req, res, next) => {
    try {
        const token = req.headers.token || req.headers.authorization?.split(' ')[1]
        if (!token) return res.json({ success: false, message: 'No token provided' })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isAdmin && !decoded.role) return res.json({ success: false, message: 'Not Authorized' })

        const role = decoded.role || 'super_admin'
        if (!['super_admin', 'admin'].includes(role)) return res.json({ success: false, message: 'Insufficient permissions' })

        req.adminRole = role
        req.adminUserId = decoded.id || null
        req.adminEmail = decoded.email || ''
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Generic role check — pass allowed roles array
const roleAuth = (allowedRoles) => async (req, res, next) => {
    try {
        const token = req.headers.token || req.headers.authorization?.split(' ')[1]
        if (!token) return res.json({ success: false, message: 'No token provided' })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isAdmin && !decoded.role) return res.json({ success: false, message: 'Not Authorized' })

        const role = decoded.role || 'super_admin'
        if (!allowedRoles.includes(role)) return res.json({ success: false, message: 'Insufficient permissions' })

        req.adminRole = role
        req.adminUserId = decoded.id || null
        req.adminEmail = decoded.email || ''
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const blogerOrAboveAuth = roleAuth(['bloger', 'staff', 'admin', 'super_admin'])
const blogerAdminOrSuperAdminAuth = roleAuth(['bloger', 'admin', 'super_admin'])

export { adminAuth, superAdminAuth, staffOrAboveAuth, adminOrSuperAdminAuth, blogerOrAboveAuth, blogerAdminOrSuperAdminAuth }
