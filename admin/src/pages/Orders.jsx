// admin/src/pages/Orders.jsx
//
// ✅ All original functionality preserved + enhanced:
//   - Status values LOWERCASE: "placed"|"confirmed"|"processing"|"shipped"|"delivered"|"cancelled"|"refunded"
//   - POST /api/order/status returns full updated order → patchOrderInState()
//   - statusHistory: [{ status, message, location, updatedBy, at }]
//   - Full search, filter, pagination (server-side)
//   - StatusModal, RefundModal, OrderDrawer all intact
//   - Beautiful dark command-center UI aesthetic

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl, currency } from '../App'

// ─── Status Config ────────────────────────────────────────────────────────────
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

const STATUS_CONFIG = {
  placed:     { bg: 'bg-sky-500/15',     text: 'text-sky-300',     border: 'border-sky-500/25',     dot: 'bg-sky-400',     glow: 'shadow-sky-500/20'     },
  confirmed:  { bg: 'bg-violet-500/15',  text: 'text-violet-300',  border: 'border-violet-500/25',  dot: 'bg-violet-400',  glow: 'shadow-violet-500/20'  },
  processing: { bg: 'bg-amber-500/15',   text: 'text-amber-300',   border: 'border-amber-500/25',   dot: 'bg-amber-400',   glow: 'shadow-amber-500/20'   },
  shipped:    { bg: 'bg-purple-500/15',  text: 'text-purple-300',  border: 'border-purple-500/25',  dot: 'bg-purple-400',  glow: 'shadow-purple-500/20'  },
  delivered:  { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/25', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20' },
  cancelled:  { bg: 'bg-red-500/15',     text: 'text-red-300',     border: 'border-red-500/25',     dot: 'bg-red-400',     glow: 'shadow-red-500/20'     },
  refunded:   { bg: 'bg-slate-500/15',   text: 'text-slate-300',   border: 'border-slate-500/25',   dot: 'bg-slate-400',   glow: 'shadow-slate-500/20'   },
}
const DEFAULT_SC = { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/25', dot: 'bg-slate-400', glow: '' }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (ms) =>
  ms ? new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const fmtDateTime = (ms) =>
  ms ? new Date(ms).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—'

const fmtPrice = (n) => `${currency}${Number(n ?? 0).toLocaleString('en-IN')}`

// ─── Normalise order from API ─────────────────────────────────────────────────
function normalizeOrder(o) {
  return {
    _id:         o._id,
    orderNumber: o.orderNumber,
    userId:      o.userId,
    address:     o.billing ?? {},
    items: (o.items ?? []).map(item => ({
      ...item,
      image: Array.isArray(item.image) ? item.image[0] : item.image,
    })),
    amount:          o.grandTotal      ?? 0,
    subtotal:        o.subtotal        ?? 0,
    mrpTotal:        o.mrpTotal        ?? 0,
    deliveryCharge:  o.deliveryCharge  ?? 0,
    couponDiscount:  o.couponDiscount  ?? 0,
    savedAmount:     o.savedAmount     ?? 0,
    payment:         o.payment?.status === 'paid',
    paymentStatus:   o.payment?.status ?? 'pending',
    paymentMethod:   o.payment?.method ?? 'N/A',
    paymentId:       o.payment?.razorpayPaymentId ?? '',
    razorpayOrderId: o.payment?.razorpayOrderId  ?? '',
    paidAt:          o.payment?.paidAt ?? null,
    status:          o.status ?? 'placed',
    statusLabel:     STATUS_LABEL[o.status] ?? o.status ?? 'Unknown',
    statusHistory:   Array.isArray(o.statusHistory) ? o.statusHistory : [],
    date:            o.createdAt ? new Date(o.createdAt).getTime() : null,
    updatedAt:       o.updatedAt ? new Date(o.updatedAt).getTime() : null,
    trackingNumber:  o.tracking?.trackingNumber || o.tracking?.trackingId  || '',
    courierName:     o.tracking?.courierName    || o.tracking?.provider    || '',
    trackingUrl:     o.tracking?.trackingUrl    ?? '',
    estimatedDelivery: o.estimatedDelivery ?? '',
    coupon:          o.coupon   ?? null,
    delivery:        o.delivery ?? null,
    adminNote:       o.adminNote ?? '',
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'sm' }) {
  const sc = STATUS_CONFIG[status] ?? DEFAULT_SC
  const textSz = size === 'xs' ? 'text-[9px]' : 'text-[10px]'
  return (
    <span className={`inline-flex items-center gap-1.5 font-black ${textSz} px-2.5 py-1 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-white/[0.04]">
      {[120, 80, 140, 100, 90, 80, 100, 80].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-2.5 bg-white/[0.06] rounded-full`} style={{ width: w }} />
          {i === 2 && <div className="h-2 bg-white/[0.04] rounded-full mt-1.5 w-20" />}
        </td>
      ))}
    </tr>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 ${accent}`}>
      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.12em] mb-1">{label}</p>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-[10px] text-white/30 mt-1 font-medium">{sub}</p>}
      <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-[0.06] bg-white" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function StatusModal({ order, token, onClose, onUpdated }) {
  const [form, setForm] = useState({
    status:            order.status,
    message:           '',
    location:          '',
    trackingNumber:    order.trackingNumber || '',
    courierName:       order.courierName    || '',
    estimatedDelivery: order.estimatedDelivery
      ? new Date(order.estimatedDelivery).toISOString().split('T')[0]
      : '',
    adminNote:         order.adminNote || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        orderId:  order._id,
        status:   form.status,
        message:  form.message,
        location: form.location,
        adminNote: form.adminNote,
      }
      if (form.trackingNumber)    payload.trackingNumber    = form.trackingNumber
      if (form.courierName)       payload.courierName       = form.courierName
      if (form.estimatedDelivery) payload.estimatedDelivery = new Date(form.estimatedDelivery).toISOString()

      const { data } = await axios.post(
        `${backendUrl}/api/order/status`, payload,
        { headers: { token } }
      )
      if (data.success) {
        toast.success(data.message || 'Status updated')
        onUpdated(data.order ? normalizeOrder(data.order) : null)
        onClose()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = "w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.06] transition-all duration-200"
  const lbl = "block text-[10px] font-black text-white/35 uppercase tracking-[0.1em] mb-1.5"
  const sc  = STATUS_CONFIG[form.status] ?? DEFAULT_SC

  return (
    <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center px-4">
      <div className="relative bg-[#080f1a] border border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Accent top bar */}
        <div className={`h-0.5 w-full ${sc.bg.replace('bg-', 'bg-').replace('/15', '/80')}`}
          style={{ background: `linear-gradient(90deg, transparent, ${sc.dot.includes('emerald') ? '#34d399' : sc.dot.includes('sky') ? '#38bdf8' : sc.dot.includes('violet') ? '#a78bfa' : sc.dot.includes('amber') ? '#fbbf24' : sc.dot.includes('purple') ? '#c084fc' : sc.dot.includes('red') ? '#f87171' : '#94a3b8'}, transparent)` }}
        />

        <div className="p-6 max-h-[88vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Update Status</h2>
              <p className="text-xs text-white/30 mt-0.5 font-mono">#{order.orderNumber}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status selector with visual preview */}
            <div>
              <label className={lbl}>New Status *</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {STATUS_OPTIONS.map(s => {
                  const c = STATUS_CONFIG[s.value] ?? DEFAULT_SC
                  const active = form.status === s.value
                  return (
                    <button type="button" key={s.value}
                      onClick={() => setForm(f => ({ ...f, status: s.value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                        active
                          ? `${c.bg} ${c.text} ${c.border} shadow-lg ${c.glow}`
                          : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06] hover:text-white/70'
                      }`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? c.dot : 'bg-white/20'}`} />
                      {s.short}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Message & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Update Message</label>
                <input type="text" placeholder="e.g. Picked up from hub"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className={inp} />
              </div>
              <div>
                <label className={lbl}>Location</label>
                <input type="text" placeholder="e.g. Bangalore Hub"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className={inp} />
              </div>
            </div>

            {/* Tracking */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Tracking ID / AWB</label>
                <input type="text" placeholder="Tracking number"
                  value={form.trackingNumber}
                  onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))}
                  className={inp} />
              </div>
              <div>
                <label className={lbl}>Courier Name</label>
                <input type="text" placeholder="Delhivery, DTDC…"
                  value={form.courierName}
                  onChange={e => setForm(f => ({ ...f, courierName: e.target.value }))}
                  className={inp} />
              </div>
            </div>

            {/* Est. Delivery */}
            <div>
              <label className={lbl}>Estimated Delivery</label>
              <input type="date" value={form.estimatedDelivery}
                onChange={e => setForm(f => ({ ...f, estimatedDelivery: e.target.value }))}
                className={inp} />
            </div>

            {/* Admin Note */}
            <div>
              <label className={lbl}>Internal Admin Note</label>
              <textarea rows={2} placeholder="Internal note — not shown to customer"
                value={form.adminNote}
                onChange={e => setForm(f => ({ ...f, adminNote: e.target.value }))}
                className={inp + ' resize-none'} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 hover:text-white py-3 rounded-xl text-sm font-bold transition-all">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
                  : '→ Update Status'}
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/order/refund`,
        { orderId: order._id, refundAmount: Number(refundAmount), refundStatus },
        { headers: { token } }
      )
      if (data.success) {
        toast.success('Refund processed')
        onUpdated(data.order ? normalizeOrder(data.order) : null)
        onClose()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = "w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/60 transition-all"
  const lbl = "block text-[10px] font-black text-white/35 uppercase tracking-[0.1em] mb-1.5"

  return (
    <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center px-4">
      <div className="relative bg-[#080f1a] border border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #34d399, transparent)' }} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-white">Process Refund</h2>
              <p className="text-xs text-white/30 mt-0.5">#{order.orderNumber} · {fmtPrice(order.amount)}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={lbl}>Refund Amount (₹)</label>
              <input type="number" min={1} max={order.amount} step="0.01"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                className={inp} required />
            </div>
            <div>
              <label className={lbl}>Refund Status</label>
              <div className="grid grid-cols-3 gap-2">
                {['Pending', 'Processed', 'Rejected'].map(s => (
                  <button type="button" key={s}
                    onClick={() => setRefundStatus(s)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      refundStatus === s
                        ? s === 'Processed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : s === 'Rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {refundStatus === 'Processed' && (
              <p className="text-[11px] text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                💳 {fmtPrice(refundAmount)} will be credited to the user's wallet.
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 hover:text-white py-3 rounded-xl text-sm font-bold transition-all">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                  : '→ Confirm Refund'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function OrderDrawer({ order, onClose }) {
  if (!order) return null
  const addr = order.address ?? {}
  const sc   = STATUS_CONFIG[order.status] ?? DEFAULT_SC

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex justify-end"
      onClick={onClose}>
      <div
        className="w-full max-w-[420px] bg-[#060d18] border-l border-white/[0.07] h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Drawer header */}
        <div className="sticky top-0 z-10 bg-[#060d18] border-b border-white/[0.07]">
          <div className={`h-0.5 w-full`}
            style={{ background: `linear-gradient(90deg, transparent, ${sc.dot.includes('emerald') ? '#34d399' : sc.dot.includes('sky') ? '#38bdf8' : sc.dot.includes('violet') ? '#a78bfa' : sc.dot.includes('amber') ? '#fbbf24' : sc.dot.includes('purple') ? '#c084fc' : sc.dot.includes('red') ? '#f87171' : '#94a3b8'}, transparent)` }}
          />
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-black text-white text-base font-mono tracking-tight">#{order.orderNumber}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{fmtDate(order.date)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/40 hover:text-white flex items-center justify-center transition-all">
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 flex-1">

          {/* Items */}
          <section>
            <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.15em] mb-3">Order Items</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex gap-3 items-center bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] rounded-2xl p-3 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.07] overflow-hidden flex items-center justify-center p-1.5 flex-shrink-0">
                    <img src={item.image} alt={item.name}
                      className="max-w-full max-h-full object-contain"
                      onError={e => { e.target.src = 'https://placehold.co/44x44?text=📦' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white/90 line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">
                      Qty {item.quantity}
                      {item.category ? ` · ${item.category}` : ''}
                    </p>
                    {item.mrp > item.price && (
                      <p className="text-[9px] text-white/20 line-through">{fmtPrice(item.mrp)}</p>
                    )}
                  </div>
                  <p className="text-xs font-black text-cyan-400 flex-shrink-0">{fmtPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Price */}
          <section className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4">
            <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.15em] mb-3">Pricing</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-white/50">
                <span>Subtotal</span><span className="font-semibold">{fmtPrice(order.subtotal)}</span>
              </div>
              {order.savedAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>MRP Savings</span><span>− {fmtPrice(order.savedAmount)}</span>
                </div>
              )}
              {order.couponDiscount > 0 && order.coupon?.code && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Coupon ({order.coupon.code})</span>
                  <span>− {fmtPrice(order.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-white/50">
                <span>Delivery</span>
                <span>{order.deliveryCharge === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : fmtPrice(order.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white border-t border-white/[0.07] pt-2 mt-2">
                <span>Grand Total</span>
                <span className="text-cyan-400">{fmtPrice(order.amount)}</span>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4">
            <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.15em] mb-3">Payment</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-white/50">
                <span>Method</span>
                <span className="font-bold capitalize text-white/70">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Status</span>
                <span className={`font-black text-[11px] ${order.payment ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {order.payment ? '✓ Paid' : '⏳ Pending'}
                </span>
              </div>
              {order.paymentId && (
                <div className="flex justify-between text-white/40">
                  <span>Payment ID</span>
                  <span className="font-mono text-[10px]">{order.paymentId.slice(0, 16)}…</span>
                </div>
              )}
              {order.paidAt && (
                <div className="flex justify-between text-white/40">
                  <span>Paid At</span>
                  <span className="text-[10px]">{fmtDateTime(new Date(order.paidAt).getTime())}</span>
                </div>
              )}
            </div>
          </section>

          {/* Address */}
          {(addr.firstName || addr.address) && (
            <section className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4">
              <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.15em] mb-3">Delivery Address</p>
              <p className="text-xs font-bold text-white/90">{addr.firstName} {addr.lastName}</p>
              {addr.phone && <p className="text-[11px] text-white/40 mt-0.5">{addr.phone}</p>}
              {addr.email && <p className="text-[11px] text-white/40">{addr.email}</p>}
              <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
                {addr.address}{addr.apartment ? `, ${addr.apartment}` : ''}<br />
                {addr.city}{addr.state ? `, ${addr.state}` : ''} – {addr.pincode || ''}<br />
                {addr.country}
              </p>
              {addr.orderNotes && (
                <div className="mt-2.5 pt-2.5 border-t border-white/[0.06]">
                  <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.12em] mb-1">Order Note</p>
                  <p className="text-[11px] text-white/40 italic">"{addr.orderNotes}"</p>
                </div>
              )}
            </section>
          )}

          {/* Admin note */}
          {order.adminNote && (
            <section className="bg-amber-500/[0.07] border border-amber-500/[0.15] rounded-2xl p-4">
              <p className="text-[9px] font-black text-amber-400/70 uppercase tracking-[0.12em] mb-1.5">Admin Note</p>
              <p className="text-xs text-amber-200/70 whitespace-pre-wrap leading-relaxed">{order.adminNote}</p>
            </section>
          )}

          {/* Tracking */}
          {order.trackingNumber && (
            <section className="bg-purple-500/[0.07] border border-purple-500/[0.15] rounded-2xl p-4">
              <p className="text-[9px] font-black text-purple-400/70 uppercase tracking-[0.12em] mb-1.5">Tracking</p>
              <p className="text-xs text-white font-mono font-bold">{order.trackingNumber}</p>
              {order.courierName && <p className="text-[11px] text-white/40 mt-0.5">{order.courierName}</p>}
              {order.estimatedDelivery && (
                <p className="text-[10px] text-white/30 mt-1">
                  Est. {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline mt-1.5 flex items-center gap-1 font-bold">
                  Track Shipment →
                </a>
              )}
            </section>
          )}

          {/* Status History Timeline */}
          {order.statusHistory?.length > 0 && (
            <section>
              <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.15em] mb-3">Status History</p>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.06]" />
                <div className="space-y-3 pl-6">
                  {[...order.statusHistory].reverse().map((entry, i) => {
                    const esc = STATUS_CONFIG[entry.status] ?? DEFAULT_SC
                    return (
                      <div key={i} className="relative">
                        {/* Dot */}
                        <span className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-[#060d18] ${i === 0 ? esc.dot : 'bg-white/15'}`} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={entry.status} size="xs" />
                            <span className="text-[9px] text-white/25 font-mono">
                              {entry.at ? fmtDateTime(new Date(entry.at).getTime()) : '—'}
                            </span>
                          </div>
                          {entry.message && (
                            <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{entry.message}</p>
                          )}
                          {entry.location && (
                            <p className="text-[10px] text-white/30 mt-0.5">📍 {entry.location}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Meta */}
          <div className="text-[9px] text-white/20 pt-2 space-y-0.5 font-mono border-t border-white/[0.05]">
            <p>Created: {fmtDateTime(order.date)}</p>
            {order.updatedAt && <p>Updated: {fmtDateTime(order.updatedAt)}</p>}
            <p>ID: {order._id}</p>
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

  const [filters, setFilters] = useState({
    status: '', paymentMethod: '', payment: '',
    search: '', startDate: '', endDate: '',
  })

  const [statusModal, setStatusModal] = useState(null)
  const [refundModal, setRefundModal] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: pagination.limit }
      if (filters.status)         params.status        = filters.status
      if (filters.paymentMethod)  params.paymentMethod = filters.paymentMethod
      if (filters.payment !== '') params.payment       = filters.payment
      if (filters.search)         params.search        = filters.search
      if (filters.startDate)      params.startDate     = new Date(filters.startDate).getTime()
      if (filters.endDate)        params.endDate       = new Date(filters.endDate).getTime() + 86399999

      const { data } = await axios.get(
        `${backendUrl}/api/order/all`,
        { headers: { token }, params }
      )
      if (data.success) {
        setOrders((data.orders ?? []).map(normalizeOrder))
        setPagination(data.pagination ?? { total: data.orders?.length ?? 0, page: 1, limit: 20, totalPages: 1 })
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error('Failed to fetch orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, filters, pagination.limit])

  useEffect(() => { fetchOrders(1) /* eslint-disable-next-line */ }, [filters, token])

  const handleFilterChange = (key, val) => setFilters(f => ({ ...f, [key]: val }))
  const clearFilters = () => setFilters({ status: '', paymentMethod: '', payment: '', search: '', startDate: '', endDate: '' })

  const patchOrderInState = (updated) => {
    if (!updated) { fetchOrders(pagination.page); return }
    setOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
    setDetailOrder(prev => prev && prev._id === updated._id ? updated : prev)
  }

  const hasFilters = Object.values(filters).some(Boolean)

  // ── Summary counts from current page ─────────────────────────────────────
  const delivered  = orders.filter(o => o.status === 'delivered').length
  const active     = orders.filter(o => ['placed','confirmed','processing','shipped'].includes(o.status)).length
  const revenue    = orders.filter(o => o.payment).reduce((s, o) => s + o.amount, 0)

  // ── Input / Select class ──────────────────────────────────────────────────
  const inp = "bg-white/[0.04] border border-white/[0.07] hover:border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"

  return (
    <>
      {statusModal && <StatusModal order={statusModal} token={token} onClose={() => setStatusModal(null)} onUpdated={patchOrderInState} />}
      {refundModal && <RefundModal order={refundModal} token={token} onClose={() => setRefundModal(null)} onUpdated={patchOrderInState} />}
      {detailOrder && <OrderDrawer order={detailOrder} onClose={() => setDetailOrder(null)} />}

      <div className="space-y-5 min-h-screen">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Orders</h1>
            <p className="text-sm text-white/30 mt-1 font-mono">
              {loading ? 'Fetching…' : `${pagination.total.toLocaleString()} total orders`}
            </p>
          </div>
          <button
            onClick={() => fetchOrders(pagination.page)}
            disabled={loading}
            className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
          >
            <span className={`text-base ${loading ? 'animate-spin inline-block' : ''}`}>⟳</span>
            Refresh
          </button>
        </div>

        {/* ── Stat Cards ───────────────────────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total (page)" value={orders.length} sub={`of ${pagination.total} orders`}
              accent="from-white/[0.04] to-white/[0.02] border-white/[0.07]" />
            <StatCard label="Active" value={active} sub="placed · processing · shipped"
              accent="from-sky-500/10 to-sky-500/5 border-sky-500/20" />
            <StatCard label="Delivered" value={delivered} sub="on this page"
              accent="from-emerald-500/10 to-emerald-500/5 border-emerald-500/20" />
            <StatCard label="Page Revenue" value={fmtPrice(revenue)} sub="paid orders only"
              accent="from-violet-500/10 to-violet-500/5 border-violet-500/20" />
          </div>
        )}

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm">⌕</span>
            <input
              type="text"
              placeholder="Search by order number…"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className={inp + ' w-full pl-9'}
            />
            {filters.search && (
              <button onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 text-sm transition-colors">
                ✕
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* Status */}
            <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
              className={inp + ' cursor-pointer'}>
              <option value="" className="bg-[#080f1a]">All Statuses</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value} className="bg-[#080f1a]">{s.label}</option>
              ))}
            </select>

            {/* Method */}
            <select value={filters.paymentMethod} onChange={e => handleFilterChange('paymentMethod', e.target.value)}
              className={inp + ' cursor-pointer'}>
              <option value="" className="bg-[#080f1a]">All Methods</option>
              <option value="cod"      className="bg-[#080f1a]">COD</option>
              <option value="razorpay" className="bg-[#080f1a]">Razorpay</option>
            </select>

            {/* Payment */}
            <select value={filters.payment} onChange={e => handleFilterChange('payment', e.target.value)}
              className={inp + ' cursor-pointer'}>
              <option value=""      className="bg-[#080f1a]">Paid / Unpaid</option>
              <option value="true"  className="bg-[#080f1a]">✓ Paid</option>
              <option value="false" className="bg-[#080f1a]">⏳ Unpaid</option>
            </select>

            {/* Dates */}
            <input type="date" value={filters.startDate}
              onChange={e => handleFilterChange('startDate', e.target.value)}
              className={inp} title="From date" />
            <input type="date" value={filters.endDate}
              onChange={e => handleFilterChange('endDate', e.target.value)}
              className={inp} title="To date" />
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.12em]">Active:</span>
              {filters.status && (
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${(STATUS_CONFIG[filters.status] ?? DEFAULT_SC).bg} ${(STATUS_CONFIG[filters.status] ?? DEFAULT_SC).text} ${(STATUS_CONFIG[filters.status] ?? DEFAULT_SC).border}`}>
                  {STATUS_LABEL[filters.status]}
                </span>
              )}
              {filters.search && (
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                  "{filters.search}"
                </span>
              )}
              {filters.payment !== '' && (
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${filters.payment === 'true' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' : 'bg-amber-500/15 text-amber-300 border-amber-500/25'}`}>
                  {filters.payment === 'true' ? 'Paid' : 'Unpaid'}
                </span>
              )}
              {filters.paymentMethod && (
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25 capitalize">
                  {filters.paymentMethod}
                </span>
              )}
              {(filters.startDate || filters.endDate) && (
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.08]">
                  {filters.startDate || '…'} → {filters.endDate || '…'}
                </span>
              )}
              <button onClick={clearFilters}
                className="ml-auto text-[10px] text-red-400/60 hover:text-red-400 font-black transition-colors flex items-center gap-1">
                Clear all ✕
              </button>
            </div>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Order #', 'Date', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[9px] font-black text-white/25 uppercase tracking-[0.12em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [1,2,3,4,5,6].map(i => <SkeletonRow key={i} />)
                  : orders.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="text-4xl mb-3 opacity-20">📦</div>
                        <p className="text-white/25 text-sm font-bold">No orders found</p>
                        {hasFilters && (
                          <button onClick={clearFilters}
                            className="mt-3 text-xs text-cyan-400/60 hover:text-cyan-400 font-bold transition-colors">
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                  : orders.map((order, idx) => {
                    const addr = order.address ?? {}
                    const sc   = STATUS_CONFIG[order.status] ?? DEFAULT_SC
                    return (
                      <tr key={order._id}
                        className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        style={{ animationDelay: `${idx * 30}ms` }}
                        onClick={() => setDetailOrder(order)}>

                        {/* Order # */}
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-black text-cyan-400 font-mono tracking-tight">#{order.orderNumber}</p>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-[11px] text-white/40 font-medium">{fmtDate(order.date)}</p>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-bold text-white/80 whitespace-nowrap">
                            {addr.firstName} {addr.lastName}
                          </p>
                          <p className="text-[10px] text-white/30 truncate max-w-[130px] mt-0.5">
                            {addr.phone || addr.email || ''}
                          </p>
                        </td>

                        {/* Items */}
                        <td className="px-5 py-3.5">
                          <p className="text-[11px] text-white/50 font-semibold">
                            {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-[10px] text-white/25 truncate max-w-[140px] mt-0.5">
                            {order.items?.[0]?.name}
                          </p>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-xs font-black text-white/90">{fmtPrice(order.amount)}</p>
                          <p className="text-[10px] text-white/30 capitalize mt-0.5">{order.paymentMethod}</p>
                        </td>

                        {/* Payment */}
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap ${
                            order.payment
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                          }`}>
                            {order.payment ? '✓ Paid' : '⏳ Unpaid'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setStatusModal(order)}
                              className="text-[10px] font-black bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/20 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                              title="Update status">
                              Status
                            </button>
                            {['cancelled', 'refunded'].includes(order.status) && (
                              <button
                                onClick={() => setRefundModal(order)}
                                className="text-[10px] font-black bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                                title="Process refund">
                                Refund
                              </button>
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

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {!loading && pagination.totalPages >= 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.05]">
              <p className="text-[11px] text-white/25 font-mono">
                Page <span className="text-white/50 font-black">{pagination.page}</span> of {pagination.totalPages}
                <span className="text-white/20"> · </span>
                <span className="text-white/40">{pagination.total}</span> orders total
              </p>

              <div className="flex items-center gap-1.5">
                {/* Prev */}
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchOrders(pagination.page - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/[0.07] hover:border-white/20 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-sm">
                  ←
                </button>

                {/* Page numbers */}
                {(() => {
                  const total = pagination.totalPages
                  const cur   = pagination.page
                  let pages   = []
                  if (total <= 7) {
                    pages = Array.from({ length: total }, (_, i) => i + 1)
                  } else {
                    const start = Math.max(2, cur - 1)
                    const end   = Math.min(total - 1, cur + 1)
                    pages = [1]
                    if (start > 2) pages.push('…')
                    for (let p = start; p <= end; p++) pages.push(p)
                    if (end < total - 1) pages.push('…')
                    pages.push(total)
                  }
                  return pages.map((p, i) =>
                    p === '…' ? (
                      <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-white/20 text-xs">…</span>
                    ) : (
                      <button key={p}
                        onClick={() => fetchOrders(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all border ${
                          p === cur
                            ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                            : 'border-white/[0.07] hover:border-white/20 text-white/40 hover:text-white'
                        }`}>
                        {p}
                      </button>
                    )
                  )
                })()}

                {/* Next */}
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchOrders(pagination.page + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/[0.07] hover:border-white/20 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-sm">
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Orders