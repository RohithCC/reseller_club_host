// routes/orderRoute.js
import express    from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import { userAuth }  from '../middleware/userAuth.js'
import {
    placeOrder, placeOrderRazorpay, verifyRazorpay,
    userOrders, orderDetail, cancelOrder, requestReturn,
    allOrders, updateStatus, processRefund,
    getNewOrders, bulkUpdateStatus
} from '../controllers/orderController.js'

const orderRouter = express.Router()

// ── User routes ───────────────────────────────────────────────────────────────
orderRouter.post('/place',          userAuth,  placeOrder)
orderRouter.post('/razorpay',       userAuth,  placeOrderRazorpay)
orderRouter.post('/verify-payment', userAuth,  verifyRazorpay)
orderRouter.post('/my-orders',      userAuth,  userOrders)
orderRouter.post('/detail',         userAuth,  orderDetail)
orderRouter.post('/cancel',         userAuth,  cancelOrder)
orderRouter.post('/return',         userAuth,  requestReturn)

// ── Admin routes ──────────────────────────────────────────────────────────────
orderRouter.get( '/all',    adminAuth, allOrders)      // GET  /api/order/all?status=&page=&limit=&search=
orderRouter.get( '/new-orders', adminAuth, getNewOrders) // GET  /api/order/new-orders?since=
orderRouter.post('/status',     adminAuth, updateStatus)
orderRouter.post('/refund',     adminAuth, processRefund)
orderRouter.post('/bulk-status', adminAuth, bulkUpdateStatus)

export default orderRouter
