// pages/Dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive admin Dashboard with:
//   ✅ KPI cards (Products, Orders, Revenue, Customers, Stock)
//   ✅ Order Status donut chart (recharts)
//   ✅ Monthly Revenue trend line chart (recharts)
//   ✅ Recent Orders table
//   ✅ Low Stock Alerts
//   ✅ Recent Contacts
//   ✅ Skeleton loading & responsive
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { useNewOrderSocket } from '../hooks/useSocket'

// ─── Formatting helpers ───────────────────────────────────────────────────────
const fmtPrice = n => `${currency}${Number(n ?? 0).toLocaleString('en-IN')}`
const fmtDate = ms =>
  ms ? new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const fmtCompact = n => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000)     return `${(n / 1000).toFixed(1)}K`
  return n?.toLocaleString('en-IN') ?? 0
}

// ─── Status colours ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  placed:     { bg: '#eff6ff',  text: '#2563eb',  dot: '#3b82f6' },
  confirmed:  { bg: '#eff6ff',  text: '#1d4ed8',  dot: '#8b5cf6' },
  processing: { bg: '#fffbeb',  text: '#d97706',  dot: '#f59e0b' },
  shipped:    { bg: '#faf5ff',  text: '#9333ea',  dot: '#a855f7' },
  delivered:  { bg: '#f0fdf4',  text: '#16a34a',  dot: '#22c55e' },
  cancelled:  { bg: '#fff5f5',  text: '#dc2626',  dot: '#ef4444' },
  refunded:   { bg: '#f8fafc',  text: '#64748b',  dot: '#94a3b8' },
}
const STATUS_LABELS = {
  placed: 'Placed', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
}
const DONUT_COLORS = ['#3b82f6','#8b5cf6','#f59e0b','#a855f7','#22c55e','#ef4444','#94a3b8']

// ─── Inline styles ────────────────────────────────────────────────────────────
const cardSx = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}
const inpSx = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  color: '#111827', background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 8,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, accent, trend, trendUp }) {
  return (
    <div style={{ ...cardSx, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
        background: accent,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, color: '#9ca3af',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            margin: '0 0 8px',
          }}>{label}</p>
          <p style={{
            fontSize: 26, fontWeight: 800, color: '#111827',
            lineHeight: 1, margin: '0 0 4px',
          }}>{value}</p>
          {sub && (
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              {trend !== undefined && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: trendUp ? '#16a34a' : '#dc2626',
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                }}>
                  <span style={{ display: 'inline-flex' }}>
                    {trendUp ? '↑' : '↓'}
                  </span>
                  {trend}%
                </span>
              )}
              {sub}
            </p>
          )}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `${accent}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 8, marginBottom: 16,
    }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
        {sub && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'sm' }) {
  const c = STATUS_COLORS[status] ?? { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'xs' ? '2px 8px' : '3px 10px',
      borderRadius: 99, border: `1px solid ${c.dot}33`,
      background: c.bg, color: c.text,
      fontSize: size === 'xs' ? 10 : 11, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ ...cardSx, padding: '18px 20px' }}>
      <div style={{ height: 11, width: 80, borderRadius: 6, background: '#f3f4f6', marginBottom: 12, animation: 'dashPulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 26, width: 120, borderRadius: 6, background: '#f3f4f6', marginBottom: 6, animation: 'dashPulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 11, width: 100, borderRadius: 6, background: '#f3f4f6', animation: 'dashPulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

function SkeletonTable() {
  return [1,2,3,4].map(i => (
    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
      {[100, 80, 120, 80, 140].map((w, j) => (
        <td key={j} style={{ padding: '12px 14px' }}>
          <div style={{
            height: 10, width: w, borderRadius: 6,
            background: '#f3f4f6',
            animation: 'dashPulse 1.5s ease-in-out infinite',
          }} />
        </td>
      ))}
    </tr>
  ))
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const NEW_ORDER_POLL_MS = 30000

// ─── New Orders widget ─────────────────────────────────────────────────────────
function NewOrdersWidget({ token }) {
  const [newOrders, setNewOrders] = useState([])
  const [newCount, setNewCount] = useState(0)
  const [pulse, setPulse] = useState(false)
  // Look back 24h on first load so recent orders appear immediately
  const lastCheckedRef = useRef(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const fmtDate = ms =>
    ms ? new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'
  const fmtTime = ms =>
    ms ? new Date(ms).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'
  const fmtPrice = n => `${currency}${Number(n ?? 0).toLocaleString('en-IN')}`

  const getMethodLabel = (order) => {
    if (order.delivery?.method === 'pickup') return '📦 Pickup'
    if (order.payment?.method === 'razorpay') return '💳 Razorpay'
    return '💵 COD'
  }

  const getStatusDot = (status) => {
    const colors = {
      placed: '#3b82f6', confirmed: '#8b5cf6', processing: '#f59e0b',
      shipped: '#a855f7', delivered: '#22c55e', cancelled: '#ef4444', refunded: '#94a3b8',
    }
    return colors[status] || '#94a3b8'
  }

  // ── WebSocket listener for instant new-order events ─────────────────────
  useNewOrderSocket((order) => {
    addNewOrder(order)
  })

  // ── Shared function to prepend a new order to the list ─────────────────
  const addNewOrder = useCallback((order) => {
    setPulse(true)
    setTimeout(() => setPulse(false), 600)

    setNewOrders(prev => {
      // Deduplicate by _id
      if (prev.some(o => o._id === order._id)) return prev
      return [order, ...prev].slice(0, 50) // keep max 50
    })
    setNewCount(c => c + 1)
  }, [])

  const fetchNew = useCallback(async () => {
    try {
      const t = localStorage.getItem('token')
      if (!t) return
      const params = new URLSearchParams({ since: lastCheckedRef.current })
      const { data } = await axios.get(`${backendUrl}/api/order/new-orders?${params}`, {
        headers: { token: t },
      })
      if (data.success) {
        if (data.newOrders > 0 && data.orders) {
          setPulse(true)
          setTimeout(() => setPulse(false), 600)

          setNewCount(data.newOrders)
          setNewOrders(data.orders.slice().reverse())

          const newest = data.orders[0]
          const t = new Date(newest.createdAt).getTime()
          lastCheckedRef.current = new Date(t + 1).toISOString()
        } else {
          lastCheckedRef.current = new Date().toISOString()
        }
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNew()
    const interval = setInterval(fetchNew, NEW_ORDER_POLL_MS)
    return () => clearInterval(interval)
  }, [fetchNew])

  // Show orders from last 24h on initial load via the dashboard stats
  // (we also poll for fresh ones)

  const cardSx = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  }

  return (
    <div style={{ ...cardSx, position: 'relative' }}>
      {/* Pulse glow when new orders arrive */}
      {pulse && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 14,
          boxShadow: '0 0 0 4px rgba(79,70,229,0.25)',
          animation: 'orderPulse 0.6s ease-out',
          pointerEvents: 'none', zIndex: 1,
        }} />
      )}

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🆕</div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                New Orders
              </h2>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>
                Live · WebSocket + polling
              </p>
            </div>
          </div>
          {newCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 99,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              animation: pulse ? 'countPop 0.4s ease' : undefined,
            }}>
              <span>🔔</span>
              {newCount} new
            </span>
          )}
        </div>
      </div>

      <div className="dash-scroll">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {newOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px 20px', textAlign: 'center' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    color: '#9ca3af',
                  }}>
                    <span style={{ fontSize: 28 }}>🔍</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>No new orders yet</span>
                    <span style={{ fontSize: 11 }}>Waiting for customers to place orders…</span>
                  </div>
                </td>
              </tr>
            ) : newOrders.map((o, i) => (
              <tr key={o._id} style={{
                animation: `dashFade 0.3s ease ${i * 0.04}s both`,
                background: i === newOrders.length - 1 && newCount > 0
                  ? 'linear-gradient(90deg, rgba(79,70,229,0.04), transparent)'
                  : undefined,
              }}>
                <td>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                    #{o.orderNumber}
                  </span>
                </td>
                <td>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: 11, whiteSpace: 'nowrap', display: 'block' }}>
                      {fmtDate(o.createdAt)}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: 10, whiteSpace: 'nowrap', display: 'block' }}>
                      {fmtTime(o.createdAt)}
                    </span>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>
                    {o.billing?.firstName || 'Customer'}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: '#111827', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {fmtPrice(o.grandTotal)}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                    background: o.payment?.status === 'paid' ? '#f0fdf4' : '#fffbeb',
                    color: o.payment?.status === 'paid' ? '#16a34a' : '#d97706',
                    border: `1px solid ${o.payment?.status === 'paid' ? '#bbf7d0' : '#fde68a'}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {getMethodLabel(o)}
                  </span>
                </td>
                <td>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: getStatusDot(o.status),
                    flexShrink: 0,
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {newOrders.length > 0 && (
        <div style={{
          padding: '10px 20px', borderTop: '1px solid #f3f4f6', textAlign: 'center',
        }}>
          <a href="/orders"
            style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            View all orders →
          </a>
        </div>
      )}
    </div>
  )
}

const Dashboard = ({ token }) => {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const { data: res } = await axios.get(`${backendUrl}/api/dashboard/stats`, {
          headers: { token },
        })
        if (res.success) setData(res.data)
        else setError(res.message)
      } catch (err) {
        setError(err.response?.data?.message || err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [token])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 1200, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <style>{`@keyframes dashPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } } * { box-sizing: border-box; }`}</style>
        <div style={{ height: 26, width: 180, borderRadius: 6, background: '#f3f4f6', animation: 'dashPulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 16 }}>
          <div style={{ ...cardSx, padding: 24, height: 320 }} />
          <div style={{ ...cardSx, padding: 24, height: 320 }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1200, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <style>{`* { box-sizing: border-box; }`}</style>
        <div style={{
          ...cardSx, padding: '40px', textAlign: 'center',
          borderLeft: '4px solid #dc2626',
        }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#dc2626', margin: '0 0 8px' }}>Failed to load dashboard</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const {
    totalProducts, totalStockCount, inStockCount, outOfStockCount,
    lowStockCount, bestsellerCount, featuredCount, totalViews, avgPrice,
    totalOrders, totalRevenue, paidOrders, codOrders,
    totalCustomers, totalCategories, totalBlogs,
    totalContacts, unreadContacts, totalCoupons, activeCoupons,
    ordersByStatus, monthlyStats,
    recentOrders, lowStockProducts, recentContacts,
  } = data

  // Prepare donut chart data
  const donutData = ordersByStatus
    .filter(s => s.count > 0)
    .map(s => ({ name: STATUS_LABELS[s.status] ?? s.status, value: s.count }))

  // Prepare revenue chart data for recharts
  const revenueData = monthlyStats.map(m => ({
    month: m.label.length > 6 ? m.label.slice(0, 6) : m.label,
    orders: m.orders,
    revenue: Math.round(m.revenue / 100),
  }))

  const totalActiveOrders = ordersByStatus
    .filter(s => ['placed','confirmed','processing','shipped'].includes(s.status))
    .reduce((s, o) => s + o.count, 0)

  return (
    <div style={{ maxWidth: 1200, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes dashPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes dashFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes orderPulse { 0% { box-shadow: 0 0 0 0 rgba(79,70,229,0.4); } 100% { box-shadow: 0 0 0 20px rgba(79,70,229,0); } }
        @keyframes countPop { 0% { transform: scale(1); } 50% { transform: scale(1.12); } 100% { transform: scale(1); } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        .dash-table { width: 100%; border-collapse: collapse; }
        .dash-table th {
          text-align: left; font-size: 10px; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 10px 14px; border-bottom: 1px solid #f3f4f6; white-space: nowrap;
        }
        .dash-table td { padding: 10px 14px; border-bottom: 1px solid #f9fafb; vertical-align: middle; font-size: 12px; }
        .dash-table tr:hover td { background: #fafafa; }
        .dash-table tr:last-child td { border-bottom: none; }
        .dash-scroll { overflow-x: auto; }
        @media (max-width: 768px) { .dash-hide-mobile { display: none !important; } }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            Overview of your store · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#fff', color: '#374151',
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ width: 14, height: 14 }}>
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── KPI Cards Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
        <KPICard icon="📦" label="Total Products" value={totalProducts}
          sub={`${inStockCount} in stock · ${outOfStockCount} out of stock`} accent="#2563eb" />
        <KPICard icon="📋" label="Total Orders" value={totalOrders}
          sub={`${totalActiveOrders} active · ${paidOrders} paid`} accent="#3b82f6" />
        <KPICard icon="💰" label="Total Revenue" value={fmtPrice(totalRevenue)}
          sub={`${codOrders} COD · ${paidOrders} Online paid`} accent="#8b5cf6" />
        <KPICard icon="👥" label="Customers" value={totalCustomers}
          sub={`${totalOrders} orders placed`} accent="#22c55e" />
        <KPICard icon="⭐" label="Bestsellers" value={bestsellerCount}
          sub={`${featuredCount} featured · ${totalViews.toLocaleString()} views`} accent="#f59e0b" />
        <KPICard icon="📦" label="Low Stock Alert" value={lowStockCount}
          sub={lowStockCount === 0 ? 'All well stocked ✓' : `${lowStockCount} products need attention`}
          accent={lowStockCount > 0 ? '#ef4444' : '#22c55e'} />
      </div>

      {/* ── New Orders Widget ── */}
      <NewOrdersWidget token={token} />

      {/* ── Secondary KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
        <div style={{ ...cardSx, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏷️</div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Categories</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '2px 0 0' }}>{totalCategories}</p>
          </div>
        </div>
        <div style={{ ...cardSx, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📝</div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Blog Posts</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '2px 0 0' }}>{totalBlogs}</p>
          </div>
        </div>
        <div style={{ ...cardSx, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📧</div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Contacts</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '2px 0 0' }}>{totalContacts}
              {unreadContacts > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, marginLeft: 8,
                  background: '#fff5f5', color: '#dc2626',
                  padding: '1px 7px', borderRadius: 99, border: '1px solid #fecaca',
                }}>{unreadContacts} new</span>
              )}
            </p>
          </div>
        </div>
        <div style={{ ...cardSx, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎫</div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Coupons</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '2px 0 0' }}>{totalCoupons}
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginLeft: 8 }}>{activeCoupons} active</span>
            </p>
          </div>
        </div>
        <div style={{ ...cardSx, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Avg Price</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '2px 0 0' }}>{fmtPrice(avgPrice)}</p>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(400px,1fr))', gap: 16 }}>

        {/* Order Status Donut Chart */}
        <div style={{ ...cardSx, padding: 20 }}>
          <SectionHeader title="Order Status" sub="Distribution across all statuses" />
          {donutData.length === 0 ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              No orders yet
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width="60%" height={260}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={entry.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#fff', border: '1px solid #e5e7eb',
                      borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value, name) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {donutData.map((entry, i) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: 3,
                      background: DONUT_COLORS[i % DONUT_COLORS.length],
                      flexShrink: 0,
                    }} />
                    <span style={{ color: '#374151', flex: 1 }}>{entry.name}</span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Revenue Trend */}
        <div style={{ ...cardSx, padding: 20 }}>
          <SectionHeader title="Monthly Revenue Trend" sub="Last 12 months (in hundreds ₹)" />
          {revenueData.every(m => m.orders === 0) ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? fmtPrice(value * 100) : value,
                    name === 'revenue' ? 'Revenue' : 'Orders',
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => value === 'revenue' ? 'Revenue' : 'Orders'}
                />
                <Line
                  type="monotone" dataKey="revenue"
                  stroke="#8b5cf6" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                />
                <Line
                  type="monotone" dataKey="orders"
                  stroke="#3b82f6" strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div style={{ ...cardSx, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0' }}>
          <SectionHeader
            title="Recent Orders"
            sub={`${data.totalOrders} total orders · latest ${recentOrders.length} shown`}
          />
        </div>
        <div className="dash-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="dash-hide-mobile">Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    No orders yet
                  </td>
                </tr>
              ) : recentOrders.map((o, i) => (
                <tr key={o._id} style={{ animation: `dashFade 0.2s ease ${i * 0.03}s both` }}>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                      #{o.orderNumber}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {fmtDate(o.date)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{o.customerName}</span>
                  </td>
                  <td className="dash-hide-mobile">
                    <span style={{ color: '#6b7280' }}>{o.itemCount} item{o.itemCount !== 1 ? 's' : ''}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>{fmtPrice(o.grandTotal)}</span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: o.paymentStatus === 'paid' ? '#f0fdf4' : '#fffbeb',
                      color: o.paymentStatus === 'paid' ? '#16a34a' : '#d97706',
                      border: `1px solid ${o.paymentStatus === 'paid' ? '#bbf7d0' : '#fde68a'}`,
                      whiteSpace: 'nowrap',
                    }}>
                      {o.paymentStatus === 'paid' ? '✓ Paid' : o.paymentMethod === 'cod' ? '🛵 COD' : '⏳ Pending'}
                    </span>
                  </td>
                  <td><StatusBadge status={o.status} size="xs" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recentOrders.length > 0 && (
          <div style={{
            padding: '10px 20px', borderTop: '1px solid #f3f4f6', textAlign: 'center',
          }}>
            <a href="/orders"
              style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
              View all orders →
            </a>
          </div>
        )}
      </div>

      {/* ── Low Stock + Recent Contacts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 16 }}>

        {/* Low Stock Alerts */}
        <div style={{ ...cardSx, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 0' }}>
            <SectionHeader
              title="⚠️ Low Stock Alerts"
              sub={`${lowStockProducts.length} products with ≤5 units remaining`}
            />
          </div>
          <div className="dash-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '30px 20px', textAlign: 'center', color: '#16a34a', fontWeight: 600, fontSize: 13 }}>
                      ✓ All products are well stocked
                    </td>
                  </tr>
                ) : lowStockProducts.map((p, i) => (
                  <tr key={p._id} style={{ animation: `dashFade 0.2s ease ${i * 0.03}s both` }}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>{p.name}</span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontWeight: 700, fontSize: 12,
                        color: p.stockCount <= 2 ? '#dc2626' : '#d97706',
                      }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: p.stockCount <= 2 ? '#ef4444' : '#f59e0b',
                        }} />
                        {p.stockCount}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>{fmtPrice(p.price)}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{p.category}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Contacts */}
        <div style={{ ...cardSx, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 0' }}>
            <SectionHeader
              title="📬 Recent Contacts"
              sub={`${unreadContacts} unread · ${totalContacts} total`}
            />
          </div>
          <div className="dash-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentContacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '30px 20px', textAlign: 'center', color: '#9ca3af' }}>
                      No contacts yet
                    </td>
                  </tr>
                ) : recentContacts.map((c, i) => (
                  <tr key={c._id} style={{ animation: `dashFade 0.2s ease ${i * 0.03}s both` }}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>{c.name}</span>
                    </td>
                    <td>
                      <span style={{ color: '#6b7280', fontSize: 12, maxWidth: 120, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.subject}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: c.status === 'new' ? '#fff5f5' : c.status === 'read' ? '#eff6ff' : '#f0fdf4',
                        color: c.status === 'new' ? '#dc2626' : c.status === 'read' ? '#2563eb' : '#16a34a',
                        border: `1px solid ${
                          c.status === 'new' ? '#fecaca' : c.status === 'read' ? '#bfdbfe' : '#bbf7d0'
                        }`,
                      }}>
                        {c.status === 'new' ? 'New' : c.status === 'read' ? 'Read' : 'Replied'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#9ca3af', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {fmtDate(c.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentContacts.length > 0 && (
            <div style={{
              padding: '10px 20px', borderTop: '1px solid #f3f4f6', textAlign: 'center',
            }}>
              <a href="/contacts"
                style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                View all contacts →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer meta ── */}
      <div style={{ fontSize: 11, color: '#d1d5db', fontFamily: 'monospace', textAlign: 'center', padding: '8px 0 16px' }}>
        Dashboard auto-refreshes on page load · Data is real-time
      </div>
    </div>
  )
}

export default Dashboard
