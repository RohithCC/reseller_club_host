// controllers/orderController.js
// ─────────────────────────────────────────────────────────────────────────────
// ✅ Email confirmation sent:
//    - COD order  → sendOrderConfirmationEmail()   after order.save()
//    - Razorpay   → sendPaymentConfirmationEmail()  after signature verified
//
// Both emails are fire-and-forget (non-blocking) — email failure never
// breaks the order response to the frontend.
// ─────────────────────────────────────────────────────────────────────────────

import orderModel   from '../models/Order.js'
import userModel    from '../models/userModel.js'
import productModel from '../models/productModel.js'
import Razorpay     from 'razorpay'
import crypto       from 'crypto'
import {
    sendOrderConfirmationEmail,
    sendPaymentConfirmationEmail,
} from '../services/emailService.js'

const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ─── Helper: build order items ────────────────────────────────────────────────
const buildItems = async (cartItems) => {
    const items = []
    for (const ci of cartItems) {
        if (ci.name && ci.price !== undefined) {
            const rawImage = Array.isArray(ci.image) ? ci.image[0] : (ci.image || '')
            items.push({
                productId: ci.productId || ci._id || ci.id || '',
                name:      ci.name,
                image:     rawImage,
                price:     Number(ci.price)             || 0,
                mrp:       Number(ci.mrp  || ci.price)  || 0,
                quantity:  Number(ci.quantity ?? ci.qty ?? 1),
                subcat:    ci.subcat || ci.category || '',
            })
            continue
        }
        const p = await productModel.findById(ci.productId)
        if (!p) throw new Error(`Product ${ci.productId} not found`)
        items.push({
            productId: p._id.toString(),
            name:      p.name,
            image:     Array.isArray(p.image) ? p.image[0] : (p.image || ''),
            price:     p.price,
            mrp:       p.mrp || p.originalPrice || p.price,
            quantity:  Number(ci.quantity ?? ci.qty ?? 1),
            subcat:    p.subcat || p.category || '',
        })
    }
    return items
}

// ─── PLACE ORDER — COD ────────────────────────────────────────────────────────
const placeOrder = async (req, res) => {
    try {
        const { userId, items, address, couponCode, customerNote } = req.body

        const builtItems     = await buildItems(items)
        const subtotal       = builtItems.reduce((s, i) => s + i.price * i.quantity, 0)
        const mrpTotal       = builtItems.reduce((s, i) => s + i.mrp   * i.quantity, 0)
        const deliveryCharge = subtotal >= 499 ? 0 : 50
        const grandTotal     = subtotal + deliveryCharge

        const order = new orderModel({
            userId,
            items: builtItems,
            billing: {
                firstName:  address.firstName              || '',
                lastName:   address.lastName               || '',
                email:      address.email                  || '',
                phone:      address.phone                  || '',
                address:    address.street || address.address || '',
                apartment:  address.apartment              || '',
                city:       address.city                   || '',
                state:      address.state                  || '',
                pincode:    address.pincode                || '',
                country:    address.country                || 'India',
                orderNotes: customerNote                   || '',
            },
            payment:       { method: 'cod', status: 'pending' },
            subtotal,
            mrpTotal,
            deliveryCharge,
            grandTotal,
            savedAmount:   Math.max(0, mrpTotal - subtotal),
            coupon:        { code: couponCode || '' },
            statusHistory: [{ status: 'placed', message: 'Your order has been placed', at: new Date() }],
            stockDeducted: false,
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })

        await order.save()
        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        // ✅ Send COD order confirmation email — fire-and-forget
        sendOrderConfirmationEmail(order).catch(err =>
            console.error('[placeOrder] Email error:', err.message)
        )

        res.json({
            success:     true,
            message:     'Order Placed',
            orderId:     order._id,
            orderNumber: order.orderNumber,
        })
    } catch (error) {
        console.error('placeOrder:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── PLACE ORDER — RAZORPAY ───────────────────────────────────────────────────
// No email here — email fires only after payment is verified below.
const placeOrderRazorpay = async (req, res) => {
    try {
        const { userId, items, address, couponCode, customerNote } = req.body

        const builtItems     = await buildItems(items)
        const subtotal       = builtItems.reduce((s, i) => s + i.price * i.quantity, 0)
        const mrpTotal       = builtItems.reduce((s, i) => s + i.mrp   * i.quantity, 0)
        const deliveryCharge = subtotal >= 499 ? 0 : 50
        const grandTotal     = subtotal + deliveryCharge

        const order = new orderModel({
            userId,
            items: builtItems,
            billing: {
                firstName:  address.firstName              || '',
                lastName:   address.lastName               || '',
                email:      address.email                  || '',
                phone:      address.phone                  || '',
                address:    address.street || address.address || '',
                apartment:  address.apartment              || '',
                city:       address.city                   || '',
                state:      address.state                  || '',
                pincode:    address.pincode                || '',
                country:    address.country                || 'India',
                orderNotes: customerNote                   || '',
            },
            payment:       { method: 'razorpay', status: 'pending' },
            subtotal,
            mrpTotal,
            deliveryCharge,
            grandTotal,
            savedAmount:   Math.max(0, mrpTotal - subtotal),
            coupon:        { code: couponCode || '' },
            statusHistory: [{ status: 'placed', message: 'Awaiting payment', at: new Date() }],
            stockDeducted: false,
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })

        await order.save()

        const rpOrder = await razorpay.orders.create({
            amount:   Math.round(grandTotal * 100),
            currency: 'INR',
            receipt:  order._id.toString(),
        })

        await orderModel.findByIdAndUpdate(order._id, { 'payment.razorpayOrderId': rpOrder.id })

        res.json({
            success:         true,
            orderId:         order._id,
            orderNumber:     order.orderNumber,
            razorpayOrderId: rpOrder.id,
            amount:          rpOrder.amount,
            currency:        rpOrder.currency,
            key:             process.env.RAZORPAY_KEY_ID,
        })
    } catch (error) {
        console.error('placeOrderRazorpay:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── VERIFY RAZORPAY PAYMENT ──────────────────────────────────────────────────
const verifyRazorpay = async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

        // 🔐 HMAC-SHA256 signature verification
        const sign         = razorpay_order_id + '|' + razorpay_payment_id
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest('hex')

        if (expectedSign !== razorpay_signature)
            return res.json({ success: false, message: 'Payment verification failed' })

        // ✅ Update payment fields
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            {
                'payment.method':            'razorpay',
                'payment.status':            'paid',
                'payment.razorpayOrderId':   razorpay_order_id,
                'payment.razorpayPaymentId': razorpay_payment_id,
                'payment.razorpaySignature': razorpay_signature,
                'payment.paidAt':            new Date(),
                $push: { statusHistory: { status: 'confirmed', message: 'Payment confirmed', at: new Date() } },
            },
            { new: true }   // ← return the updated document for the email
        )

        if (updatedOrder?.userId) {
            await userModel.findByIdAndUpdate(updatedOrder.userId, { cartData: {} })
        }

        // ✅ Send Razorpay payment confirmation email — fire-and-forget
        if (updatedOrder) {
            sendPaymentConfirmationEmail(updatedOrder).catch(err =>
                console.error('[verifyRazorpay] Email error:', err.message)
            )
        }

        res.json({ success: true, message: 'Payment Verified' })
    } catch (error) {
        console.error('verifyRazorpay:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── USER: GET MY ORDERS ──────────────────────────────────────────────────────
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body
        const orders = await orderModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .select('-adminNote -stockDeducted')
            .lean()
        res.json({ success: true, orders })
    } catch (error) {
        console.error('userOrders:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── USER: SINGLE ORDER DETAIL ────────────────────────────────────────────────
const orderDetail = async (req, res) => {
    try {
        const { orderId, userId } = req.body
        const order = await orderModel
            .findOne({ _id: orderId, userId })
            .select('-adminNote -stockDeducted')
            .lean()
        if (!order) return res.json({ success: false, message: 'Order not found' })
        res.json({ success: true, order })
    } catch (error) {
        console.error('orderDetail:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── USER: CANCEL ORDER ───────────────────────────────────────────────────────
const cancelOrder = async (req, res) => {
    try {
        const { orderId, userId, cancelReason } = req.body
        const order = await orderModel.findOne({ _id: orderId, userId })
        if (!order) return res.json({ success: false, message: 'Order not found' })

        const cancellable = ['placed', 'confirmed', 'processing']
        if (!cancellable.includes(order.status))
            return res.json({ success: false, message: `Cannot cancel order in "${order.status}" status` })

        order.status = 'cancelled'
        order.pushTracking('cancelled', cancelReason || 'Cancelled by customer', '', null)
        await order.save()

        res.json({ success: true, message: 'Order Cancelled' })
    } catch (error) {
        console.error('cancelOrder:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── USER: REQUEST RETURN ─────────────────────────────────────────────────────
const requestReturn = async (req, res) => {
    try {
        const { orderId, userId, returnReason } = req.body
        const order = await orderModel.findOne({ _id: orderId, userId })
        if (!order) return res.json({ success: false, message: 'Order not found' })
        if (order.status !== 'delivered')
            return res.json({ success: false, message: 'Only delivered orders can be returned' })

        order.pushTracking('refunded', returnReason || 'Return requested by customer', '', null)
        await order.save()
        res.json({ success: true, message: 'Return request submitted' })
    } catch (error) {
        console.error('requestReturn:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── ADMIN: ALL ORDERS ────────────────────────────────────────────────────────
const allOrders = async (req, res) => {
    try {
        const { status, paymentMethod, payment, page = 1, limit = 20, search, startDate, endDate } = req.query

        const query = {}
        if (status)                          query.status            = status
        if (paymentMethod)                   query['payment.method'] = paymentMethod
        if (payment !== undefined && payment !== '')
            query['payment.status'] = payment === 'true' ? 'paid' : 'pending'
        if (search) query.orderNumber = { $regex: search, $options: 'i' }
        if (startDate || endDate) {
            query.createdAt = {}
            if (startDate) query.createdAt.$gte = new Date(Number(startDate))
            if (endDate)   query.createdAt.$lte = new Date(Number(endDate))
        }

        const skip   = (Number(page) - 1) * Number(limit)
        const total  = await orderModel.countDocuments(query)
        const orders = await orderModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean()

        res.json({
            success: true,
            orders,
            pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
        })
    } catch (error) {
        console.error('allOrders:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── ADMIN: UPDATE STATUS ─────────────────────────────────────────────────────
const STOCK_FIELD = 'stock'   // ← change to match your productModel field

const deductStock = async (order) => {
    const items = order.items ?? [], deducted = [], skipped = [], bulkOps = []
    for (const item of items) {
        const pid = item.productId, qty = Number(item.quantity ?? 1)
        if (!pid || pid === '' || pid === 'unknown') { skipped.push({ name: item.name, reason: 'No productId' }); continue }
        bulkOps.push({ updateOne: { filter: { _id: pid }, update: [{ $set: { [STOCK_FIELD]: { $max: [0, { $subtract: [`$${STOCK_FIELD}`, qty] }] } } }] } })
        deducted.push({ productId: pid, name: item.name, qty })
    }
    if (bulkOps.length === 0) return { deducted: [], skipped }
    try {
        const result = await productModel.bulkWrite(bulkOps, { ordered: false })
        console.log(`[deductStock] ${order.orderNumber} — ${result.modifiedCount}/${bulkOps.length} products updated`)
        return { deducted, skipped }
    } catch (err) {
        console.error(`[deductStock] Error for ${order.orderNumber}:`, err.message)
        return { deducted: [], skipped, error: err.message }
    }
}

const updateStatus = async (req, res) => {
    try {
        const { orderId, status, message, location, trackingNumber, courierName, estimatedDelivery, adminNote } = req.body

        if (!orderId || !status) return res.status(400).json({ success: false, message: 'orderId and status are required.' })

        const allowed = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        if (!allowed.includes(status)) return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` })

        const order = await orderModel.findById(orderId)
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' })

        order.status = status
        order.pushTracking(status, message || '', location || '', req.user?._id || null)

        if (trackingNumber) { order.tracking.trackingNumber = trackingNumber; order.tracking.trackingId = trackingNumber }
        if (courierName)    { order.tracking.courierName = courierName; order.tracking.provider = courierName }
        if (estimatedDelivery) {
            const parsed = new Date(estimatedDelivery)
            if (isNaN(parsed.getTime())) return res.status(400).json({ success: false, message: 'Invalid estimatedDelivery date.' })
            order.estimatedDelivery = parsed
        }
        if (typeof adminNote === 'string') order.adminNote = adminNote

        // COD → auto-pay on delivery
        if (status === 'delivered' && order.payment?.method === 'cod' && order.payment?.status === 'pending') {
            order.payment.status = 'paid'
            order.payment.paidAt = new Date()
        }

        // Stock deduction — first delivery only
        let stockResult = null
        if (status === 'delivered' && !order.stockDeducted) {
            stockResult = await deductStock(order)
            order.stockDeducted = true
            if (stockResult.deducted.length > 0) {
                const summary = stockResult.deducted.map(d => `${d.name} ×${d.qty}`).join(', ')
                order.pushTracking('delivered', `Stock deducted: ${summary}`, '', req.user?._id || null)
            }
        }

        await order.save()

        res.json({
            success: true,
            message: status === 'delivered' ? `Delivered. Stock deducted for ${stockResult?.deducted?.length ?? 0} product(s).` : 'Status updated.',
            order,
            stockDeduction: stockResult ? { deducted: stockResult.deducted, skipped: stockResult.skipped } : null,
        })
    } catch (error) {
        console.error('updateStatus:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// ─── ADMIN: PROCESS REFUND ────────────────────────────────────────────────────
const processRefund = async (req, res) => {
    try {
        const { orderId, refundAmount, refundStatus } = req.body
        await orderModel.findByIdAndUpdate(orderId, { refundAmount, refundStatus, 'payment.status': 'refunded' })
        if (refundStatus === 'Processed') {
            const order = await orderModel.findById(orderId)
            await userModel.findByIdAndUpdate(order.userId, { $inc: { walletBalance: Number(refundAmount) } })
        }
        res.json({ success: true, message: 'Refund processed' })
    } catch (error) {
        console.error('processRefund:', error)
        res.json({ success: false, message: error.message })
    }
}

export {
    placeOrder, placeOrderRazorpay, verifyRazorpay,
    userOrders, orderDetail, cancelOrder, requestReturn,
    allOrders, updateStatus, processRefund,
}