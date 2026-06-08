// pages/SalesAnalytics.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Detailed Sales Analytics page
// ✅ Top 10 selling products (by quantity)
// ✅ Category-wise sales breakdown
// ✅ Hourly order trends chart
// ✅ Daily revenue chart (last 30 days)
// ✅ Payment method split (pie chart)
// ✅ Summary KPIs
// ✅ Date range picker
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = n => `${currency}${Number(n ?? 0).toLocaleString('en-IN')}`
const fmtCompact = n => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000)     return `${(n / 1000).toFixed(1)}K`
  return n?.toLocaleString('en-IN') ?? 0
}

const PIE_COLORS = ['#2563eb','#8b5cf6','#f59e0b','#22c55e','#ef4444','#06b6d4','#ec4899','#6366f1']
const TREND_COLORS = ['#2563eb','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4']

// ─── Styles ───────────────────────────────────────────────────────────────────
const cardSx = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}
const inpSx = {
  padding: '7px 10px', fontSize: 12, color: '#111827', background: '#fff',
  border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none',
  fontFamily: 'inherit',
}
const fi = e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }
const bi = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, accent }) {
  return (
    <div style={{ ...cardSx, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: accent }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>
            {label}
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1, margin: 0 }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{sub}</p>}
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${accent}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18,
        }}>{icon}</div>
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ ...cardSx, padding: '16px 18px' }}>
            <div style={{ height: 10, width: '60%', borderRadius: 5, background: '#f3f4f6', marginBottom: 10 }} />
            <div style={{ height: 22, width: '40%', borderRadius: 5, background: '#f3f4f6', marginBottom: 6 }} />
            <div style={{ height: 10, width: '80%', borderRadius: 5, background: '#f3f4f6' }} />
          </div>
        ))}
      </div>
      <div style={{ ...cardSx, height: 300, padding: 24 }}>
        <div style={{ height: 14, width: 200, borderRadius: 5, background: '#f3f4f6', marginBottom: 20 }} />
        <div style={{ height: 240, borderRadius: 5, background: '#f3f4f6' }} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const SalesAnalytics = ({ token }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchData = async (from, to) => {
    setLoading(true); setError('')
    try {
      const params = {}
      if (from) params.startDate = from
      if (to) params.endDate = to
      const { data: res } = await axios.get(`${backendUrl}/api/dashboard/sales-analytics`, {
        headers: { token }, params,
      })
      if (res.success) setData(res.data)
      else setError(res.message || 'Failed to load analytics')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [token])

  const applyFilter = () => {
    fetchData(dateFrom, dateTo)
  }

  const clearFilter = () => {
    setDateFrom('')
    setDateTo('')
    fetchData()
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, width: '100%' }}>
        <style>{`@keyframes saPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } } * { box-sizing: border-box; }`}</style>
        <Skeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1100, width: '100%' }}>
        <style>{`* { box-sizing: border-box; }`}</style>
        <div style={{ ...cardSx, padding: '40px', textAlign: 'center', borderLeft: '4px solid #dc2626' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#dc2626', margin: '0 0 8px' }}>Failed to load analytics</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, topProducts, categorySales, hourlyTrends, dailyRevenue, paymentMethodSplit } = data

  return (
    <div style={{ maxWidth: 1100, width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <style>{`
        @keyframes saPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes saFade  { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        .sa-table { width: 100%; border-collapse: collapse; }
        .sa-table th { text-align: left; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; padding: 10px 14px; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }
        .sa-table td { padding: 10px 14px; border-bottom: 1px solid #f9fafb; font-size: 12px; }
        .sa-table tr:hover td { background: #fafafa; }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
            Sales Analytics
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            Detailed breakdown of your sales data
          </p>
        </div>

        {/* Date filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={inpSx} onFocus={fi} onBlur={bi} title="From date" />
          <span style={{ color: '#9ca3af', fontSize: 12 }}>→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={inpSx} onFocus={fi} onBlur={bi} title="To date" />
          <button onClick={applyFilter}
            style={{
              padding: '7px 14px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
            Apply
          </button>
          {(dateFrom || dateTo) && (
            <button onClick={clearFilter}
              style={{
                padding: '7px 12px', borderRadius: 8, border: '1px solid #e5e7eb',
                background: '#fff', color: '#6b7280', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Clear</button>
          )}
        </div>
      </div>

      {/* ── Summary KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
        <KPICard icon="📋" label="Total Orders" value={summary.totalOrders}
          sub="In selected period" accent="#2563eb" />
        <KPICard icon="💰" label="Total Revenue" value={fmtPrice(summary.totalRevenue)}
          sub={`${summary.codOrders} COD · ${summary.razorpayOrders} Online`} accent="#22c55e" />
        <KPICard icon="📦" label="Items Sold" value={summary.totalItemsSold}
          sub="Total quantity across all orders" accent="#f59e0b" />
        <KPICard icon="📊" label="Avg Order Value" value={fmtPrice(Math.round(summary.avgOrderValue))}
          sub="Per order average" accent="#8b5cf6" />
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(400px,1fr))', gap: 16 }}>

        {/* Hourly Trends */}
        <div style={{ ...cardSx, padding: 20 }}>
          <SectionHeader title="📈 Hourly Order Trends" sub="Which hours are busiest?" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{
                background: '#fff', border: '1px solid #e5e7eb',
                borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }} />
              <Bar dataKey="orders" fill="#2563eb" radius={[4, 4, 0, 0]}
                name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method Split */}
        <div style={{ ...cardSx, padding: 20 }}>
          <SectionHeader title="💳 Payment Method Split" sub="COD vs Online" />
          {paymentMethodSplit.length === 0 ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              No data
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width="55%" height={260}>
                <PieChart>
                  <Pie
                    data={paymentMethodSplit.map(d => ({
                      name: d.method === 'cod' ? 'COD' : d.method === 'razorpay' ? 'Razorpay' : d.method,
                      value: d.orders,
                    }))}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={4} dataKey="value"
                  >
                    {paymentMethodSplit.map((entry, i) => (
                      <Cell key={entry.method} fill={i === 0 ? '#f59e0b' : '#2563eb'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{
                    background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: 8, fontSize: 12,
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {paymentMethodSplit.map((d, i) => (
                  <div key={d.method} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: 3,
                      background: i === 0 ? '#f59e0b' : '#2563eb', flexShrink: 0,
                    }} />
                    <span style={{ color: '#374151', fontWeight: 600, textTransform: 'capitalize', flex: 1 }}>
                      {d.method === 'cod' ? 'COD' : d.method === 'razorpay' ? 'Razorpay' : d.method}
                    </span>
                    <span style={{ color: '#111827', fontWeight: 700 }}>{d.orders} orders</span>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{fmtPrice(d.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Daily Revenue Chart ── */}
      <div style={{ ...cardSx, padding: 20 }}>
        <SectionHeader title="📉 Daily Revenue (Last 30 Days)" sub="Order count & revenue per day" />
        {dailyRevenue.length === 0 ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
            No revenue data for last 30 days
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => v?.slice(5) || v} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{
                background: '#fff', border: '1px solid #e5e7eb',
                borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5}
                dot={{ r: 3, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                name="Revenue (₹)" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2}
                dot={{ r: 2, fill: '#2563eb' }}
                name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Bottom Row: Top Products + Category Breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(420px,1fr))', gap: 16 }}>

        {/* Top 10 Products */}
        <div style={{ ...cardSx, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 0' }}>
            <SectionHeader title="🏆 Top 10 Products" sub="By quantity sold" />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No products sold yet</td></tr>
                ) : topProducts.map((p, i) => (
                  <tr key={p.name}>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 22, height: 22, borderRadius: 6,
                        background: i < 3 ? '#2563eb' : '#f3f4f6',
                        color: i < 3 ? '#fff' : '#6b7280',
                        fontSize: 10, fontWeight: 700,
                      }}>{i + 1}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>{p.name}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 12 }}>{p.quantitySold}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#22c55e', fontSize: 12 }}>{fmtPrice(p.revenue)}</span>
                    </td>
                    <td>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>{p.orderCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={{ ...cardSx, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 0' }}>
            <SectionHeader title="📂 Category Sales" sub="Revenue & orders by category" />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {categorySales.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No category data yet</td></tr>
                ) : categorySales.map((c, i) => (
                  <tr key={c.category}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: 3,
                          background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0,
                        }} />
                        <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>
                          {c.category || 'Uncategorized'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>{c.productCount}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 12 }}>{c.quantitySold}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#22c55e', fontSize: 12 }}>{fmtPrice(c.revenue)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ fontSize: 11, color: '#d1d5db', fontFamily: 'monospace', textAlign: 'center', padding: '8px 0 16px' }}>
        {dateFrom || dateTo ? `Filtered: ${dateFrom || '…'} → ${dateTo || '…'}` : 'Showing all-time data'}
      </div>
    </div>
  )
}

export default SalesAnalytics
