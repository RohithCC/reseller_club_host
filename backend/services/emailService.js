// services/emailService.js
// ─────────────────────────────────────────────────────────────────────────────
// Centralised email service for Amulya Electronics.
// Uses nodemailer + Gmail (same pattern as userController.js).
//
// Exported functions:
//   sendOrderConfirmationEmail(order)   → COD order placed
//   sendPaymentConfirmationEmail(order) → Razorpay payment verified
//
// Both functions accept a fully-populated order document (or lean object).
// Call them from orderController.js after order.save() / verifyRazorpay.
// ─────────────────────────────────────────────────────────────────────────────

import nodemailer from 'nodemailer'

// ─── Nodemailer transporter (Gmail) ──────────────────────────────────────────
// Reuse one transporter instance for the process lifetime.
const createTransporter = () =>
    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,   // Gmail App Password (not your login password)
        },
    })

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (n) => `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

const estimatedDeliveryText = (order) => {
    if (order.estimatedDelivery) return fmtDate(order.estimatedDelivery)
    // Default: 7 business days from order date
    const base = order.createdAt ? new Date(order.createdAt) : new Date()
    base.setDate(base.getDate() + 7)
    return fmtDate(base)
}

// ─── Shared CSS variables ─────────────────────────────────────────────────────
const COLORS = {
    brand:   '#2563eb',
    success: '#16a34a',
    amber:   '#d97706',
    text:    '#1f2937',
    muted:   '#6b7280',
    light:   '#f9fafb',
    border:  '#e5e7eb',
    white:   '#ffffff',
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Item rows HTML
// ─────────────────────────────────────────────────────────────────────────────
const buildItemRows = (items = []) =>
    items.map((item) => {
        const qty   = item.quantity ?? 1
        const price = Number(item.price ?? 0)
        const mrp   = Number(item.mrp   ?? price)
        const disc  = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

        return `
        <tr>
            <td style="padding:12px 0;border-bottom:1px solid ${COLORS.border};vertical-align:middle">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td width="56" style="vertical-align:top">
                            <img src="${item.image || 'https://placehold.co/56x56?text=📦'}"
                                alt="${item.name}"
                                width="48" height="48"
                                style="border-radius:8px;object-fit:contain;background:#f3f4f6;border:1px solid ${COLORS.border}"
                                onerror="this.src='https://placehold.co/56x56?text=📦'"
                            />
                        </td>
                        <td style="padding-left:12px;vertical-align:top">
                            <p style="margin:0;font-size:13px;font-weight:700;color:${COLORS.text};line-height:1.4">${item.name}</p>
                            ${item.subcat ? `<p style="margin:2px 0 0;font-size:11px;color:${COLORS.muted}">${item.subcat}</p>` : ''}
                            <p style="margin:4px 0 0;font-size:11px;color:${COLORS.muted}">Qty: ${qty}</p>
                            ${disc > 0
                                ? `<span style="display:inline-block;margin-top:4px;font-size:10px;font-weight:700;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;padding:1px 6px;border-radius:20px">${disc}% off</span>`
                                : ''
                            }
                        </td>
                    </tr>
                </table>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid ${COLORS.border};vertical-align:top;text-align:right;white-space:nowrap">
                <p style="margin:0;font-size:13px;font-weight:800;color:${COLORS.text}">${fmtPrice(price * qty)}</p>
                ${mrp > price
                    ? `<p style="margin:2px 0 0;font-size:11px;color:${COLORS.muted};text-decoration:line-through">${fmtPrice(mrp * qty)}</p>`
                    : ''
                }
            </td>
        </tr>`
    }).join('')

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Price summary section
// ─────────────────────────────────────────────────────────────────────────────
const buildPriceSummary = (order) => {
    const subtotal       = Number(order.subtotal       ?? 0)
    const deliveryCharge = Number(order.deliveryCharge ?? 0)
    const grandTotal     = Number(order.grandTotal     ?? 0)
    const savedAmount    = Number(order.savedAmount    ?? 0)
    const couponCode     = order.coupon?.code          ?? ''
    const couponDiscount = Number(order.coupon?.discount ?? order.couponDiscount ?? 0)

    return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="margin-top:16px;border-top:2px solid ${COLORS.border};padding-top:16px">
        <tr>
            <td style="font-size:12px;color:${COLORS.muted};padding:3px 0">Subtotal</td>
            <td style="font-size:12px;color:${COLORS.text};font-weight:600;text-align:right;padding:3px 0">${fmtPrice(subtotal)}</td>
        </tr>
        ${savedAmount > 0 ? `
        <tr>
            <td style="font-size:12px;color:#16a34a;padding:3px 0">MRP Discount</td>
            <td style="font-size:12px;color:#16a34a;font-weight:700;text-align:right;padding:3px 0">− ${fmtPrice(savedAmount)}</td>
        </tr>` : ''}
        ${couponDiscount > 0 && couponCode ? `
        <tr>
            <td style="font-size:12px;color:#16a34a;padding:3px 0">Coupon (${couponCode})</td>
            <td style="font-size:12px;color:#16a34a;font-weight:700;text-align:right;padding:3px 0">− ${fmtPrice(couponDiscount)}</td>
        </tr>` : ''}
        <tr>
            <td style="font-size:12px;color:${COLORS.muted};padding:3px 0">Delivery</td>
            <td style="font-size:12px;color:${deliveryCharge === 0 ? '#16a34a' : COLORS.text};font-weight:${deliveryCharge === 0 ? '700' : '600'};text-align:right;padding:3px 0">
                ${deliveryCharge === 0 ? 'FREE' : fmtPrice(deliveryCharge)}
            </td>
        </tr>
        <tr>
            <td colspan="2" style="padding:8px 0 0"><div style="border-top:2px solid ${COLORS.text}"></div></td>
        </tr>
        <tr>
            <td style="font-size:15px;font-weight:800;color:${COLORS.text};padding:8px 0 0">Grand Total</td>
            <td style="font-size:16px;font-weight:800;color:${COLORS.brand};text-align:right;padding:8px 0 0">${fmtPrice(grandTotal)}</td>
        </tr>
        ${savedAmount + couponDiscount > 0 ? `
        <tr>
            <td colspan="2" style="padding-top:8px">
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px 12px;text-align:center">
                    <p style="margin:0;font-size:12px;font-weight:700;color:#16a34a">
                        🎉 You saved ${fmtPrice(savedAmount + couponDiscount)} on this order!
                    </p>
                </div>
            </td>
        </tr>` : ''}
    </table>`
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Delivery address section
// ─────────────────────────────────────────────────────────────────────────────
const buildAddressSection = (billing = {}) => `
    <div style="background:${COLORS.light};border:1px solid ${COLORS.border};border-radius:12px;padding:16px;margin-top:20px">
        <p style="margin:0 0 8px;font-size:10px;font-weight:800;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em">Delivery Address</p>
        <p style="margin:0;font-size:13px;font-weight:700;color:${COLORS.text}">${billing.firstName ?? ''} ${billing.lastName ?? ''}</p>
        ${billing.phone ? `<p style="margin:2px 0 0;font-size:12px;color:${COLORS.muted}">${billing.phone}</p>` : ''}
        <p style="margin:6px 0 0;font-size:12px;color:${COLORS.text};line-height:1.6">
            ${billing.address ?? ''}${billing.apartment ? `, ${billing.apartment}` : ''}<br/>
            ${billing.city ?? ''}${billing.state ? `, ${billing.state}` : ''} – ${billing.pincode ?? ''}<br/>
            ${billing.country ?? 'India'}
        </p>
        ${billing.orderNotes ? `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid ${COLORS.border}">
            <p style="margin:0;font-size:10px;font-weight:800;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em">Order Note</p>
            <p style="margin:4px 0 0;font-size:12px;color:${COLORS.muted};font-style:italic">"${billing.orderNotes}"</p>
        </div>` : ''}
    </div>`

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Email wrapper (header + footer)
// ─────────────────────────────────────────────────────────────────────────────
const wrapEmail = (headerColor, headerIcon, headerTitle, headerSubtitle, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6;padding:32px 16px">
    <tr>
        <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:580px">

                <!-- LOGO BAR -->
                <tr>
                    <td align="center" style="padding-bottom:20px">
                        <img src="https://amulyaelectronics.com/wp-content/uploads/2026/01/CONNECT-WITH-ELECTRONICS-1.png"
                            alt="Amulya Electronics" height="44"
                            style="display:block;height:44px;width:auto" />
                    </td>
                </tr>

                <!-- HEADER CARD -->
                <tr>
                    <td style="background:${headerColor};border-radius:16px 16px 0 0;padding:32px 32px 28px;text-align:center">
                        <div style="font-size:48px;margin-bottom:12px">${headerIcon}</div>
                        <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3">${headerTitle}</h1>
                        <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.5">${headerSubtitle}</p>
                    </td>
                </tr>

                <!-- BODY CARD -->
                <tr>
                    <td style="background:${COLORS.white};border-radius:0 0 16px 16px;padding:28px 32px 32px;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
                        ${bodyHtml}
                    </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                    <td style="padding:24px 8px;text-align:center">
                        <p style="margin:0;font-size:12px;color:#9ca3af">
                            Amulya Electronics · Dharwad, Karnataka, India<br/>
                            <a href="mailto:support@amulyaelectronics.com" style="color:#9ca3af">support@amulyaelectronics.com</a>
                        </p>
                        <p style="margin:8px 0 0;font-size:11px;color:#d1d5db">
                            This is an automated email. Please do not reply directly to this message.
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>
</body>
</html>`

// ─────────────────────────────────────────────────────────────────────────────
// SEND HELPER — internal
// ─────────────────────────────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
    if (!to) {
        console.warn('[emailService] No recipient email — skipping send')
        return
    }
    try {
        const transporter = createTransporter()
        const info = await transporter.sendMail({
            from:    `"Amulya Electronics" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        })
        console.log(`[emailService] Sent "${subject}" → ${to} (msgId: ${info.messageId})`)
    } catch (err) {
        // Log but never throw — email failure must not break the order flow
        console.error(`[emailService] Failed to send "${subject}" → ${to}:`, err.message)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ORDER CONFIRMATION — COD
// ─────────────────────────────────────────────────────────────────────────────
// Called after placeOrder() saves successfully.
// Payment status is "pending" — customer pays on delivery.
export const sendOrderConfirmationEmail = async (order) => {
    const billing     = order.billing   ?? {}
    const to          = billing.email   || order.userEmail || ''
    const firstName   = billing.firstName || 'Customer'
    const orderNumber = order.orderNumber ?? order._id?.toString() ?? '—'
    const estDelivery = estimatedDeliveryText(order)

    const bodyHtml = `
        <!-- Greeting -->
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${COLORS.text}">Hi ${firstName},</p>
        <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted};line-height:1.6">
            Thank you for shopping with Amulya Electronics! Your order has been placed and is being prepared.
        </p>

        <!-- Order Meta -->
        <div style="background:${COLORS.light};border:1px solid ${COLORS.border};border-radius:12px;padding:16px;margin-bottom:20px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="padding:4px 0">
                        <span style="font-size:11px;font-weight:800;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em">Order Number</span><br/>
                        <span style="font-size:16px;font-weight:800;color:${COLORS.brand}">#${orderNumber}</span>
                    </td>
                    <td style="padding:4px 0;text-align:right">
                        <span style="font-size:11px;font-weight:800;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em">Payment</span><br/>
                        <span style="display:inline-block;margin-top:3px;font-size:11px;font-weight:800;background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:3px 10px;border-radius:20px">
                            💵 Cash on Delivery
                        </span>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="padding:12px 0 0">
                        <span style="font-size:11px;font-weight:800;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em">Est. Delivery</span><br/>
                        <span style="font-size:13px;font-weight:700;color:${COLORS.text}">📦 ${estDelivery}</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- COD Notice -->
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;margin-bottom:20px">
            <p style="margin:0;font-size:13px;font-weight:700;color:#92400e">💵 Cash on Delivery Order</p>
            <p style="margin:6px 0 0;font-size:12px;color:#b45309;line-height:1.5">
                Please keep <strong>${fmtPrice(order.grandTotal)}</strong> ready when your order arrives.
                Our delivery partner will collect the payment at your doorstep.
            </p>
        </div>

        <!-- Items -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:800;color:${COLORS.text};text-transform:uppercase;letter-spacing:0.05em">
            Your Items
        </p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${buildItemRows(order.items)}
        </table>

        <!-- Price Summary -->
        ${buildPriceSummary(order)}

        <!-- Address -->
        ${buildAddressSection(billing)}

        <!-- CTA -->
        <div style="margin-top:24px;text-align:center">
            <a href="${process.env.FRONTEND_URL}/orders"
                style="display:inline-block;background:${COLORS.brand};color:#fff;font-size:14px;font-weight:800;padding:14px 32px;border-radius:50px;text-decoration:none;box-shadow:0 4px 12px rgba(37,99,235,0.3)">
                Track My Order →
            </a>
        </div>

        <!-- Trust badges -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;border-top:1px solid ${COLORS.border};padding-top:20px">
            <tr>
                <td align="center" style="padding:0 8px;font-size:11px;color:${COLORS.muted};font-weight:600">🔒 Secure</td>
                <td align="center" style="padding:0 8px;font-size:11px;color:${COLORS.muted};font-weight:600">🚚 Fast Delivery</td>
                <td align="center" style="padding:0 8px;font-size:11px;color:${COLORS.muted};font-weight:600">↩️ Easy Returns</td>
                <td align="center" style="padding:0 8px;font-size:11px;color:${COLORS.muted};font-weight:600">🛡️ 1-yr Warranty</td>
            </tr>
        </table>
    `

    await sendMail({
        to,
        subject: `✅ Order Confirmed #${orderNumber} — Amulya Electronics`,
        html: wrapEmail(
            COLORS.success,
            '✅',
            'Order Confirmed!',
            'Your order has been placed and is on its way to being packed.',
            bodyHtml
        ),
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PAYMENT CONFIRMATION — RAZORPAY
// ─────────────────────────────────────────────────────────────────────────────
// Called after verifyRazorpay() confirms the HMAC signature.
// Payment status is "paid" — show payment details.
export const sendPaymentConfirmationEmail = async (order) => {
    const billing      = order.billing   ?? {}
    const payment      = order.payment   ?? {}
    const to           = billing.email   || order.userEmail || ''
    const firstName    = billing.firstName || 'Customer'
    const orderNumber  = order.orderNumber ?? order._id?.toString() ?? '—'
    const paymentId    = payment.razorpayPaymentId ?? '—'
    const paidAt       = payment.paidAt ? fmtDate(payment.paidAt) : fmtDate(new Date())
    const estDelivery  = estimatedDeliveryText(order)

    const bodyHtml = `
        <!-- Greeting -->
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${COLORS.text}">Hi ${firstName},</p>
        <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted};line-height:1.6">
            Great news — your payment was successful and your order is confirmed!
            We're already preparing it for dispatch.
        </p>

        <!-- Order + Payment Meta -->
        <div style="background:${COLORS.light};border:1px solid ${COLORS.border};border-radius:12px;padding:16px;margin-bottom:20px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="padding:4px 0">
                        <span style="font-size:11px;font-weight:800;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em">Order Number</span><br/>
                        <span style="font-size:16px;font-weight:800;color:${COLORS.brand}">#${orderNumber}</span>
                    </td>
                    <td style="padding:4px 0;text-align:right">
                        <span style="font-size:11px;font-weight:800;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em">Payment</span><br/>
                        <span style="display:inline-block;margin-top:3px;font-size:11px;font-weight:800;background:#dcfce7;color:#166534;border:1px solid #86efac;padding:3px 10px;border-radius:20px">
                            ✓ Paid Online
                        </span>
                    </td>
                </tr>
                <tr>
                    <td style="padding:12px 0 0">
                        <span style="font-size:11px;font-weight:800;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em">Payment ID</span><br/>
                        <span style="font-size:12px;font-weight:600;color:${COLORS.text};font-family:monospace">${paymentId}</span>
                    </td>
                    <td style="padding:12px 0 0;text-align:right">
                        <span style="font-size:11px;font-weight:800;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em">Paid On</span><br/>
                        <span style="font-size:12px;font-weight:600;color:${COLORS.text}">${paidAt}</span>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="padding:12px 0 0">
                        <span style="font-size:11px;font-weight:800;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em">Est. Delivery</span><br/>
                        <span style="font-size:13px;font-weight:700;color:${COLORS.text}">📦 ${estDelivery}</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Payment Confirmed Banner -->
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:14px 16px;margin-bottom:20px;text-align:center">
            <p style="margin:0;font-size:14px;font-weight:800;color:#166534">✅ Payment of ${fmtPrice(order.grandTotal)} received</p>
            <p style="margin:4px 0 0;font-size:12px;color:#16a34a">Via Razorpay · Secured by 256-bit encryption</p>
        </div>

        <!-- Items -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:800;color:${COLORS.text};text-transform:uppercase;letter-spacing:0.05em">
            Your Items
        </p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${buildItemRows(order.items)}
        </table>

        <!-- Price Summary -->
        ${buildPriceSummary(order)}

        <!-- Address -->
        ${buildAddressSection(billing)}

        <!-- CTA -->
        <div style="margin-top:24px;text-align:center">
            <a href="${process.env.FRONTEND_URL}/orders"
                style="display:inline-block;background:${COLORS.brand};color:#fff;font-size:14px;font-weight:800;padding:14px 32px;border-radius:50px;text-decoration:none;box-shadow:0 4px 12px rgba(37,99,235,0.3)">
                Track My Order →
            </a>
        </div>

        <!-- Trust badges -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;border-top:1px solid ${COLORS.border};padding-top:20px">
            <tr>
                <td align="center" style="padding:0 8px;font-size:11px;color:${COLORS.muted};font-weight:600">🔒 Secure Payment</td>
                <td align="center" style="padding:0 8px;font-size:11px;color:${COLORS.muted};font-weight:600">🚚 Fast Delivery</td>
                <td align="center" style="padding:0 8px;font-size:11px;color:${COLORS.muted};font-weight:600">↩️ Easy Returns</td>
                <td align="center" style="padding:0 8px;font-size:11px;color:${COLORS.muted};font-weight:600">🛡️ 1-yr Warranty</td>
            </tr>
        </table>
    `

    await sendMail({
        to,
        subject: `🎉 Payment Confirmed #${orderNumber} — Amulya Electronics`,
        html: wrapEmail(
            COLORS.brand,
            '🎉',
            'Payment Successful!',
            `Your payment of ${fmtPrice(order.grandTotal)} has been confirmed.`,
            bodyHtml
        ),
    })
}