import jwt from 'jsonwebtoken'

const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.token || req.headers.authorization?.split(' ')[1]

        if (!token) {
            return res.json({ success: false, message: 'No token provided' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (!decoded.isAdmin) {
            return res.json({ success: false, message: 'Not Authorized' })
        }

        next()

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { adminAuth }