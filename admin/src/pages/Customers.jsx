// pages/Customers.jsx
// Customer Management — view all customers, their purchase history & stats
// ✅ Redesigned filter bar with preset date ranges
// ✅ Improved download dropdown with progress + context
// ✅ Per-customer Export CSV button
// ✅ Search & pagination
// ✅ Stats summary
// ✅ Mobile responsive
// ✅ Toast notifications

import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import Customer360Drawer from './Customer360Drawer'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = iso => {
  if (!iso) return '\u2014'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
const fmtDateTime = iso => {
  if (!iso) return '\u2014'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' \u00b7 ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
const fmtCurrency = (n = 0) => '\u20b9' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const STATUS_COLORS = {
  placed:     { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6', label: 'Placed' },
  confirmed:  { bg: '#eff6ff', color: '#1d4ed8', dot: '#8b5cf6', label: 'Confirmed' },
  processing: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b', label: 'Processing' },
  shipped:    { bg: '#ecfdf5', color: '#059669', dot: '#10b981', label: 'Shipped' },
  delivered:  { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e', label: 'Delivered' },
  cancelled:  { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444', label: 'Cancelled' },
  refunded:   { bg: '#fdf2f8', color: '#db2777', dot: '#ec4899', label: 'Refunded' },
}

// ─── Inline SVG icons ──────────────────────────────────────────────────────────
const IconSearch    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const IconRefresh   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/></svg>
const IconChevDown  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}><path d="M6 9l6 6 6-6"/></svg>
const IconChevUp    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}><path d="M18 15l-6-6-6 6"/></svg>
const IconX         = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}><path d="M18 6L6 18M6 6l12 12"/></svg>
const IconUsers     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40,flexShrink:0}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
const IconMail      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
const IconPhone     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
const IconCalendar  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconShopping  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
const IconRupee     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M6 3h12M6 8h12M6 13l5 8m-1-8l5-8"/></svg>
const IconEye       = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconAlert     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const IconCheck     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}><path d="M20 6L9 17l-5-5"/></svg>
const IconClock     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const IconBox       = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
const IconHash      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
const IconDownload  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconCSV       = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
const IconCalendarDays = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>
const IconCheckCircle = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>

// ─── Shared tokens ────────────────────────────────────────────────────────────
const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }
const inpStyle = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  color: '#111827', background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 8,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
}
const fi = e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }
const bi = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }

// ─── Preset date ranges ────────────────────────────────────────────────────────
const DATE_PRESETS = [
  { label: 'Today',     days: 0 },
  { label: 'This Week',  days: 7 },
  { label: 'This Month', days: 30 },
  { label: '3 Months',   days: 90 },
]

const getPresetRange = (preset) => {
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  if (preset.days === 0) return { from: to, to }
  const from = new Date(now)
  from.setDate(from.getDate() - preset.days)
  return { from: from.toISOString().slice(0, 10), to }
}

// ─── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      background: c.bg, color: c.color,
      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, count, accent, sub }) => (
  <div style={{ ...cardStyle, padding: '16px 18px', borderLeft: '3px solid ' + accent }}>
    <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
      {label}
    </p>
    <p style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1 }}>{count}</p>
    {sub && <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{sub}</p>}
  </div>
)

// ─── Spinner ───────────────────────────────────────────────────────────────────
const Spin = ({ size = 13 }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    border: '2px solid #e5e7eb', borderTopColor: '#2563eb',
    display: 'inline-block', animation: 'cuSpin 0.7s linear infinite',
  }} />
)

// ─── Order items list ───────────────────────────────────────────────────────────
const OrderItems = ({ items }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 0' }}>
    {items && items.map((item, i) => (
      <div key={i} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 11, color: '#374151',
      }}>
        <span style={{
          width: 4, height: 4, borderRadius: '50%',
          background: '#d1d5db', flexShrink: 0,
        }} />
        <span style={{ flex: 1 }}>{item.name}</span>
        <span style={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>x{item.quantity}</span>
        <span style={{ fontWeight: 600, color: '#059669', whiteSpace: 'nowrap' }}>{fmtCurrency(item.price * item.quantity)}</span>
      </div>
    ))}
  </div>
)

// ─── Method badge ───────────────────────────────────────────────────────────────
const METHOD_BADGE = {
  cod:    { icon: '\u{1F4B5}', label: 'COD',    bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  razorpay: { icon: '\u{1F4B3}', label: 'Razorpay', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  pickup: { icon: '\u{1F4E6}', label: 'Pickup',   bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
}

const getMethodKey = (order) => {
  if (order.delivery && order.delivery.method === 'pickup') return 'pickup'
  if (order.payment && order.payment.method === 'razorpay') return 'razorpay'
  return 'cod'
}

// ─── Order detail row ───────────────────────────────────────────────────────────
const OrderDetailRow = ({ order }) => {
  const mk = getMethodKey(order)
  const mb = METHOD_BADGE[mk]
  return (
    <div style={{
      borderBottom: '1px solid #f3f4f6',
      padding: '10px 12px',
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ fontWeight: 600, color: '#2563eb', fontSize: 11, minWidth: 120 }}>
          {order.orderNumber || '\u2014'}
        </span>
        <span style={{ color: '#6b7280', fontSize: 11 }}>
          {fmtDateTime(order.createdAt)}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          padding: '2px 6px', borderRadius: 4,
          background: mb.bg, color: mb.color,
          border: '1px solid ' + mb.border,
          fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          {mb.icon} {mb.label}
        </span>
        <span style={{ fontWeight: 700, color: '#059669', fontSize: 12 }}>
          {fmtCurrency(order.grandTotal)}
        </span>
        <StatusBadge status={order.status} />
      </div>
      <OrderItems items={order.items} />
    </div>
  )
}

// ─── Flat orders list ───────────────────────────────────────────────────────────
const CustomerOrderList = ({ orders }) => {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
        fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase',
        borderBottom: '1px solid #f3f4f6', background: '#f9fafb',
      }}>
        <span style={{ minWidth: 120 }}>Order #</span>
        <span style={{ minWidth: 80 }}>Date</span>
        <span style={{ minWidth: 70 }}>Method</span>
        <span style={{ minWidth: 60 }}>Amount</span>
        <span>Status</span>
      </div>
      {orders.map(order => (
        <OrderDetailRow key={order._id} order={order} />
      ))}
    </div>
  )
}

// ─── Customer card ─────────────────────────────────────────────────────────────
const CustomerCard = ({ customer, onViewOrders, ordersLoading, orders, onDownloadCSV, onView360 }) => {
  const [expanded, setExpanded] = useState(false)
  const hasOrders = customer.totalOrders > 0

  const handleToggle = () => {
    if (!expanded && hasOrders) onViewOrders(customer._id)
    setExpanded(e => !e)
  }

  return (
    <div style={{ ...cardStyle, transition: 'all 0.15s' }}>
      <div onClick={handleToggle} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', cursor: 'pointer', userSelect: 'none',
        flexWrap: 'nowrap',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: hasOrders ? '#eff6ff' : '#f3f4f6',
          color: hasOrders ? '#2563eb' : '#6b7280',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700,
        }}>
          {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {customer.name}
            {customer.isBlocked && (
              <span style={{ marginLeft: 6, fontSize: 9, color: '#dc2626', fontWeight: 600 }}>Blocked</span>
            )}
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {customer.email}
          </p>
        </div>

        {/* 360° button */}
        {onView360 && (
          <button onClick={function(e) { e.stopPropagation(); onView360(customer) }}
            title="Customer 360° View"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '4px 8px', borderRadius: 6, flexShrink: 0,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              color: '#fff',
              border: 'none',
              fontSize: 9, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.03em',
              transition: 'all 0.12s',
            }}
            onMouseEnter={function(e) { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={function(e) { e.currentTarget.style.opacity = '1' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:11,height:11}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            360°
          </button>
        )}

        <div className="cu-stat" style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#2563eb', margin: 0 }}>{customer.totalOrders}</p>
            <p style={{ fontSize: 9, color: '#9ca3af', margin: 0, textTransform: 'uppercase' }}>Orders</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#059669', margin: 0 }}>{fmtCurrency(customer.totalSpent)}</p>
            <p style={{ fontSize: 9, color: '#9ca3af', margin: 0, textTransform: 'uppercase' }}>Spent</p>
          </div>
        </div>

        <div className="cu-payment" style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
          {customer.codOrders > 0 && (
            <span title="Cash on Delivery" style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 6px', borderRadius: 4,
              background: '#fffbeb', color: '#d97706',
              border: '1px solid #fde68a',
              fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
            }}>{'\u{1F4B5}'} COD {customer.codOrders}</span>
          )}
          {customer.razorpayOrders > 0 && (
            <span title="Razorpay" style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 6px', borderRadius: 4,
              background: '#eff6ff', color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
            }}>{'\u{1F4B3}'} Razorpay {customer.razorpayOrders}</span>
          )}
          {customer.pickupOrders > 0 && (
            <span title="Office Pickup" style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 6px', borderRadius: 4,
              background: '#ecfdf5', color: '#059669',
              border: '1px solid #a7f3d0',
              fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
            }}>{'\u{1F4E6}'} Pickup {customer.pickupOrders}</span>
          )}
        </div>

        <div className="cu-date" style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, whiteSpace: 'nowrap' }}>
            {customer.lastOrderDate ? fmtDate(customer.lastOrderDate) : 'No orders'}
          </p>
          {customer.lastOrderNumber && (
            <p style={{ fontSize: 10, color: '#6b7280', margin: '2px 0 0', whiteSpace: 'nowrap' }}>
              {customer.lastOrderNumber} <StatusBadge status={customer.lastOrderStatus} />
            </p>
          )}
        </div>

        <span style={{ color: '#9ca3af', display: 'flex', flexShrink: 0 }}>
          {ordersLoading ? <Spin /> : expanded ? <IconChevUp /> : <IconChevDown />}
        </span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
          <div style={{
            display: 'flex', gap: 14, padding: '12px 16px',
            borderBottom: '1px solid #f3f4f6',
            flexWrap: 'wrap', fontSize: 12, alignItems: 'center',
          }}>
            {customer.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280' }}>
                <span style={{ color: '#9ca3af', display: 'flex' }}><IconPhone /></span>
                {customer.phone}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280' }}>
              <span style={{ color: '#9ca3af', display: 'flex' }}><IconMail /></span>
              <a href={'mailto:' + customer.email} style={{ color: '#2563eb', textDecoration: 'none' }}>{customer.email}</a>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280' }}>
              <span style={{ color: '#9ca3af', display: 'flex' }}><IconCalendar /></span>
              Joined {fmtDate(customer.createdAt)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280' }}>
              <span style={{ color: '#9ca3af', display: 'flex' }}><IconShopping /></span>
              {customer.totalOrders} order{customer.totalOrders !== 1 ? 's' : ''} - {fmtCurrency(customer.totalSpent)} total
            </span>
            {onDownloadCSV && (
              <button onClick={function(e) { e.stopPropagation(); onDownloadCSV(customer) }}
                title="Download this customer's report"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', borderRadius: 5,
                  background: '#ecfdf5', color: '#059669',
                  border: '1px solid #a7f3d0',
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  marginLeft: 'auto',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={function(e) { e.currentTarget.style.background = '#d1fae5' }}
                onMouseLeave={function(e) { e.currentTarget.style.background = '#ecfdf5' }}
              >
                <IconDownload /> Export CSV
              </button>
            )}
          </div>

          {orders.length > 0 ? (
            <CustomerOrderList orders={orders} />
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
              No orders found for this customer
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [ordersLoading, setOrdersLoading] = useState(null)
  const [ordersMap, setOrdersMap] = useState({})
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState('success')
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [dateFromState, setDateFromState] = useState('')
  const [dateToState, setDateToState] = useState('')
  const [activePreset, setActivePreset] = useState(null)
  const [dateError, setDateError] = useState('')
  const [customer360Target, setCustomer360Target] = useState(null)

  const showToast = (msg, type) => { setToastMsg(msg); setToastType(type || 'success'); setTimeout(() => setToastMsg(''), 3500) }

  // ─── Direct fetch function (no stale closures - uses explicit params only) ──
  const doFetch = useCallback(async (p, q, dF, dT) => {
    setLoading(true); setError('')
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (q && q.trim()) params.set('search', q.trim())
      if (dF) params.set('dateFrom', dF)
      if (dT) params.set('dateTo', dT)
      const url = API_BASE + '/api/user/customers?' + params.toString()
      const { data } = await axios.get(url, {
        headers: { Authorization: 'Bearer ' + token },
      })
      if (data.success) {
        setCustomers(data.customers)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else setError(data.message || 'Failed to load customers.')
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.message) || err.message || 'Network error.')
    }
    finally { setLoading(false) }
  }, [])  // No deps - always uses explicit params

  // Initial load
  useEffect(() => { doFetch(1, '', '', '') }, [])

  const handleSearch = () => {
    setPage(1)
    doFetch(1, search, dateFromState, dateToState)
  }

  const handleKeyDown = e => { if (e.key === 'Enter') handleSearch() }

  // ─── Date filter logic ─────────────────────────────────────────────────────
  const applyDateFilter = (from, to) => {
    setDateError('')
    if (from && to && from > to) {
      setDateError('From date cannot be after To date')
      return
    }
    setPage(1)
    doFetch(1, search, from, to)
  }

  const handlePresetClick = (preset) => {
    setActivePreset(preset.label)
    const range = getPresetRange(preset)
    setDateFromState(range.from)
    setDateToState(range.to)
    setDateError('')
    setPage(1)
    doFetch(1, search, range.from, range.to)
  }

  const handleDateFromChange = (val) => {
    setDateFromState(val)
    setActivePreset(null)
    if (dateError) setDateError('')
  }

  const handleDateToChange = (val) => {
    setDateToState(val)
    setActivePreset(null)
    if (dateError) setDateError('')
  }

  const clearDateFilter = () => {
    setDateFromState('')
    setDateToState('')
    setActivePreset(null)
    setDateError('')
    setPage(1)
    doFetch(1, search, '', '')
  }

  const isDateActive = dateFromState || dateToState

  // ─── View orders ──────────────────────────────────────────────────────────────
  const handleViewOrders = async (userId) => {
    if (ordersMap[userId]) return
    setOrdersLoading(userId)
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.post(
        API_BASE + '/api/user/customer-orders',
        { userId: userId },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      if (data.success) {
        setOrdersMap(prev => {
          const next = {}
          for (const k of Object.keys(prev)) next[k] = prev[k]
          next[userId] = data.orders
          return next
        })
      }
    } catch (err) {
      showToast('Failed to load orders', 'error')
    } finally {
      setOrdersLoading(null)
    }
  }

  // ── Download CSV ───────────────────────────────────────────────────────────
  const downloadCSV = (rows, filename) => {
    const headers = ['Name','Email','Phone','Joined Date','Total Orders','Total Spent','COD Orders','Razorpay Orders','Pickup Orders','Last Order Date','Last Order Number','Last Order Status','Average Order Value']
    const csvRows = [headers.join(',')]
    for (const r of rows) {
      const avg = r.totalOrders > 0 ? Math.round(r.totalSpent / r.totalOrders) : 0
      const esc = (v) => {
        const s = String(v || '')
        return '"' + s.replace(/"/g, '""') + '"'
      }
      csvRows.push([
        esc(r.name),
        esc(r.email),
        esc(r.phone),
        r.createdAt ? fmtDate(r.createdAt) : '-',
        r.totalOrders,
        r.totalSpent,
        r.codOrders || 0,
        r.razorpayOrders || 0,
        r.pickupOrders || 0,
        r.lastOrderDate ? fmtDate(r.lastOrderDate) : '-',
        esc(r.lastOrderNumber),
        esc(r.lastOrderStatus || '-'),
        avg,
      ].join(','))
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const fetchFilteredCustomers = async () => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams({ page: 1, limit: 9999 })
    if (search && search.trim()) params.set('search', search.trim())
    if (dateFromState) params.set('dateFrom', dateFromState)
    if (dateToState) params.set('dateTo', dateToState)
    const { data } = await axios.get(API_BASE + '/api/user/customers?' + params.toString(), {
      headers: { Authorization: 'Bearer ' + token },
    })
    if (!data.success || !data.customers) throw new Error('Failed to fetch')
    return data.customers
  }

  const handleDownloadSummary = async () => {
    setDownloadOpen(false); setDownloading(true)
    try {
      const rows = isDateActive || (search && search.trim()) ? await fetchFilteredCustomers() : customers
      const prefix = isDateActive ? '-' + dateFromState + '-to-' + dateToState : (search && search.trim() ? '-search-' + search.trim().replace(/\s+/g, '-') : '')
      downloadCSV(rows, 'customers' + prefix + '-' + new Date().toISOString().slice(0,10) + '.csv')
      showToast('Downloaded ' + rows.length + ' customer' + (rows.length !== 1 ? 's' : ''), 'success')
    } catch (err) {
      showToast('Error downloading report', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadFullReport = async () => {
    setDownloadOpen(false); setDownloading(true)
    try {
      const rows = await fetchFilteredCustomers()
      const prefix = isDateActive ? '-' + dateFromState + '-to-' + dateToState : ''
      downloadCSV(rows, 'all-customers-report' + prefix + '-' + new Date().toISOString().slice(0,10) + '.csv')
      showToast('Full report downloaded (' + rows.length + ' customer' + (rows.length !== 1 ? 's' : '') + ')', 'success')
    } catch (err) {
      showToast('Error downloading report', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadCustomerCSV = (customer) => {
    const esc = (v) => { const s = String(v || ''); return '"' + s.replace(/"/g, '""') + '"' }
    const headers = ['Name','Email','Phone','Order Number','Date','Method','Amount','Status','Products','Product Qty','Product Price']
    const csvRows = [headers.join(',')]
    const orders = ordersMap[customer._id] || []
    if (orders.length === 0) {
      csvRows.push([
        esc(customer.name), esc(customer.email), esc(customer.phone || ''),
        'No orders','','','','','','',''
      ].join(','))
    } else {
      for (const o of orders) {
        const mk = o.delivery && o.delivery.method === 'pickup' ? 'Pickup' : (o.payment && o.payment.method === 'razorpay' ? 'Razorpay' : 'COD')
        const items = o.items || []
        if (items.length === 0) {
          csvRows.push([
            esc(customer.name), esc(customer.email), esc(customer.phone || ''),
            esc(o.orderNumber || ''), fmtDate(o.createdAt), mk, o.grandTotal || 0,
            esc(o.status || ''), '','',''
          ].join(','))
        } else {
          for (const item of items) {
            csvRows.push([
              esc(customer.name), esc(customer.email), esc(customer.phone || ''),
              esc(o.orderNumber || ''), fmtDate(o.createdAt), mk, o.grandTotal || 0,
              esc(o.status || ''), esc(item.name), item.quantity || 0, (item.price || 0) * (item.quantity || 0)
            ].join(','))
          }
        }
      }
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'customer-' + customer.name.toLowerCase().replace(/\s+/g, '-') + '-' + new Date().toISOString().slice(0,10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Report downloaded for ' + customer.name, 'success')
  }

  // ── Stats ──
  const stats = useMemo(() => {
    const totalCustomers = total
    const totalOrders = customers.reduce((s, c) => s + c.totalOrders, 0)
    const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)
    const repeatCustomers = customers.filter(c => c.totalOrders > 1).length
    return { totalCustomers, totalOrders, totalRevenue, repeatCustomers }
  }, [customers, total])

  return (
    <>
      <style>{`
        @keyframes cuSpin { to { transform: rotate(360deg); } }
        @keyframes cuFade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes cuPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes cuSlideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        input::placeholder { color: #9ca3af; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
        .cu-stat     { display: flex; }
        .cu-date     { display: block; }
        .cu-payment  { display: flex; }
        @media (max-width: 640px) {
          .cu-stat     { display: none !important; }
        }
        @media (max-width: 768px) {
          .cu-date     { display: none !important; }
          .cu-payment  { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1000, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
              Customers
            </h1>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              View all registered customers and their purchase history
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Download button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={function() { setDownloadOpen(function(o) { return !o }) }}
                disabled={downloading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: 8,
                  background: downloading ? '#f3f4f6' : '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  fontSize: 12, fontWeight: 600, cursor: downloading ? 'wait' : 'pointer',
                  opacity: downloading ? 0.7 : 1, transition: 'all 0.15s',
                }}
                onMouseEnter={function(e) { if (!downloading) e.currentTarget.style.background = '#d1fae5' }}
                onMouseLeave={function(e) { e.currentTarget.style.background = downloading ? '#f3f4f6' : '#ecfdf5' }}
              >
                {downloading ? <Spin /> : <IconDownload />}
                {downloading ? 'Downloading...' : 'Download Report'}
              </button>

              {downloadOpen && (
                <div style={{ animation: 'cuSlideDown 0.15s ease' }}>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={function() { setDownloadOpen(false) }} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 20, overflow: 'hidden', minWidth: 230,
                  }}>
                    <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Export Customers
                    </div>
                    <button onClick={handleDownloadSummary}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 14px', border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, textAlign: 'left',
                        background: 'transparent', color: '#374151',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = '#f9fafb' }}
                      onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ color: '#059669', display: 'flex' }}><IconCSV /></span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827' }}>
                          {isDateActive || (search && search.trim()) ? 'Filtered Customers' : 'Summary (Current View)'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9ca3af' }}>
                          {isDateActive || (search && search.trim()) ? 'All ' + total + ' customers matching filter' : customers.length + ' customer' + (customers.length !== 1 ? 's' : '') + ' on this page'}
                        </p>
                      </div>
                      <span style={{ fontSize: 9, color: '#9ca3af', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>.csv</span>
                    </button>
                    <div style={{ height: 1, background: '#f3f4f6' }} />
                    <button onClick={handleDownloadFullReport}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 14px', border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, textAlign: 'left',
                        background: 'transparent', color: '#374151',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = '#f9fafb' }}
                      onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ color: '#2563eb', display: 'flex' }}><IconCSV /></span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827' }}>Complete Export</p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9ca3af' }}>
                          All registered customers{isDateActive ? ' \u00b7 filtered by date' : search && search.trim() ? ' \u00b7 filtered by search' : ' (no filter)'}
                        </p>
                      </div>
                      <span style={{ fontSize: 9, color: '#9ca3af', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>.csv</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh button */}
            <button
              onClick={function() { doFetch(page, search, dateFromState, dateToState) }}
              disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 8,
                background: '#eff6ff', color: '#2563eb',
                border: '1px solid #bfdbfe',
                fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1, transition: 'all 0.15s',
              }}
              onMouseEnter={function(e) { if (!loading) e.currentTarget.style.background = '#ede9fe' }}
              onMouseLeave={function(e) { e.currentTarget.style.background = '#eff6ff' }}
            >
              <span style={{ display: 'flex', animation: loading ? 'cuSpin 0.8s linear infinite' : 'none' }}>
                <IconRefresh />
              </span>
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
          <StatCard label="Total Customers" count={stats.totalCustomers} accent="#6366f1" />
          <StatCard label="Total Orders"    count={stats.totalOrders}    accent="#3b82f6" />
          <StatCard label="Total Revenue"   count={fmtCurrency(stats.totalRevenue)} accent="#059669" />
          <StatCard label="Repeat Buyers"   count={stats.repeatCustomers} accent="#d97706"
            sub={stats.totalCustomers > 0 ? Math.round(stats.repeatCustomers / stats.totalCustomers * 100) + '% of customers' : '\u2014'} />
        </div>

        {/* ── Redesigned Search + Filter bar ── */}
        <div style={{ ...cardStyle, padding: '16px 18px' }}>
          {/* Search row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: '#9ca3af', pointerEvents: 'none' }}>
                <IconSearch />
              </span>
              <input
                type="text" value={search} onChange={function(e) { setSearch(e.target.value) }} onKeyDown={handleKeyDown}
                placeholder="Search by name, email, or phone..."
                style={{ ...inpStyle, paddingLeft: 36, paddingRight: search ? 34 : 12 }}
                onFocus={fi} onBlur={bi}
              />
              {search && (
                <button onClick={function() { setSearch(''); setPage(1); doFetch(1, '', dateFromState, dateToState) }}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
                    display: 'flex',
                  }}>
                  <IconX />
                </button>
              )}
            </div>
            <button onClick={handleSearch}
              style={{
                padding: '7px 18px', borderRadius: 8,
                background: '#2563eb', color: '#fff',
                border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.15s',
              }}
              onMouseEnter={function(e) { e.currentTarget.style.background = '#4338ca' }}
              onMouseLeave={function(e) { e.currentTarget.style.background = '#2563eb' }}
            >
              <IconSearch /> Search
            </button>
          </div>

          {/* Date filter section */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 12, fontWeight: 600 }}>
                <span><IconCalendarDays /></span>
                <span>Date Range</span>
              </div>

              {/* Preset buttons */}
              {DATE_PRESETS.map(function(preset) { return (
                <button key={preset.label} onClick={function() { handlePresetClick(preset) }}
                  style={{
                    padding: '5px 11px', borderRadius: 6,
                    background: activePreset === preset.label ? '#2563eb' : '#f3f4f6',
                    color: activePreset === preset.label ? '#fff' : '#374151',
                    border: activePreset === preset.label ? 'none' : '1px solid #e5e7eb',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={function(e) {
                    if (activePreset !== preset.label) e.currentTarget.style.background = '#e5e7eb'
                  }}
                  onMouseLeave={function(e) {
                    if (activePreset !== preset.label) e.currentTarget.style.background = '#f3f4f6'
                  }}
                >{preset.label}</button>
              )})}

              {/* Divider */}
              <span style={{ width: 1, height: 18, background: '#e5e7eb', flexShrink: 0 }} />

              {/* From date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>From</span>
                <input
                  type="date" value={dateFromState}
                  onChange={function(e) { handleDateFromChange(e.target.value) }}
                  style={{
                    ...inpStyle, padding: '5px 8px', fontSize: 11, width: 140,
                    borderColor: dateError ? '#dc2626' : '#e5e7eb',
                  }}
                />
              </div>

              {/* To date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>To</span>
                <input
                  type="date" value={dateToState}
                  onChange={function(e) { handleDateToChange(e.target.value) }}
                  style={{
                    ...inpStyle, padding: '5px 8px', fontSize: 11, width: 140,
                    borderColor: dateError ? '#dc2626' : '#e5e7eb',
                  }}
                />
              </div>

              {/* Apply filter button */}
              {(dateFromState || dateToState) && (
                <button onClick={function() { applyDateFilter(dateFromState, dateToState) }}
                  style={{
                    padding: '5px 12px', borderRadius: 6,
                    background: '#2563eb', color: '#fff',
                    border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = '#4338ca' }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = '#2563eb' }}
                >
                  <IconCheckCircle /> Apply
                </button>
              )}

              {/* Clear dates */}
              {isDateActive && (
                <button onClick={clearDateFilter}
                  style={{
                    padding: '5px 11px', borderRadius: 6,
                    background: 'transparent', color: '#6b7280',
                    border: '1px solid #e5e7eb',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = '#f3f4f6' }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent' }}
                >
                  <IconX /> Clear
                </button>
              )}
            </div>

            {/* Date validation error */}
            {dateError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 6,
                background: '#fff5f5', color: '#dc2626',
                fontSize: 11, fontWeight: 500, animation: 'cuFade 0.2s ease',
              }}>
                <IconAlert /> {dateError}
              </div>
            )}

            {/* Active filter indicator */}
            {isDateActive && !dateError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                marginTop: 8, fontSize: 10, color: '#9ca3af',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                Filtering orders from {dateFromState || 'beginning'} to {dateToState || 'today'}
                {activePreset ? ' \u00b7 ' + activePreset + ' preset' : ''}
              </div>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 14px', borderRadius: 10,
            background: '#fff5f5', border: '1px solid #fecaca',
            animation: 'cuFade 0.2s ease',
          }}>
            <span style={{ color: '#dc2626', display: 'flex' }}><IconAlert /></span>
            <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(function(i) { return (
              <div key={i} style={{
                height: 64, borderRadius: 12, background: '#f3f4f6',
                animation: 'cuPulse 1.5s ease-in-out infinite',
              }} />
            )})}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && customers.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 20px', textAlign: 'center',
            border: '1px dashed #e5e7eb', borderRadius: 14,
            animation: 'cuFade 0.2s ease',
          }}>
            <span style={{ color: '#d1d5db', marginBottom: 14 }}><IconUsers /></span>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>
              {search || isDateActive ? 'No customers found' : 'No customers yet'}
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
              {search || isDateActive ? 'Try adjusting your search or filters' : 'Customers will appear after registration'}
            </p>
          </div>
        )}

        {/* ── Customers list ── */}
        {!loading && customers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {customers.map(function(customer) { return (
              <div key={customer._id} style={{ animation: 'cuFade 0.2s ease' }}>
                <CustomerCard
                  customer={customer}
                  onViewOrders={handleViewOrders}
                  ordersLoading={ordersLoading === customer._id}
                  orders={ordersMap[customer._id] || []}
                  onDownloadCSV={handleDownloadCustomerCSV}
                  onView360={setCustomer360Target}
                />
              </div>
            )})}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <button
              onClick={function() {
                const np = Math.max(1, page - 1)
                setPage(np)
                doFetch(np, search, dateFromState, dateToState)
              }}
              disabled={page <= 1}
              style={{
                padding: '7px 14px', borderRadius: 8,
                background: page <= 1 ? '#f3f4f6' : '#fff',
                border: '1px solid #e5e7eb',
                color: page <= 1 ? '#d1d5db' : '#374151',
                fontSize: 12, fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >Prev</button>

            {Array.from({ length: totalPages }, function(_, i) { return i + 1 }).map(function(p) { return (
              <button key={p} onClick={function() { setPage(p); doFetch(p, search, dateFromState, dateToState) }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: p === page ? '#2563eb' : '#fff',
                  border: p === page ? 'none' : '1px solid #e5e7eb',
                  color: p === page ? '#fff' : '#374151',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >{p}</button>
            )})}

            <button
              onClick={function() {
                const np = Math.min(totalPages, page + 1)
                setPage(np)
                doFetch(np, search, dateFromState, dateToState)
              }}
              disabled={page >= totalPages}
              style={{
                padding: '7px 14px', borderRadius: 8,
                background: page >= totalPages ? '#f3f4f6' : '#fff',
                border: '1px solid #e5e7eb',
                color: page >= totalPages ? '#d1d5db' : '#374151',
                fontSize: 12, fontWeight: 600, cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >Next</button>
          </div>
        )}

        {/* ── Result count ── */}
        {!loading && customers.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            Showing {customers.length} of {total} customer{total !== 1 ? 's' : ''}
            {isDateActive ? ' (filtered by date)' : ''}
          </p>
        )}
      </div>

      {/* ── Toast ── */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 18px', borderRadius: 10,
          background: '#fff', border: '1px solid #e5e7eb',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          color: toastType === 'error' ? '#dc2626' : '#16a34a',
          fontSize: 13, fontWeight: 600,
          animation: 'cuFade 0.2s ease',
        }}>
          <span style={{ display: 'flex', color: toastType === 'error' ? '#dc2626' : '#16a34a' }}>
            {toastType === 'error' ? <IconAlert /> : <IconCheck />}
          </span>
          {toastMsg}
        </div>
      )}

      {/* ── Customer 360° Drawer ── */}
      {customer360Target && (
        <Customer360Drawer
          customer={customer360Target}
          onClose={() => setCustomer360Target(null)}
        />
      )}
    </>
  )
}
