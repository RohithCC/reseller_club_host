// pages/Orders.jsx
// TailAdmin-inspired white Orders page
// ✅ All API logic preserved   ✅ StatusModal, RefundModal, OrderDrawer intact
// ✅ Search, filters, pagination server-side ✅ Mobile responsive
// ✅ Clean white UI  ✅ Status badges  ✅ Skeleton loading
// ✅ Invoice PDF download — shown for paid (online) orders AND COD orders

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl, currency } from '../App'

// ─── jsPDF + autoTable loaded from CDN in generateInvoicePDF ─────────────────
// We import them dynamically so the page doesn't fail if they haven't loaded yet.

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'placed',     label: 'Order Placed', short: 'Placed'     },
  { value: 'confirmed',  label: 'Confirmed',    short: 'Confirmed'  },
  { value: 'processing', label: 'Processing',   short: 'Processing' },
  { value: 'shipped',    label: 'Shipped',      short: 'Shipped'    },
  { value: 'delivered',  label: 'Delivered',    short: 'Delivered'  },
  { value: 'cancelled',  label: 'Cancelled',    short: 'Cancelled'  },
  { value: 'refunded',   label: 'Refunded',     short: 'Refunded'   },
]
const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label]))

// White-mode status colours
const SC = {
  placed:     { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', dot: '#3b82f6' },
  confirmed:  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', dot: '#8b5cf6' },
  processing: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', dot: '#f59e0b' },
  shipped:    { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff', dot: '#a855f7' },
  delivered:  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', dot: '#22c55e' },
  cancelled:  { bg: '#fff5f5', text: '#dc2626', border: '#fecaca', dot: '#ef4444' },
  refunded:   { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' },
}
const DSC = { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = ms =>
  ms ? new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '\u2014'
const fmtDateTime = ms =>
  ms ? new Date(ms).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '\u2014'
const fmtPrice = n => `${currency}${Number(n ?? 0).toLocaleString('en-IN')}`

// ─── Check if order is eligible for invoice download ─────────────────────────
// Show invoice for:
//  1. Online paid orders (payment.status === 'paid')
//  2. COD orders (paymentMethod === 'cod') — always show regardless of payment status
const canDownloadInvoice = order =>
  order.payment === true || order.paymentMethod?.toLowerCase() === 'cod'

// ─── Normalise order ──────────────────────────────────────────────────────────
function normalizeOrder(o) {
  return {
    _id:             o._id,
    orderNumber:     o.orderNumber,
    userId:          o.userId,
    address:         o.billing ?? {},
    items: (o.items ?? []).map(item => ({
      ...item,
      image: Array.isArray(item.image) ? item.image[0] : item.image,
    })),
    amount:           o.grandTotal      ?? 0,
    subtotal:         o.subtotal        ?? 0,
    mrpTotal:         o.mrpTotal        ?? 0,
    deliveryCharge:   o.deliveryCharge  ?? 0,
    couponDiscount:   o.couponDiscount  ?? 0,
    savedAmount:      o.savedAmount     ?? 0,
    deliveryMethod:   o.deliveryMethod ?? '',
    payment:          o.payment?.status === 'paid',
    paymentStatus:    o.payment?.status ?? 'pending',
    paymentMethod:    o.payment?.method ?? 'N/A',
    paymentId:        o.payment?.razorpayPaymentId ?? '',
    razorpayOrderId:  o.payment?.razorpayOrderId  ?? '',
    paidAt:           o.payment?.paidAt ?? null,
    status:           o.status ?? 'placed',
    statusLabel:      STATUS_LABEL[o.status] ?? o.status ?? 'Unknown',
    statusHistory:    Array.isArray(o.statusHistory) ? o.statusHistory : [],
    date:             o.createdAt ? new Date(o.createdAt).getTime() : null,
    updatedAt:        o.updatedAt ? new Date(o.updatedAt).getTime() : null,
    trackingNumber:   o.tracking?.trackingNumber || o.tracking?.trackingId  || '',
    courierName:      o.tracking?.courierName    || o.tracking?.provider    || '',
    trackingUrl:      o.tracking?.trackingUrl    ?? '',
    estimatedDelivery: o.estimatedDelivery ?? '',
    coupon:           o.coupon    ?? null,
    delivery:         o.delivery  ?? null,
    adminNote:        o.adminNote ?? '',
  }
}

// ─── Shared style tokens ───────────────────────────────────────────────────────
const T = {
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  inp: {
    width: '100%', padding: '9px 12px', fontSize: 13,
    color: '#111827', background: '#fff',
    border: '1px solid #e5e7eb', borderRadius: 8,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  btn: (v = 'primary') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, border: 'none',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    fontFamily: 'inherit', transition: 'all 0.15s',
    flexShrink: 0, whiteSpace: 'nowrap',
    ...(v === 'primary'  && { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', boxShadow: '0 2px 8px rgba(79,70,229,0.25)' }),
    ...(v === 'ghost'    && { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }),
    ...(v === 'danger'   && { background: '#fff5f5', color: '#dc2626', border: '1px solid #fecaca' }),
    ...(v === 'success'  && { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }),
    ...(v === 'muted'    && { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }),
    ...(v === 'cyan'     && { background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc' }),
    ...(v === 'invoice'  && { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }),
  }),
}
const fi = e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }
const bi = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }

// ─────────────────────────────────────────────────────────────────────────────
// PDF INVOICE GENERATOR (v3) — Black & White, professional design
// ─────────────────────────────────────────────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function generateInvoicePDF(order) {
  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')
  } catch {
    toast.error('Failed to load PDF library. Check your internet connection.')
    return
  }

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW  = doc.internal.pageSize.getWidth()   // 210 mm
  const pageH  = doc.internal.pageSize.getHeight()  // 297 mm
  const margin = 14
  const contentW = pageW - margin * 2               // 182 mm
  const addr   = order.address ?? {}
  const isCOD  = order.paymentMethod?.toLowerCase() === 'cod'

  // ── Currency formatter (WinAnsi-safe — INR symbol not supported) ────────────
  const pdfRs = n => 'Rs. ' + Number(n ?? 0).toLocaleString('en-IN')

  // ── Grayscale palette ───────────────────────────────────────────────────────
  const BLACK  = [0, 0, 0]
  const WHITE  = [255, 255, 255]
  const GRAY50   = [249, 250, 251]
  const GRAY100  = [243, 244, 246]
  const GRAY200  = [229, 231, 235]
  const GRAY300  = [209, 213, 219]
  const GRAY400  = [156, 163, 175]
  const GRAY500  = [107, 114, 128]
  const GRAY600  = [75, 85, 99]
  const GRAY700  = [55, 65, 81]
  const GRAY800  = [31, 41, 55]
  const GRAY900  = [17, 24, 39]

  // ────────────────────────────────────────────────────────────────────────────
  // HEADER — Top border + Company branding + Invoice meta
  // ────────────────────────────────────────────────────────────────────────────
  // Top accent line
  doc.setDrawColor(...GRAY900)
  doc.setLineWidth(0.8)
  doc.line(margin, 10, pageW - margin, 10)

  // Company name
  doc.setTextColor(...GRAY900)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('AMULYA ELECTRONICS', margin, 18)

  // Company details
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY500)
  doc.text('GSTIN: 29AABCU1234X1ZX  |  +91 98765 43210', margin, 24)
  doc.text('support@amulyaelectronics.com  |  www.amulyaelectronics.com', margin, 29.5)

  // Right side: TAX INVOICE title + meta
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...GRAY900)
  doc.text('TAX INVOICE', pageW - margin, 16, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY500)
  const invoiceRef = 'INV-' + (order.orderNumber ?? order._id?.slice(-6).toUpperCase())
  doc.text(invoiceRef, pageW - margin, 22.5, { align: 'right' })
  doc.text('Order #' + order.orderNumber, pageW - margin, 28, { align: 'right' })
  doc.text('Date: ' + fmtDate(order.date), pageW - margin, 33.5, { align: 'right' })

  // Separator line
  doc.setDrawColor(...GRAY200)
  doc.setLineWidth(0.3)
  doc.line(margin, 38, pageW - margin, 38)

  // ── Payment & Order Status Pills (grayscale) ────────────────────────────────
  const pillY = 42
  const payLabel = order.payment ? 'PAID' : isCOD ? 'COD' : 'PENDING'

  doc.setFillColor(...(order.payment ? GRAY800 : GRAY200))
  doc.roundedRect(margin, pillY, 26, 6.5, 2, 2, 'F')
  doc.setTextColor(...(order.payment ? WHITE : GRAY500))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text(payLabel, margin + 13, pillY + 4.2, { align: 'center' })

  const statusLabel = (order.statusLabel ?? order.status ?? '').toUpperCase()
  doc.setFillColor(...GRAY100)
  doc.roundedRect(margin + 30, pillY, 32, 6.5, 2, 2, 'F')
  doc.setTextColor(...GRAY600)
  doc.setFontSize(6.5)
  doc.text(statusLabel, margin + 46, pillY + 4.2, { align: 'center' })

  // ── Billed To / Ship To ────────────────────────────────────────────────────
  const addrY = 54
  const colMid = pageW / 2 + 2

  doc.setTextColor(...GRAY900)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('BILLED TO', margin, addrY)
  doc.text('SHIP TO', colMid, addrY)

  doc.setDrawColor(...GRAY300)
  doc.setLineWidth(0.2)
  doc.line(margin, addrY + 2, colMid - 4, addrY + 2)
  doc.line(colMid, addrY + 2, pageW - margin, addrY + 2)

  const addrLines = [
    ((addr.firstName ?? '') + ' ' + (addr.lastName ?? '')).trim() || 'N/A',
    addr.phone ? 'Ph: ' + addr.phone : null,
    addr.address ? addr.address : null,
    addr.apartment ? addr.apartment : null,
    [addr.city, addr.state].filter(Boolean).join(', ') || null,
    [addr.pincode, addr.country].filter(Boolean).join(', ') || null,
  ].filter(Boolean)

  doc.setTextColor(...GRAY700)
  doc.setFontSize(7.5)
  const lineH = 4.5
  addrLines.forEach((line, i) => {
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal')
    const y = addrY + 5.5 + i * lineH
    doc.text(line, margin, y, { maxWidth: contentW / 2 - 6 })
    doc.text(line, colMid, y, { maxWidth: contentW / 2 - 6 })
  })

  // ── Payment Details Bar (light gray) ────────────────────────────────────────
  const payBarY = addrY + 5.5 + addrLines.length * lineH + 4
  doc.setFillColor(...GRAY50)
  doc.rect(margin, payBarY, contentW, 14, 'F')
  doc.setDrawColor(...GRAY200)
  doc.setLineWidth(0.3)
  doc.line(margin, payBarY, margin + contentW, payBarY)

  const payFields = [
    { label: 'Payment Method', value: (order.paymentMethod ?? 'N/A').toUpperCase() },
    { label: 'Payment Status', value: order.payment ? 'Paid' : isCOD ? 'Pay on Delivery' : 'Pending' },
    order.paymentId ? { label: 'Payment ID', value: order.paymentId.slice(0, 16) } : null,
    order.paidAt ? { label: 'Paid At', value: fmtDateTime(new Date(order.paidAt).getTime()) } : null,
  ].filter(Boolean)

  const payColW = contentW / payFields.length
  payFields.forEach(({ label, value }, i) => {
    const x = margin + i * payColW + 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...GRAY400)
    doc.text(label, x, payBarY + 4)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY800)
    doc.text(value, x, payBarY + 10, { maxWidth: payColW - 5 })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // ITEMS TABLE — Columns: # | Product | Qty | Unit Price | Total
  // Fixed widths: #=8, Qty=12, UnitPrice=30, Total=32 => 82mm, auto=100mm
  // ────────────────────────────────────────────────────────────────────────────
  const tableStartY = payBarY + 17

  const tableRows = (order.items ?? []).map((item, i) => {
    const qty   = item.quantity ?? 1
    const price = item.price ?? 0
    return [
      i + 1,
      item.name ?? 'Product',
      qty,
      pdfRs(price),
      pdfRs(price * qty),
    ]
  })

  doc.autoTable({
    startY: tableStartY,
    head: [['#', 'Product / Description', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: GRAY800,
      textColor: WHITE,
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      lineWidth: 0,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: GRAY700,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: GRAY50 },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    tableLineColor: GRAY200,
    tableLineWidth: 0.2,
    showHead: 'everyPage',
  })

  const afterTable = doc.lastAutoTable.finalY + 5

  // ────────────────────────────────────────────────────────────────────────────
  // PRICING SUMMARY (right-aligned block, black & white)
  // ────────────────────────────────────────────────────────────────────────────
  const summaryW = 80
  const summaryX = pageW - margin - summaryW

  const summaryRows = [
    { label: 'Subtotal', value: pdfRs(order.subtotal ?? 0), bold: false },
    order.savedAmount > 0
      ? { label: 'MRP Savings', value: '- ' + pdfRs(order.savedAmount), bold: false }
      : null,
    order.couponDiscount > 0 && order.coupon?.code
      ? { label: 'Coupon (' + order.coupon.code + ')', value: '- ' + pdfRs(order.couponDiscount), bold: false }
      : null,
    {
      label: 'Delivery',
      value: order.deliveryCharge === 0 ? 'FREE' : pdfRs(order.deliveryCharge),
      bold: false,
    },
    { label: 'Grand Total', value: pdfRs(order.amount), bold: true },
  ].filter(Boolean)

  let rowY = afterTable
  summaryRows.forEach(({ label, value, bold }) => {
    if (bold) {
      doc.setFillColor(...GRAY900)
      doc.rect(summaryX, rowY - 0.5, summaryW, 9, 'F')
      doc.setTextColor(...WHITE)
    } else {
      doc.setTextColor(...GRAY700)
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 9 : 7.5)
    doc.text(label, summaryX + 3, rowY + 6)
    doc.text(value, summaryX + summaryW - 3, rowY + 6, { align: 'right' })
    rowY += 9
  })

  // ── Tracking info (left column) ────────────────────────────────────────────
  let leftInfoY = afterTable
  if (order.trackingNumber) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY900)
    doc.text('TRACKING', margin, leftInfoY + 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY600)
    doc.text('AWB: ' + order.trackingNumber, margin, leftInfoY + 10.5)
    if (order.courierName) doc.text('Via: ' + order.courierName, margin, leftInfoY + 16)
    leftInfoY += 20
  }

  // ── Admin note ─────────────────────────────────────────────────────────────
  let noteBlockBottom = Math.max(rowY + 2, leftInfoY + 2)
  if (order.adminNote) {
    doc.setDrawColor(...GRAY200)
    doc.setLineWidth(0.2)
    doc.roundedRect(margin, noteBlockBottom, contentW, 9, 1, 1, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...GRAY500)
    doc.text('NOTE:', margin + 3, noteBlockBottom + 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY700)
    doc.text(order.adminNote, margin + 18, noteBlockBottom + 4, { maxWidth: contentW - 22 })
    noteBlockBottom += 13
  }

  // ────────────────────────────────────────────────────────────────────────────
  // AUTHORISED SIGNATORY + TERMS
  // ────────────────────────────────────────────────────────────────────────────
  const signY = Math.max(noteBlockBottom + 4, pageH - 38)

  doc.setDrawColor(...GRAY200)
  doc.setLineWidth(0.4)
  doc.line(margin, signY, pageW - margin, signY)

  // Left: Terms & Conditions
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...GRAY900)
  doc.text('TERMS & CONDITIONS', margin, signY + 5.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...GRAY400)
  const termsLines = [
    '1. All prices are inclusive of applicable GST.',
    '2. This invoice is valid for warranty claims and returns.',
    '3. Goods once sold will not be taken back unless defective.',
    '4. Payment: ' + (order.payment ? 'Online' : isCOD ? 'Cash on Delivery' : 'Pending'),
    '5. Computer-generated invoice \u2014 signature not required.',
  ]
  termsLines.forEach((line, i) => {
    doc.text(line, margin, signY + 11 + i * 4.5)
  })

  // Right: Authorised Signatory
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...GRAY900)
  doc.text('FOR AMULYA ELECTRONICS', pageW - margin, signY + 5.5, { align: 'right' })

  const sigLineY = signY + 20
  doc.setDrawColor(...GRAY900)
  doc.setLineWidth(0.3)
  doc.line(pageW - margin - 40, sigLineY, pageW - margin, sigLineY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...GRAY800)
  doc.text('Authorised Signatory', pageW - margin, sigLineY + 5, { align: 'right' })

  // ────────────────────────────────────────────────────────────────────────────
  // FOOTER
  // ────────────────────────────────────────────────────────────────────────────
  doc.setFillColor(...GRAY900)
  doc.rect(0, pageH - 10, pageW, 10, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.text(
    'Thank you for shopping at Amulya Electronics  |  GSTIN: 29AABCU1234X1ZX',
    pageW / 2, pageH - 5.5, { align: 'center' },
  )
  doc.setFontSize(5)
  doc.text(
    'Generated ' + new Date().toLocaleString('en-IN') + '  |  ' + invoiceRef,
    pageW / 2, pageH - 2.5, { align: 'center' },
  )

  // ── Save ───────────────────────────────────────────────────────────────────
  doc.save('Invoice-' + (order.orderNumber ?? order._id) + '.pdf')
  toast.success('Invoice downloaded!')
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'sm' }) {
  const c = SC[status] ?? DSC
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'xs' ? '2px 8px' : '3px 10px',
      borderRadius: 99, border: '1px solid ' + c.border,
      background: c.bg, color: c.text,
      fontSize: size === 'xs' ? 10 : 11, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

// ─── Invoice Download Button ──────────────────────────────────────────────────
function InvoiceBtn({ order, size = 'normal' }) {
  const [downloading, setDownloading] = useState(false)
  const isCOD = order.paymentMethod?.toLowerCase() === 'cod'

  const handleClick = async e => {
    e.stopPropagation()
    setDownloading(true)
    await generateInvoicePDF(order)
    setDownloading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={downloading}
      title={
        order.payment
          ? 'Download invoice (Online paid)'
          : isCOD
          ? 'Download invoice (Cash on Delivery)'
          : 'Download invoice'
      }
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: size === 'sm' ? '5px 10px' : '7px 13px',
        borderRadius: 8, border: '1px solid #fde68a',
        background: downloading ? '#fef9ee' : '#fef3c7',
        color: '#92400e', fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', whiteSpace: 'nowrap',
        transition: 'all 0.15s', flexShrink: 0,
        opacity: downloading ? 0.7 : 1,
      }}
    >
      {downloading ? (
        <>
          <span style={{
            width: 11, height: 11,
            border: '1.5px solid rgba(146,64,14,0.25)',
            borderTopColor: '#92400e',
            borderRadius: '50%',
            animation: 'ordSpin 0.7s linear infinite',
            display: 'inline-block', flexShrink: 0,
          }} />
          Generating\u2026
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Invoice
          {isCOD && !order.payment && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
              background: '#fbbf24', color: '#78350f',
            }}>COD</span>
          )}
        </>
      )}
    </button>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      ...T.card, padding: '16px 18px',
      borderLeft: '3px solid ' + accent,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

// ─── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
      {[120, 80, 140, 90, 80, 80, 60, 80, 90, 120].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            height: 10, width: w, borderRadius: 6,
            background: '#f3f4f6',
            animation: 'ordPulse 1.5s ease-in-out infinite',
          }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Spinner ───────────────────────────────────────────────────────────────────
const Spin = ({ size = 14, color = '#fff' }) => (
  <span style={{
    width: size, height: size, flexShrink: 0,
    border: '2px solid rgba(79,70,229,0.2)',
    borderTopColor: color,
    borderRadius: '50%', display: 'inline-block',
    animation: 'ordSpin 0.7s linear infinite',
  }} />
)

// ─────────────────────────────────────────────────────────────────────────────
// STATUS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function StatusModal({ order, token, onClose, onUpdated }) {
  const [form, setForm] = useState({
    status:            order.status,
    message:           '',
    location:          '',
    trackingNumber:    order.trackingNumber    || '',
    courierName:       order.courierName       || '',
    estimatedDelivery: order.estimatedDelivery
      ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
    adminNote: order.adminNote || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = {
        orderId: order._id, status: form.status,
        message: form.message, location: form.location, adminNote: form.adminNote,
      }
      if (form.trackingNumber)    payload.trackingNumber    = form.trackingNumber
      if (form.courierName)       payload.courierName       = form.courierName
      if (form.estimatedDelivery) payload.estimatedDelivery = new Date(form.estimatedDelivery).toISOString()
      const { data } = await axios.post(backendUrl + '/api/order/status', payload, { headers: { token } })
      if (data.success) { toast.success(data.message || 'Status updated'); onUpdated(data.order ? normalizeOrder(data.order) : null); onClose() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setLoading(false) }
  }

  const c = SC[form.status] ?? DSC

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ ...T.card, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 3, background: c.dot, borderRadius: '14px 14px 0 0', flexShrink: 0 }} />
        <div style={{ overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Update Status</h2>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 3, fontFamily: 'monospace' }}>#{order.orderNumber}</p>
            </div>
            <button onClick={onClose} style={{ ...T.btn('muted'), padding: '6px 10px', fontSize: 14 }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
                New Status *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8 }}>
                {STATUS_OPTIONS.map(s => {
                  const sc2 = SC[s.value] ?? DSC
                  const active = form.status === s.value
                  return (
                    <button type="button" key={s.value}
                      onClick={() => setForm(f => ({ ...f, status: s.value }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, textAlign: 'left',
                        border: '1px solid ' + (active ? sc2.border : '#e5e7eb'),
                        background: active ? sc2.bg : '#f9fafb',
                        color: active ? sc2.text : '#6b7280',
                        transition: 'all 0.15s',
                      }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? sc2.dot : '#d1d5db', flexShrink: 0 }} />
                      {s.short}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Update Message</label>
                <input style={T.inp} placeholder="e.g. Picked up from hub" value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))} onFocus={fi} onBlur={bi} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Location</label>
                <input style={T.inp} placeholder="e.g. Bangalore Hub" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} onFocus={fi} onBlur={bi} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Tracking ID / AWB</label>
                <input style={T.inp} placeholder="Tracking number" value={form.trackingNumber}
                  onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))} onFocus={fi} onBlur={bi} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Courier Name</label>
                <input style={T.inp} placeholder="Delhivery, DTDC\u2026" value={form.courierName}
                  onChange={e => setForm(f => ({ ...f, courierName: e.target.value }))} onFocus={fi} onBlur={bi} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Estimated Delivery</label>
              <input type="date" style={T.inp} value={form.estimatedDelivery}
                onChange={e => setForm(f => ({ ...f, estimatedDelivery: e.target.value }))} onFocus={fi} onBlur={bi} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Internal Admin Note</label>
              <textarea rows={2} style={{ ...T.inp, resize: 'vertical', minHeight: 60 }}
                placeholder="Internal note \u2014 not shown to customer"
                value={form.adminNote}
                onChange={e => setForm(f => ({ ...f, adminNote: e.target.value }))}
                onFocus={fi} onBlur={bi} />
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={onClose} style={{ ...T.btn('muted'), flex: 1, justifyContent: 'center', padding: '10px' }}>Cancel</button>
              <button type="submit" disabled={loading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(79,70,229,0.3)',
                  transition: 'all 0.15s',
                }}>
                {loading ? <><Spin /> Updating\u2026</> : '\u2192 Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REFUND MODAL
// ─────────────────────────────────────────────────────────────────────────────
function RefundModal({ order, token, onClose, onUpdated }) {
  const [refundAmount, setRefundAmount] = useState(order.amount ?? 0)
  const [refundStatus, setRefundStatus] = useState('Processed')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/order/refund',
        { orderId: order._id, refundAmount: Number(refundAmount), refundStatus },
        { headers: { token } })
      if (data.success) { toast.success('Refund processed'); onUpdated(data.order ? normalizeOrder(data.order) : null); onClose() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setLoading(false) }
  }

  const REFUND_C = {
    Processed: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    Pending:   { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    Rejected:  { bg: '#fff5f5', text: '#dc2626', border: '#fecaca' },
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ ...T.card, width: '100%', maxWidth: 400, overflow: 'hidden' }}>
        <div style={{ height: 3, background: '#22c55e', borderRadius: '14px 14px 0 0' }} />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Process Refund</h2>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>#{order.orderNumber} \u00b7 {fmtPrice(order.amount)}</p>
            </div>
            <button onClick={onClose} style={{ ...T.btn('muted'), padding: '6px 10px', fontSize: 14 }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
                Refund Amount (\u20b9)
              </label>
              <input type="number" min={1} max={order.amount} step="0.01" required
                style={T.inp} value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)} onFocus={fi} onBlur={bi} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>Refund Status</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {['Pending', 'Processed', 'Rejected'].map(s => {
                  const rc = REFUND_C[s]
                  const active = refundStatus === s
                  return (
                    <button type="button" key={s}
                      onClick={() => setRefundStatus(s)}
                      style={{
                        padding: '9px 0', borderRadius: 8, cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, border: '1px solid ' + (active ? rc.border : '#e5e7eb'),
                        background: active ? rc.bg : '#f9fafb',
                        color: active ? rc.text : '#6b7280', transition: 'all 0.15s',
                      }}>{s}</button>
                  )
                })}
              </div>
            </div>

            {refundStatus === 'Processed' && (
              <p style={{
                fontSize: 12, color: '#16a34a', background: '#f0fdf4',
                border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px',
              }}>
                💳 {fmtPrice(refundAmount)} will be credited to the user's wallet.
              </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} style={{ ...T.btn('muted'), flex: 1, justifyContent: 'center', padding: '10px' }}>Cancel</button>
              <button type="submit" disabled={loading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#86efac' : 'linear-gradient(135deg,#22c55e,#16a34a)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(34,197,94,0.3)',
                  transition: 'all 0.15s',
                }}>
                {loading ? <><Spin color="#fff" /> Processing\u2026</> : '\u2192 Confirm Refund'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER DETAIL DRAWER  (invoice button added inside drawer too)
// ─────────────────────────────────────────────────────────────────────────────
function OrderDrawer({ order, onClose }) {
  if (!order) return null
  const addr = order.address ?? {}
  const c    = SC[order.status] ?? DSC

  const SectionHead = ({ children }) => (
    <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
      {children}
    </p>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)',
      display: 'flex', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxWidth: 440, height: '100%',
          background: '#fff', borderLeft: '1px solid #e5e7eb',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#fff', borderBottom: '1px solid #f3f4f6', flexShrink: 0,
        }}>
          <div style={{ height: 3, background: c.dot }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: 'monospace', margin: 0 }}>#{order.orderNumber}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{fmtDate(order.date)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <StatusBadge status={order.status} />
              {/* ── Invoice download inside drawer ── */}
              {canDownloadInvoice(order) && (
                <InvoiceBtn order={order} size="sm" />
              )}
              <button onClick={onClose} style={{ ...T.btn('muted'), padding: '6px 10px', fontSize: 13 }}>✕</button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

          {/* Items */}
          <div style={T.card}>
            <div style={{ padding: '14px 16px' }}>
              <SectionHead>Order Items</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {order.items?.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'center',
                    padding: '10px', borderRadius: 10,
                    background: '#f9fafb', border: '1px solid #f3f4f6',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                      background: '#f3f4f6', border: '1px solid #e5e7eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <img src={item.image} alt={item.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onError={e => { e.target.src = 'https://placehold.co/44x44?text=📦' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>
                        Qty {item.quantity}{item.category ? ' · ' + item.category : ''}
                      </p>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>{fmtPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={T.card}>
            <div style={{ padding: '14px 16px' }}>
              <SectionHead>Pricing</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Subtotal', val: fmtPrice(order.subtotal), color: '#374151' },
                  order.savedAmount > 0 && { label: 'MRP Savings', val: '\u2212 ' + fmtPrice(order.savedAmount), color: '#16a34a' },
                  order.couponDiscount > 0 && order.coupon?.code && { label: 'Coupon (' + order.coupon.code + ')', val: '\u2212 ' + fmtPrice(order.couponDiscount), color: '#16a34a' },
                  { label: 'Delivery', val: order.deliveryCharge === 0 ? 'FREE' : fmtPrice(order.deliveryCharge), color: order.deliveryCharge === 0 ? '#16a34a' : '#374151' },
                ].filter(Boolean).map(({ label, val, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                    <span>{label}</span><span style={{ fontWeight: 600, color }}>{val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#111827', borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 4 }}>
                  <span>Grand Total</span><span style={{ color: '#2563eb' }}>{fmtPrice(order.amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div style={T.card}>
            <div style={{ padding: '14px 16px' }}>
              <SectionHead>Payment</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Method', val: null, custom: (
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize', color: '#374151' }}>
                      {order.paymentMethod}
                      {order.paymentMethod?.toLowerCase() === 'cod' && (
                        <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                          Cash on Delivery
                        </span>
                      )}
                    </span>
                  )},
                  { label: 'Status', val: null, custom: (
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                      background: order.payment ? '#f0fdf4' : order.paymentMethod?.toLowerCase() === 'cod' ? '#fffbeb' : '#fffbeb',
                      color: order.payment ? '#16a34a' : '#d97706',
                      border: '1px solid ' + (order.payment ? '#bbf7d0' : '#fde68a'),
                    }}>
                      {order.payment ? '✓ Paid' : order.paymentMethod?.toLowerCase() === 'cod' ? '🛵 Pay on Delivery' : '⏳ Pending'}
                    </span>
                  )},
                  order.paymentId && { label: 'Payment ID', val: order.paymentId.slice(0, 16) + '\u2026', style: { fontFamily: 'monospace', fontSize: 11, color: '#374151' } },
                  order.paidAt    && { label: 'Paid At', val: fmtDateTime(new Date(order.paidAt).getTime()), style: { fontSize: 11, color: '#374151' } },
                ].filter(Boolean).map(({ label, val, style, custom }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#6b7280' }}>
                    <span>{label}</span>{custom || <span style={style}>{val}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Address */}
          {(addr.firstName || addr.address) && (
            <div style={T.card}>
              <div style={{ padding: '14px 16px' }}>
                <SectionHead>Delivery Address</SectionHead>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>{addr.firstName} {addr.lastName}</p>
                {addr.phone && <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 1px' }}>{addr.phone}</p>}
                {addr.email && <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px' }}>{addr.email}</p>}
                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                  {addr.address}{addr.apartment ? ', ' + addr.apartment : ''}<br />
                  {addr.city}{addr.state ? ', ' + addr.state : ''} \u2013 {addr.pincode || ''}<br />
                  {addr.country}
                </p>
                {addr.orderNotes && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>Order Note</p>
                    <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', margin: 0 }}>"{addr.orderNotes}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin note */}
          {order.adminNote && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Admin Note</p>
              <p style={{ fontSize: 12, color: '#92400e', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{order.adminNote}</p>
            </div>
          )}

          {/* Tracking */}
          {order.trackingNumber && (
            <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Tracking</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'monospace', margin: 0 }}>{order.trackingNumber}</p>
              {order.courierName && <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{order.courierName}</p>}
              {order.estimatedDelivery && (
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                  Est. {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, textDecoration: 'none' }}>
                  Track Shipment \u2192
                </a>
              )}
            </div>
          )}

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div style={T.card}>
              <div style={{ padding: '14px 16px' }}>
                <SectionHead>Status History</SectionHead>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 1, background: '#f3f4f6' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 24 }}>
                    {[...order.statusHistory].reverse().map((entry, i) => {
                      const ec = SC[entry.status] ?? DSC
                      return (
                        <div key={i} style={{ position: 'relative' }}>
                          <span style={{
                            position: 'absolute', left: -24, top: 4,
                            width: 14, height: 14, borderRadius: '50%',
                            background: i === 0 ? ec.dot : '#e5e7eb',
                            border: '2px solid #fff',
                          }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <StatusBadge status={entry.status} size="xs" />
                            <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>
                              {entry.at ? fmtDateTime(new Date(entry.at).getTime()) : '\u2014'}
                            </span>
                          </div>
                          {entry.message && <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0', lineHeight: 1.5 }}>{entry.message}</p>}
                          {entry.location && <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>📍 {entry.location}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Meta */}
          <div style={{ fontSize: 11, color: '#d1d5db', fontFamily: 'monospace', borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
            <p style={{ margin: '0 0 2px' }}>Created: {fmtDateTime(order.date)}</p>
            {order.updatedAt && <p style={{ margin: '0 0 2px' }}>Updated: {fmtDateTime(order.updatedAt)}</p>}
            <p style={{ margin: 0 }}>ID: {order._id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const Orders = ({ token }) => {
  const [orders,     setOrders]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [filters,    setFilters]    = useState({ status: '', paymentMethod: '', payment: '', search: '', startDate: '', endDate: '', deliveryMethod: '' })
  const [statusModal, setStatusModal] = useState(null)
  const [refundModal, setRefundModal] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkModal, setBulkModal] = useState(null) // { status: string } or null
  const [bulkLoading, setBulkLoading] = useState(false)

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map(o => o._id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkUpdate = async (status) => {
    setBulkLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/order/bulk-status',
        { orderIds: Array.from(selectedIds), status },
        { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        clearSelection()
        setBulkModal(null)
        fetchOrders(pagination.page)
      } else toast.error(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: pagination.limit }
      if (filters.status)         params.status        = filters.status
      if (filters.paymentMethod)   params.paymentMethod   = filters.paymentMethod
      if (filters.deliveryMethod)  params.deliveryMethod  = filters.deliveryMethod
      if (filters.payment !== '')  params.payment        = filters.payment
      if (filters.search)         params.search        = filters.search
      if (filters.startDate)      params.startDate     = new Date(filters.startDate).getTime()
      if (filters.endDate)        params.endDate       = new Date(filters.endDate).getTime() + 86399999
      const { data } = await axios.get(backendUrl + '/api/order/all', { headers: { token }, params })
      if (data.success) {
        setOrders((data.orders ?? []).map(normalizeOrder))
        setPagination(data.pagination ?? { total: data.orders?.length ?? 0, page: 1, limit: 20, totalPages: 1 })
        setSelectedIds(new Set()) // clear selection on new page
      } else toast.error(data.message)
    } catch (err) { toast.error('Failed to fetch orders'); console.error(err) }
    finally { setLoading(false) }
  }, [token, filters, pagination.limit])

  useEffect(() => { fetchOrders(1) /* eslint-disable-next-line */ }, [filters, token])

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clearFilters = () => setFilters({ status: '', paymentMethod: '', payment: '', search: '', startDate: '', endDate: '', deliveryMethod: '' })

  const patchOrderInState = updated => {
    if (!updated) { fetchOrders(pagination.page); return }
    setOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
    setDetailOrder(prev => prev && prev._id === updated._id ? updated : prev)
  }

  const hasFilters = Object.values(filters).some(Boolean)
  const delivered  = orders.filter(o => o.status === 'delivered').length
  const active     = orders.filter(o => ['placed','confirmed','processing','shipped'].includes(o.status)).length
  const revenue    = orders.filter(o => o.payment).reduce((s, o) => s + o.amount, 0)

  return (
    <>
      {statusModal && <StatusModal order={statusModal} token={token} onClose={() => setStatusModal(null)} onUpdated={patchOrderInState} />}
      {refundModal && <RefundModal order={refundModal} token={token} onClose={() => setRefundModal(null)} onUpdated={patchOrderInState} />}
      {detailOrder && <OrderDrawer order={detailOrder} onClose={() => setDetailOrder(null)} />}

      <div style={{ maxWidth: 1400, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <style>{`
          @keyframes ordSpin { to { transform: rotate(360deg); } }
          @keyframes ordPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
          @keyframes ordFade  { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
          * { box-sizing: border-box; }
          input::placeholder, textarea::placeholder { color: #9ca3af; }
          select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position: right 10px center; padding-right: 30px !important; }
          .ord-table { width: 100%; border-collapse: collapse; }
          .ord-table th { text-align: left; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; padding: 12px 14px; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }
          .ord-table td { padding: 12px 14px; border-bottom: 1px solid #f9fafb; vertical-align: middle; }
          .ord-table tr:hover td { background: #fafafa; cursor: pointer; }
          .ord-table tr:last-child td { border-bottom: none; }
          @media (max-width: 768px) {
            .ord-hide-mobile { display: none !important; }
            .ord-actions { flex-direction: column; }
          }
          @media (max-width: 480px) {
            .ord-hide-sm { display: none !important; }
          }
        `}</style>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>Orders</h1>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              {loading ? 'Loading\u2026' : pagination.total.toLocaleString() + ' total orders'}
            </p>
          </div>
          <button
            onClick={() => fetchOrders(pagination.page)}
            disabled={loading}
            style={{ ...T.btn('muted'), gap: 8 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 14, height: 14, animation: loading ? 'ordSpin 0.8s linear infinite' : 'none' }}>
              <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Stat cards ── */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
            <StatCard label="Total (page)"  value={orders.length}      sub={'of ' + pagination.total + ' orders'} accent="#2563eb" />
            <StatCard label="Active"         value={active}             sub="placed · processing · shipped"   accent="#3b82f6" />
            <StatCard label="Delivered"      value={delivered}          sub="on this page"                    accent="#22c55e" />
            <StatCard label="Page Revenue"   value={fmtPrice(revenue)}  sub="paid orders only"                accent="#8b5cf6" />
          </div>
        )}

        {/* ── Filters ── */}
        {/* ── Bulk actions toolbar ── */}
        {selectedIds.size > 0 && (
          <div style={{
            ...T.card, padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            borderLeft: '3px solid #2563eb',
            animation: 'ordFade 0.15s ease',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
              {selectedIds.size} selected
            </span>
            <span style={{ width: 1, height: 20, background: '#e5e7eb' }} />
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Bulk update to:</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['placed','confirmed','processing','shipped','delivered'].map(s => {
                const sc = SC[s] || DSC
                return (
                  <button key={s}
                    onClick={() => setBulkModal({ status: s })}
                    disabled={bulkLoading}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid ' + sc.border,
                      background: sc.bg, color: sc.text,
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', opacity: bulkLoading ? 0.6 : 1,
                      transition: 'all 0.12s',
                    }}
                  >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                )
              })}
            </div>
            <span style={{ flex: 1 }} />
            <button onClick={clearSelection}
              style={{
                padding: '4px 10px', borderRadius: 6,
                border: '1px solid #e5e7eb', background: '#fff',
                color: '#6b7280', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Clear</button>
          </div>
        )}

        {/* ── Bulk confirm modal ── */}
        {bulkModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div style={{ ...T.card, width: '100%', maxWidth: 400, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                Bulk Update Status
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>
                Update <strong>{selectedIds.size} orders</strong> to <StatusBadge status={bulkModal.status} />
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setBulkModal(null)} disabled={bulkLoading}
                  style={{ ...T.btn('muted'), flex: 1, justifyContent: 'center', padding: '10px' }}>Cancel</button>
                <button onClick={() => handleBulkUpdate(bulkModal.status)} disabled={bulkLoading}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px', border: 'none', borderRadius: 8,
                    cursor: bulkLoading ? 'not-allowed' : 'pointer',
                    background: bulkLoading ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                    color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}>
                  {bulkLoading ? <><Spin /> Updating\u2026</> : '\u2192 Update All'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ ...T.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text" placeholder="Search by order number\u2026"
              value={filters.search} onChange={e => setFilter('search', e.target.value)}
              style={{ ...T.inp, paddingLeft: 36 }} onFocus={fi} onBlur={bi}
            />
            {filters.search && (
              <button onClick={() => setFilter('search', '')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>✕</button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={T.inp} onFocus={fi} onBlur={bi}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 4, flexShrink: 0 }}>Method:</span>
              {[
                { value: '',         label: 'All',         color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
                { value: 'cod',      label: 'COD',         color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                { value: 'razorpay', label: 'Razorpay',    color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
                { value: 'pickup',   label: 'Office Pick', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
              ].map(({ value, label, color, bg, border }) => {
                const isActive = value === '' ? (!filters.paymentMethod && !filters.deliveryMethod) :
                  value === 'pickup' ? filters.deliveryMethod === 'pickup' : filters.paymentMethod === value
                return (
                  <button key={value}
                    onClick={() => {
                      if (value === 'pickup') {
                        setFilter('paymentMethod', '')
                        setFilter('deliveryMethod', isActive ? '' : 'pickup')
                      } else {
                        setFilter('deliveryMethod', '')
                        setFilter('paymentMethod', isActive ? '' : value)
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 8, border: '1px solid ' + (isActive ? border : '#e5e7eb'),
                      background: isActive ? bg : '#fff',
                      color: isActive ? color : '#6b7280',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}>
                    {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />}
                    {label}
                  </button>
                )
              })}
            </div>
            <select value={filters.payment} onChange={e => setFilter('payment', e.target.value)} style={T.inp} onFocus={fi} onBlur={bi}>
              <option value="">Paid / Unpaid</option>
              <option value="true">✓ Paid</option>
              <option value="false">⏳ Unpaid</option>
            </select>
            <input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)}
              style={T.inp} title="From date" onFocus={fi} onBlur={bi} />
            <input type="date" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)}
              style={T.inp} title="To date" onFocus={fi} onBlur={bi} />
          </div>

          {hasFilters && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active:</span>
              {filters.status && (
                <span style={{ ...SC[filters.status] && { background: SC[filters.status].bg, color: SC[filters.status].text, border: '1px solid ' + SC[filters.status].border }, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>
                  {STATUS_LABEL[filters.status]}
                </span>
              )}
              {filters.search && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  "{filters.search}"
                </span>
              )}
              {filters.payment !== '' && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                  background: filters.payment === 'true' ? '#f0fdf4' : '#fffbeb',
                  color: filters.payment === 'true' ? '#16a34a' : '#d97706',
                  border: '1px solid ' + (filters.payment === 'true' ? '#bbf7d0' : '#fde68a') }}>
                  {filters.payment === 'true' ? 'Paid' : 'Unpaid'}
                </span>
              )}
              {filters.paymentMethod && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', textTransform: 'capitalize' }}>
                  {filters.paymentMethod}
                </span>
              )}
              {filters.deliveryMethod && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc' }}>
                  Office Pick
                </span>
              )}
              {(filters.startDate || filters.endDate) && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                  {filters.startDate || '\u2026'} \u2192 {filters.endDate || '\u2026'}
                </span>
              )}
              <button onClick={clearFilters}
                style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                Clear all ✕
              </button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{ ...T.card, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="ord-table">
              <thead>
                <tr>
                  <th style={{ width: 32, textAlign: 'center' }}>
                    <input type="checkbox"
                      checked={orders.length > 0 && selectedIds.size === orders.length}
                      onChange={toggleSelectAll}
                      onClick={e => e.stopPropagation()}
                      style={{ cursor: 'pointer', accentColor: '#2563eb', width: 15, height: 15 }} />
                  </th>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th className="ord-hide-mobile">Items</th>
                  <th className="ord-hide-mobile">Amount</th>
                  <th>Payment</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [1,2,3,4,5,6].map(i => <SkeletonRow key={i} />)
                  : orders.length === 0
                  ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📦</div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af', margin: '0 0 8px' }}>No orders found</p>
                        {hasFilters && (
                          <button onClick={clearFilters} style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                  : orders.map((order) => {
                    const addr = order.address ?? {}
                    const isPickup = order.deliveryMethod === 'pickup' || order.paymentMethod?.toLowerCase() === 'pickup'
                    const showInvoice = canDownloadInvoice(order)

                    return (
                      <tr key={order._id}
                        style={{
                          animation: 'ordFade 0.2s ease',
                          background: selectedIds.has(order._id) ? '#dbeafe' : undefined,
                        }}
                      >

                        {/* Checkbox */}
                        <td style={{ textAlign: 'center', width: 32 }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox"
                            checked={selectedIds.has(order._id)}
                            onChange={() => toggleSelect(order._id)}
                            style={{ cursor: 'pointer', accentColor: '#2563eb', width: 15, height: 15 }} />
                        </td>

                        {/* Order # */}
                        <td style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(order)}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace', margin: 0 }}>#{order.orderNumber}</p>
                        </td>

                        {/* Date */}
                        <td style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(order)}>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, whiteSpace: 'nowrap' }}>{fmtDate(order.date)}</p>
                        </td>

                        {/* Customer */}
                        <td style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(order)}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, whiteSpace: 'nowrap' }}>
                            {addr.firstName} {addr.lastName}
                          </p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {addr.phone || addr.email || ''}
                          </p>
                        </td>

                        {/* Items */}
                        <td className="ord-hide-mobile" style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(order)}>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                            {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                          </p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.items?.[0]?.name}
                          </p>
                        </td>

                        {/* Amount */}
                        <td className="ord-hide-mobile" style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(order)}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap' }}>{fmtPrice(order.amount)}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', textTransform: 'capitalize' }}>{order.paymentMethod}</p>
                        </td>

                        {/* Payment */}
                        <td style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(order)}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                            background: order.payment
                              ? '#f0fdf4'
                              : order.paymentMethod?.toLowerCase() === 'cod'
                              ? '#fffbeb'
                              : '#fffbeb',
                            color: order.payment ? '#16a34a' : '#d97706',
                            border: '1px solid ' + (order.payment ? '#bbf7d0' : '#fde68a'),
                            whiteSpace: 'nowrap',
                          }}>
                            {order.payment
                              ? '✓ Paid'
                              : order.paymentMethod?.toLowerCase() === 'cod'
                              ? '🛵 COD'
                              : '⏳ Unpaid'}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(order)}>
                          {isPickup ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                              background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc',
                              whiteSpace: 'nowrap',
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#0891b2', flexShrink: 0 }} />
                              Office Pick
                            </span>
                          ) : order.paymentMethod?.toLowerCase() === 'cod' ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                              background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                              whiteSpace: 'nowrap',
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
                              COD
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                              background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                              whiteSpace: 'nowrap',
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#1d4ed8', flexShrink: 0 }} />
                              Razorpay
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(order)}><StatusBadge status={order.status} /></td>

                        {/* Actions */}
                        <td onClick={e => e.stopPropagation()}>
                          <div className="ord-actions" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button onClick={() => setStatusModal(order)} style={T.btn('ghost')}>
                              Status
                            </button>
                            {['cancelled','refunded'].includes(order.status) && (
                              <button onClick={() => setRefundModal(order)} style={T.btn('success')}>
                                Refund
                              </button>
                            )}
                            {/* ── Invoice button — shown for paid online OR COD ── */}
                            {showInvoice && (
                              <InvoiceBtn order={order} />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {!loading && pagination.totalPages >= 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 10,
            }}>
              <p style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace', margin: 0 }}>
                Page <strong style={{ color: '#374151' }}>{pagination.page}</strong> of {pagination.totalPages} · {pagination.total} orders
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button disabled={pagination.page <= 1} onClick={() => fetchOrders(pagination.page - 1)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e5e7eb', background: '#fff', color: '#374151',
                    cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.3 : 1,
                    fontSize: 14, transition: 'all 0.15s',
                  }}>←</button>

                {(() => {
                  const total = pagination.totalPages, cur = pagination.page
                  let pages = []
                  if (total <= 7) { pages = Array.from({ length: total }, (_, i) => i + 1) }
                  else {
                    const start = Math.max(2, cur - 1), end = Math.min(total - 1, cur + 1)
                    pages = [1]
                    if (start > 2) pages.push('…')
                    for (let p = start; p <= end; p++) pages.push(p)
                    if (end < total - 1) pages.push('…')
                    pages.push(total)
                  }
                  return pages.map((p, i) =>
                    p === '…' ? (
                      <span key={'e' + i} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>…</span>
                    ) : (
                      <button key={p} onClick={() => fetchOrders(p)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700,
                          border: p === cur ? '1px solid #2563eb' : '1px solid #e5e7eb',
                          background: p === cur ? '#2563eb' : '#fff',
                          color: p === cur ? '#fff' : '#374151',
                          cursor: 'pointer', transition: 'all 0.15s',
                          boxShadow: p === cur ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
                        }}>
                        {p}
                      </button>
                    )
                  )
                })()}

                <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchOrders(pagination.page + 1)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e5e7eb', background: '#fff', color: '#374151',
                    cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                    opacity: pagination.page >= pagination.totalPages ? 0.3 : 1,
                    fontSize: 14, transition: 'all 0.15s',
                  }}>→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Orders