// models/orderModel.js
import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
    productId:      { type: String, required: true },
    name:           { type: String, required: true },
    image:          { type: String, required: true },   // first image URL
    category:       { type: String, default: '' },
    price:          { type: Number, required: true },   // price at time of order
    originalPrice:  { type: Number, default: 0 },       // MRP at time of order
    quantity:       { type: Number, required: true },
    size:           { type: String, default: '' }
})

const trackingSchema = new mongoose.Schema({
    status:     { type: String, required: true },       // e.g. 'Shipped'
    message:    { type: String, default: '' },          // e.g. 'Out for delivery'
    timestamp:  { type: Number, default: Date.now },
    location:   { type: String, default: '' }           // e.g. 'Dharwad Hub'
})

const orderSchema = new mongoose.Schema({
    // ── Ownership ─────────────────────────────────────────
    userId:         { type: String, required: true },
    orderNumber:    { type: String, unique: true },     // AE-20251024-0001

    // ── Items ─────────────────────────────────────────────
    items:          { type: [orderItemSchema], required: true },

    // ── Address ───────────────────────────────────────────
    address: {
        fullName:   { type: String, required: true },
        phone:      { type: String, required: true },
        street:     { type: String, required: true },
        city:       { type: String, required: true },
        state:      { type: String, required: true },
        pincode:    { type: String, required: true },
        country:    { type: String, default: 'India' }
    },

    // ── Pricing Breakdown ─────────────────────────────────
    subtotal:           { type: Number, required: true },   // sum of items
    discountAmount:     { type: Number, default: 0 },       // coupon discount
    deliveryCharge:     { type: Number, default: 0 },
    taxAmount:          { type: Number, default: 0 },
    amount:             { type: Number, required: true },   // final paid amount

    // ── Coupon ────────────────────────────────────────────
    couponCode:         { type: String, default: '' },
    couponDiscount:     { type: Number, default: 0 },       // % or flat

    // ── Payment ───────────────────────────────────────────
    paymentMethod:      { type: String, required: true },   // COD / Razorpay / Wallet
    payment:            { type: Boolean, default: false },  // payment received?
    paymentId:          { type: String, default: '' },      // Razorpay payment ID
    razorpayOrderId:    { type: String, default: '' },

    // ── Order Status ──────────────────────────────────────
    status: {
        type: String,
        required: true,
        default: 'Order Placed',
        enum: [
            'Order Placed',
            'Packing',
            'Shipped',
            'Out for Delivery',
            'Delivered',
            'Cancelled',
            'Return Requested',
            'Returned'
        ]
    },

    // ── Tracking Timeline ─────────────────────────────────
    trackingHistory:    { type: [trackingSchema], default: [] },
    trackingNumber:     { type: String, default: '' },      // courier tracking ID
    courierName:        { type: String, default: '' },      // e.g. 'Delhivery'
    estimatedDelivery:  { type: Number, default: 0 },       // timestamp

    // ── Delivery Slot (optional) ──────────────────────────
    deliverySlot:       { type: String, default: '' },      // e.g. '10AM - 2PM'
    deliveryDate:       { type: String, default: '' },

    // ── Invoice ───────────────────────────────────────────
    invoiceNumber:      { type: String, default: '' },      // INV-20251024-0001
    invoiceUrl:         { type: String, default: '' },      // Cloudinary PDF URL

    // ── Cancellation / Return ─────────────────────────────
    cancelReason:       { type: String, default: '' },
    returnReason:       { type: String, default: '' },
    refundStatus:       { type: String, default: '' },      // Pending / Processed
    refundAmount:       { type: Number, default: 0 },

    // ── Notes ─────────────────────────────────────────────
    customerNote:       { type: String, default: '' },
    adminNote:          { type: String, default: '' },

    date:               { type: Number, required: true }
})

// ── Auto-generate orderNumber & invoiceNumber before save ─────────────────────
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const date   = new Date()
        const prefix = `AE-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`
        const count  = await mongoose.models.order.countDocuments()
        this.orderNumber  = `${prefix}-${String(count + 1).padStart(4, '0')}`
        this.invoiceNumber = `INV-${prefix.slice(3)}-${String(count + 1).padStart(4, '0')}`
    }
    next()
})

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema)
export default orderModel