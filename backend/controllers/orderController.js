// controllers/orderController.js
// ─────────────────────────────────────────────────────────────────────────────
// FIXES:
//  ✅ placeOrderRazorpay — Razorpay order created BEFORE DB save (prevents
//     orphan DB records when Razorpay API fails)
//  ✅ amount always Math.round(grandTotal * 100) — guaranteed integer paise
//  ✅ Response field names match orderSlice exactly:
//     { success, razorpayOrderId, orderId, amount, currency }
//     razorpayOrderId = rpOrder.id  ("order_xxx")
//     orderId         = order._id   (MongoDB _id)
//  ✅ Razorpay init validated — logs warning if keys look wrong
//  ✅ verifyRazorpay — orderId lookup hardened, detailed error on bad signature
//  ✅ All res.json error paths use consistent { success:false, message } shape
//  ✅ Email fire-and-forget preserved
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

// ─── Razorpay client — validate keys at startup ───────────────────────────────
const RZP_KEY_ID     = process.env.RAZORPAY_KEY_ID     || ''
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

// 🔐 SECURITY: Warn loudly in logs if key mode is mismatched
if (!RZP_KEY_ID || !RZP_KEY_SECRET) {
    console.error('[Razorpay] ❌ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from .env')
}
if (RZP_KEY_ID && RZP_KEY_SECRET) {
    const keyMode    = RZP_KEY_ID.startsWith('rzp_live_')  ? 'live' : 'test'
    const secretMode = RZP_KEY_SECRET.startsWith('rzp_live_') ? 'live' : 'test'  // live secrets also start rzp_live_ but are longer
    // Note: live secrets don't actually start with rzp_live_ — they're just long random strings.
    // The REAL check is: if KEY_ID is live, secret must NOT start with rzp_test_
    if (RZP_KEY_ID.startsWith('rzp_live_') && RZP_KEY_SECRET.startsWith('rzp_test_')) {
        console.error(
            '[Razorpay] ❌ KEY MISMATCH: RAZORPAY_KEY_ID is LIVE but RAZORPAY_KEY_SECRET is TEST. ' +
            'This will cause 400 errors on every payment. Fix your .env file.'
        )
    }
    if (RZP_KEY_ID.startsWith('rzp_test_') && !RZP_KEY_SECRET.startsWith('rzp_test_')) {
        console.warn('[Razorpay] ⚠️  KEY_ID is test mode — make sure KEY_SECRET is also test mode.')
    }
}

const razorpay = new Razorpay({
    key_id:     RZP_KEY_ID,
    key_secret: RZP_KEY_SECRET,
})

// ─── Helper: emit new-order event to admin room via Socket.io ───────────────
const emitNewOrder = (req, order) => {
  try {
    const io = req.app?.get('io')
    if (!io) return
    const payload = {
      _id:          order._id,
      orderNumber:  order.orderNumber,
      grandTotal:   order.grandTotal,
      status:       order.status,
      createdAt:    order.createdAt,
      billing:      order.billing ? { firstName: order.billing.firstName } : {},
      payment:      order.payment ? { method: order.payment.method, status: order.payment.status } : {},
      delivery:     order.delivery || {},
    }
    io.to('admin').emit('new-order', payload)
    console.log('[WS] Emitted new-order:', order.orderNumber)
  } catch (err) {
    console.error('[WS] Emit error:', err.message)
  }
}

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
                price:     Number(ci.price)            || 0,
                mrp:       Number(ci.mrp || ci.price)  || 0,
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

// ─── Helper: build billing object from address ────────────────────────────────
const buildBilling = (address, customerNote = '') => ({
    firstName:  address.firstName                    || '',
    lastName:   address.lastName                     || '',
    email:      address.email                        || '',
    phone:      address.phone                        || '',
    address:    address.street || address.address    || '',
    apartment:  address.apartment                    || '',
    city:       address.city                         || '',
    state:      address.state                        || '',
    pincode:    address.pincode                      || '',
    country:    address.country                      || 'India',
    orderNotes: customerNote                         || '',
})

// ─── Helper: compute totals ───────────────────────────────────────────────────
const computeTotals = (builtItems, deliveryCharge = 0) => {
    const subtotal       = builtItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const mrpTotal       = builtItems.reduce((s, i) => s + i.mrp   * i.quantity, 0)
    const grandTotal     = subtotal + deliveryCharge
    return { subtotal, mrpTotal, deliveryCharge, grandTotal }
}

// ─── PLACE ORDER — COD ────────────────────────────────────────────────────────
const placeOrder = async (req, res) => {
    try {
        const { userId, items, address, couponCode, customerNote, deliveryCharge: reqDc = 0, deliveryMethod = 'standard', deliveryName } = req.body
        const dc = Number(reqDc)

        const builtItems              = await buildItems(items)
        const { subtotal, mrpTotal, grandTotal } = computeTotals(builtItems, dc)

        const order = new orderModel({
            userId,
            items:         builtItems,
            billing:       buildBilling(address, customerNote),
            payment:       { method: 'cod', status: 'pending' },
            subtotal,
            mrpTotal,
            delivery:      { method: deliveryMethod, charge: dc, name: deliveryName || 'Standard Delivery', freeDelivery: dc === 0 },
            grandTotal,
            savedAmount:   Math.max(0, mrpTotal - subtotal),
            coupon:        { code: couponCode || '' },
            statusHistory: [{ status: 'placed', message: 'Your order has been placed', at: new Date() }],
            stockDeducted: false,
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })

        await order.save()
        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        // ✅ Fire-and-forget email
        sendOrderConfirmationEmail(order).catch(err =>
            console.error('[placeOrder] Email error:', err.message)
        )

        // 🔔 Emit WebSocket event for real-time dashboard
        emitNewOrder(req, order)

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
//
// FIX ORDER OF OPERATIONS:
//   OLD (buggy): save DB order → create Razorpay order → update DB
//   NEW (fixed): create Razorpay order FIRST → if it fails, no orphan DB record
//                → save DB order with razorpayOrderId already set in one write
//
// RESPONSE FIELD CONTRACT (must match orderSlice.js exactly):
//   razorpayOrderId  = rpOrder.id        ← "order_xxx" passed to SDK as order_id
//   orderId          = order._id         ← MongoDB _id for verify-payment step
//   amount           = rpOrder.amount    ← integer paise (Razorpay returns this)
//   currency         = rpOrder.currency  ← "INR"
//
const placeOrderRazorpay = async (req, res) => {
    try {
        const { userId, items, address, couponCode, customerNote, deliveryCharge: reqDc = 0, deliveryMethod = 'standard', deliveryName } = req.body
        const dc = Number(reqDc)

        const builtItems              = await buildItems(items)
        const { subtotal, mrpTotal, grandTotal } = computeTotals(builtItems, dc)

        // ✅ FIX: Validate amount before calling Razorpay
        const amountPaise = Math.round(grandTotal * 100)
        if (!amountPaise || amountPaise <= 0) {
            return res.json({ success: false, message: 'Invalid order amount.' })
        }

        // ✅ FIX: Create Razorpay order FIRST — before touching DB
        //    If this fails (bad key, network error), we return early with no orphan record.
        let rpOrder
        try {
            rpOrder = await razorpay.orders.create({
                amount:   amountPaise,     // ← integer paise (e.g. 49900 for ₹499)
                currency: 'INR',
                receipt:  `rcpt_${Date.now()}`,   // temporary receipt — updated after DB save
                notes: {
                    customer_name: `${address.firstName || ''} ${address.lastName || ''}`.trim(),
                },
            })
        } catch (rzpErr) {
            console.error('[placeOrderRazorpay] Razorpay order creation failed:', rzpErr)
            return res.json({
                success: false,
                message: rzpErr?.error?.description ||
                         rzpErr?.message            ||
                         'Payment gateway error. Please try again.',
            })
        }

        // ✅ rpOrder.id is the Razorpay order ID ("order_xxx")
        // ✅ rpOrder.amount is the integer paise value Razorpay accepted
        console.log('[placeOrderRazorpay] Razorpay order created:', {
            id:       rpOrder.id,
            amount:   rpOrder.amount,
            currency: rpOrder.currency,
            status:   rpOrder.status,
        })

        // ✅ Now save DB order — with razorpayOrderId already set (single write)
        const order = new orderModel({
            userId,
            items:         builtItems,
            billing:       buildBilling(address, customerNote),
            payment: {
                method:          'razorpay',
                status:          'pending',
                razorpayOrderId: rpOrder.id,   // store immediately — no second update needed
            },
            subtotal,
            mrpTotal,
            delivery:      { method: deliveryMethod, charge: dc, name: deliveryName || 'Standard Delivery', freeDelivery: dc === 0 },
            grandTotal,
            savedAmount:   Math.max(0, mrpTotal - subtotal),
            coupon:        { code: couponCode || '' },
            statusHistory: [{ status: 'placed', message: 'Awaiting payment', at: new Date() }],
            stockDeducted: false,
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })

        await order.save()

        // ✅ RESPONSE — field names match orderSlice.createRazorpayOrder thunk exactly
        res.json({
            success:         true,
            razorpayOrderId: rpOrder.id,       // ← "order_xxx" — SDK needs this as order_id
            orderId:         order._id,         // ← MongoDB _id — needed for verify-payment
            amount:          rpOrder.amount,    // ← integer paise from Razorpay
            currency:        rpOrder.currency,  // ← "INR"
            orderNumber:     order.orderNumber,
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

        // Guard: all four fields must be present
        if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.json({ success: false, message: 'Missing payment verification fields.' })
        }

        // 🔐 HMAC-SHA256 signature verification
        const sign         = `${razorpay_order_id}|${razorpay_payment_id}`
        const expectedSign = crypto
            .createHmac('sha256', RZP_KEY_SECRET)
            .update(sign)
            .digest('hex')

        // 🔐 Constant-time comparison to prevent timing attacks
        const sigBuffer      = Buffer.from(razorpay_signature, 'hex')
        const expectedBuffer = Buffer.from(expectedSign, 'hex')
        const isValid = sigBuffer.length === expectedBuffer.length &&
                        crypto.timingSafeEqual(sigBuffer, expectedBuffer)

        if (!isValid) {
            console.error('[verifyRazorpay] Signature mismatch for orderId:', orderId)
            return res.json({ success: false, message: 'Payment verification failed: invalid signature.' })
        }

        // ✅ Update payment fields on the DB order
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            {
                'payment.method':            'razorpay',
                'payment.status':            'paid',
                'payment.razorpayOrderId':   razorpay_order_id,
                'payment.razorpayPaymentId': razorpay_payment_id,
                'payment.razorpaySignature': razorpay_signature,
                'payment.paidAt':            new Date(),
                $push: {
                    statusHistory: {
                        status:  'confirmed',
                        message: 'Payment confirmed via Razorpay',
                        at:      new Date(),
                    },
                },
            },
            { new: true }
        )

        if (!updatedOrder) {
            console.error('[verifyRazorpay] Order not found in DB:', orderId)
            return res.json({
                success: false,
                message: 'Order not found. Payment was received — please contact support.',
            })
        }

        // Clear cart on backend
        if (updatedOrder.userId) {
            await userModel.findByIdAndUpdate(updatedOrder.userId, { cartData: {} })
        }

        // ✅ Fire-and-forget email
        sendPaymentConfirmationEmail(updatedOrder).catch(err =>
            console.error('[verifyRazorpay] Email error:', err.message)
        )

        // 🔔 Emit WebSocket event for real-time dashboard
        emitNewOrder(req, updatedOrder)

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
        const { status, paymentMethod, deliveryMethod, payment, page = 1, limit = 20, search, startDate, endDate } = req.query

        const query = {}
        if (status)        query.status            = status
        if (paymentMethod) query['payment.method'] = paymentMethod
        if (deliveryMethod) query['delivery.method'] = deliveryMethod
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
            pagination: {
                total,
                page:       Number(page),
                limit:      Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        })
    } catch (error) {
        console.error('allOrders:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── ADMIN: UPDATE STATUS ─────────────────────────────────────────────────────
const STOCK_FIELD = 'stock'

const deductStock = async (order) => {
    const items = order.items ?? [], deducted = [], skipped = [], bulkOps = []
    for (const item of items) {
        const pid = item.productId, qty = Number(item.quantity ?? 1)
        if (!pid || pid === '' || pid === 'unknown') {
            skipped.push({ name: item.name, reason: 'No productId' })
            continue
        }
        bulkOps.push({
            updateOne: {
                filter: { _id: pid },
                update: [{ $set: { [STOCK_FIELD]: { $max: [0, { $subtract: [`$${STOCK_FIELD}`, qty] }] } } }],
            },
        })
        deducted.push({ productId: pid, name: item.name, qty })
    }
    if (bulkOps.length === 0) return { deducted: [], skipped }
    try {
        const result = await productModel.bulkWrite(bulkOps, { ordered: false })
        console.log(`[deductStock] ${order.orderNumber} — ${result.modifiedCount}/${bulkOps.length} updated`)
        return { deducted, skipped }
    } catch (err) {
        console.error(`[deductStock] Error for ${order.orderNumber}:`, err.message)
        return { deducted: [], skipped, error: err.message }
    }
}

const updateStatus = async (req, res) => {
    try {
        const { orderId, status, message, location, trackingNumber, courierName, estimatedDelivery, adminNote } = req.body

        if (!orderId || !status)
            return res.status(400).json({ success: false, message: 'orderId and status are required.' })

        const allowed = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        if (!allowed.includes(status))
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` })

        const order = await orderModel.findById(orderId)
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' })

        order.status = status
        order.pushTracking(status, message || '', location || '', req.user?._id || null)

        if (trackingNumber) { order.tracking.trackingNumber = trackingNumber; order.tracking.trackingId = trackingNumber }
        if (courierName)    { order.tracking.courierName = courierName; order.tracking.provider = courierName }
        if (estimatedDelivery) {
            const parsed = new Date(estimatedDelivery)
            if (isNaN(parsed.getTime()))
                return res.status(400).json({ success: false, message: 'Invalid estimatedDelivery date.' })
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
            message: status === 'delivered'
                ? `Delivered. Stock deducted for ${stockResult?.deducted?.length ?? 0} product(s).`
                : 'Status updated.',
            order,
            stockDeduction: stockResult
                ? { deducted: stockResult.deducted, skipped: stockResult.skipped }
                : null,
        })
    } catch (error) {
        console.error('updateStatus:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// ─── ADMIN: GET NEW ORDERS SINCE TIMESTAMP ────────────────────────────────────
// GET /api/order/new-orders?since=2026-06-01T00:00:00.000Z
// Returns orders created after the given timestamp (for real-time polling)
const getNewOrders = async (req, res) => {
    try {
        const { since } = req.query
        
        const query = {}
        if (since) {
            const sinceDate = new Date(since)
            if (!isNaN(sinceDate.getTime())) {
                query.createdAt = { $gt: sinceDate }
            }
        }
        
        const count = await orderModel.countDocuments(query)
        let orders = []
        if (count > 0) {
            orders = await orderModel
                .find(query)
                .sort({ createdAt: -1 })
                .limit(10)
                .select('orderNumber grandTotal payment.method status createdAt billing.firstName billing.lastName')
                .lean()
        }
        
        res.json({ success: true, newOrders: count, orders })
    } catch (error) {
        console.error('getNewOrders:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── ADMIN: BULK STATUS UPDATE ───────────────────────────────────────────────
// POST /api/order/bulk-status
// Accepts { orderIds: [...], status: 'shipped' }
// Updates all matching orders in one batch
const bulkUpdateStatus = async (req, res) => {
    try {
        const { orderIds, status } = req.body

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0)
            return res.status(400).json({ success: false, message: 'orderIds array is required.' })
        if (!status)
            return res.status(400).json({ success: false, message: 'status is required.' })

        const allowed = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        if (!allowed.includes(status))
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` })

        // Update all matching orders
        const result = await orderModel.updateMany(
            { _id: { $in: orderIds } },
            {
                $set: { status },
                $push: {
                    statusHistory: {
                        status,
                        message: `Bulk update to ${status}`,
                        at: new Date(),
                    },
                },
            }
        )

        res.json({
            success: true,
            message: `${result.modifiedCount} of ${orderIds.length} orders updated to ${status}.`,
            modifiedCount: result.modifiedCount,
        })
    } catch (error) {
        console.error('bulkUpdateStatus:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// ─── ADMIN: PROCESS REFUND ────────────────────────────────────────────────────
const processRefund = async (req, res) => {
    try {
        const { orderId, refundAmount, refundStatus } = req.body
        await orderModel.findByIdAndUpdate(orderId, {
            refundAmount,
            refundStatus,
            'payment.status': 'refunded',
        })
        if (refundStatus === 'Processed') {
            const order = await orderModel.findById(orderId)
            await userModel.findByIdAndUpdate(order.userId, {
                $inc: { walletBalance: Number(refundAmount) },
            })
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
    getNewOrders, bulkUpdateStatus,
}