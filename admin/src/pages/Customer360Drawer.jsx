// pages/Customer360Drawer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Customer 360° Drawer — enriched customer view with LTV chart, purchase
// frequency, wishlist cross-reference, and communication history.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'
const currency = '\u20b9'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '\u2014'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
const fmtDateTime = (iso) => {
  if (!iso) return '\u2014'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' \u00b7 ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
const fmtPrice = (n = 0) => currency + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

// ─── Stats card style ─────────────────────────────────────────────────────────
const statCardSx = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  padding: '12px 14px',
  borderLeft: '3px solid #2563eb',
}
const cardSx = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  overflow: 'hidden',
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconX     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M18 6L6 18M6 6l12 12"/></svg>
const IconMail  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
const IconPhone = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
const IconHeart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><path d="M20 6L9 17l-5-5"/></svg>
const IconHistory = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const IconSend = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>

// ─── Section Head ─────────────────────────────────────────────────────────────
const SectionHead = ({ children, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
    <span style={{ color: '#2563eb', display: 'flex' }}>{icon}</span>
    <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
      {children}
    </p>
  </div>
)

// ─── Stat Badge ───────────────────────────────────────────────────────────────
const StatBadge = ({ label, value, accent = '#2563eb' }) => (
  <div style={{ ...statCardSx, borderLeftColor: accent }}>
    <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{label}</p>
    <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1 }}>{value}</p>
  </div>
)

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spin = ({ size = 22 }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    border: '3px solid #e5e7eb', borderTopColor: '#2563eb',
    display: 'inline-block', animation: 'c360Spin 0.7s linear infinite',
  }} />
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DRAWER
// ═══════════════════════════════════════════════════════════════════════════════

const Customer360Drawer = ({ customer, onClose }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commsForm, setCommsForm] = useState({ type: 'email', subject: '', body: '', recipient: '' })
  const [commsSending, setCommsSending] = useState(false)
  const [commsMsg, setCommsMsg] = useState('')

  useEffect(() => {
    const fetch360 = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const { data: res } = await axios.get(`${API_BASE}/api/user/customer-360/${customer._id}`, {
          headers: { Authorization: 'Bearer ' + token },
        })
        if (res.success) setData(res.data)
        else setError(res.message || 'Failed to load 360 view')
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Network error')
      } finally {
        setLoading(false)
      }
    }
    fetch360()
  }, [customer._id])

  const handleAddComms = async () => {
    if (!commsForm.subject && !commsForm.body) return
    setCommsSending(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_BASE}/api/user/customer-comms`, {
        userId: customer._id,
        type: commsForm.type,
        subject: commsForm.subject,
        body: commsForm.body,
        recipient: commsForm.recipient || customer.email,
      }, { headers: { Authorization: 'Bearer ' + token } })
      setCommsForm({ type: 'email', subject: '', body: '', recipient: '' })
      setCommsMsg('Communication logged!')
      setTimeout(() => setCommsMsg(''), 3000)
      // Refresh data
      const { data: res } = await axios.get(`${API_BASE}/api/user/customer-360/${customer._id}`, {
        headers: { Authorization: 'Bearer ' + token },
      })
      if (res.success) setData(res.data)
    } catch (err) {
      setCommsMsg('Failed to log communication')
      setTimeout(() => setCommsMsg(''), 3000)
    } finally {
      setCommsSending(false)
    }
  }

  // ─── LTV chart colors ───────────────────────────────────────────────────────
  const barColor = (entry) => {
    if (entry.revenue === 0) return '#e5e7eb'
    if (entry.revenue > 50000) return '#1d4ed8'
    if (entry.revenue > 10000) return '#2563eb'
    return '#818cf8'
  }

  return (
    <>
      <style>{`
        @keyframes c360Spin { to { transform: rotate(360deg); } }
        @keyframes c360Fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes c360SlideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #9ca3af; font-size: 12px; }
      `}</style>

      {/* Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)',
        display: 'flex', justifyContent: 'flex-end',
        animation: 'c360Fade 0.15s ease',
      }} onClick={onClose}>
        <div style={{
          width: '100%', maxWidth: 540, height: '100%',
          background: '#f8fafc', borderLeft: '1px solid #e5e7eb',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          animation: 'c360SlideIn 0.2s ease',
        }} onClick={e => e.stopPropagation()}>

          {/* ── Sticky header ── */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: '#fff', borderBottom: '1px solid #f3f4f6', flexShrink: 0,
          }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg,#2563eb,#1d4ed8)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                  \ud83d\udd0d {customer.name}
                </p>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{customer.email}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                  background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  color: '#fff', letterSpacing: '0.05em',
                }}>360\u00b0</span>
                <button onClick={onClose} style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid #e5e7eb', background: '#fff',
                  color: '#6b7280', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, transition: 'all 0.12s',
                }} onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6' }}
                   onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}>
                  <IconX />
                </button>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 14 }}>
                <Spin size={32} />
                <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>Loading 360\u00b0 view...</p>
              </div>
            )}

            {error && (
              <div style={{
                padding: '14px 16px', borderRadius: 10,
                background: '#fff5f5', border: '1px solid #fecaca',
                color: '#dc2626', fontSize: 13,
              }}>{error}</div>
            )}

            {data && !loading && (
              <>

                {/* ── Stats Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
                  <StatBadge label="Total Orders"    value={data.stats.totalOrders}    accent="#2563eb" />
                  <StatBadge label="Lifetime Value"  value={fmtPrice(data.stats.lifetimeValue)} accent="#1d4ed8" />
                  <StatBadge label="Avg Order Value" value={fmtPrice(data.stats.avgOrderValue)} accent="#059669" />
                  <StatBadge label="Items Bought"    value={data.stats.itemsPurchased}  accent="#d97706" />
                </div>

                {/* ── Secondary stat row ── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px' }}>
                  <span>Joined: <strong>{fmtDate(data.profile.createdAt)}</strong></span>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <span>COD: <strong>{data.stats.codOrders}</strong></span>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <span>Online: <strong>{data.stats.rzpOrders}</strong></span>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <span>Cancelled: <strong style={{ color: '#dc2626' }}>{data.stats.cancelledOrders}</strong></span>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <span>Active months: <strong>{data.stats.monthsActive}</strong></span>
                  {data.profile.phone && <>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <span>{data.profile.phone}</span>
                  </>}
                </div>

                {/* ── LTV: Monthly Spending Bar Chart ── */}
                <div style={cardSx}>
                  <div style={{ padding: '14px 16px' }}>
                    <SectionHead icon={<IconHistory />}>Lifetime Value \u2014 Monthly Spending</SectionHead>
                    {data.monthlySpending.every(m => m.revenue === 0) ? (
                      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
                        No spending data yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.monthlySpending} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                            tickFormatter={v => Math.round(v/1000) + 'k'} />
                          <Tooltip
                            contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value, name) => [fmtPrice(value), name === 'revenue' ? 'Spent' : name]}
                          />
                          <Bar dataKey="revenue" radius={[4,4,0,0]} maxBarSize={28}
                            fill="#2563eb"
                          >
                            {data.monthlySpending.map((entry, i) => (
                              <Cell key={i} fill={barColor(entry)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>\ud83d\udcb0 {fmtPrice(data.stats.totalSpent)} total</span>
                      {data.stats.firstOrderDate && (
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>
                          \ud83d\udcc5 Since {fmtDate(data.stats.firstOrderDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Purchase Frequency Line ── */}
                <div style={cardSx}>
                  <div style={{ padding: '14px 16px' }}>
                    <SectionHead icon={<IconHistory />}>Purchase Frequency</SectionHead>
                    {data.monthlySpending.every(m => m.orders === 0) ? (
                      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
                        No orders yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={data.monthlySpending} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                            allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value, name) => [value, name === 'orders' ? 'Orders' : name === 'items' ? 'Items' : name]}
                          />
                          <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2.5}
                            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                          <Line type="monotone" dataKey="items" stroke="#8b5cf6" strokeWidth={2}
                            dot={{ r: 2, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* ── Wishlist Cross-Reference ── */}
                <div style={cardSx}>
                  <div style={{ padding: '14px 16px' }}>
                    <SectionHead icon={<IconHeart />}>
                      Wishlist {data.wishlist.length > 0 && `\u2014 ${data.wishlist.filter(w => !w.alreadyBought).length} not yet bought`}
                    </SectionHead>
                    {data.wishlist.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                        No wishlist items for this customer
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {data.wishlist.map(item => (
                          <div key={item._id} style={{
                            display: 'flex', gap: 10, alignItems: 'center',
                            padding: '8px 10px', borderRadius: 8,
                            background: item.alreadyBought ? '#f0fdf4' : '#fffbeb',
                            border: '1px solid ' + (item.alreadyBought ? '#bbf7d0' : '#fde68a'),
                          }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 6, overflow: 'hidden',
                              background: '#f3f4f6', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {item.image
                                ? <img src={item.image} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    onError={e => { e.target.src = 'https://placehold.co/36x36?text=\ud83d\udce6' }} />
                                : <span style={{ fontSize: 16 }}>\ud83d\udce6</span>
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.name}
                              </p>
                              <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>
                                {fmtPrice(item.price)}
                                {item.mrp > item.price && (
                                  <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginLeft: 4 }}>
                                    {fmtPrice(item.mrp)}
                                  </span>
                                )}
                                <span style={{ marginLeft: 6 }}>\u00b7</span>
                                {item.inStock
                                  ? <span style={{ color: '#16a34a', marginLeft: 6 }}>{item.stockCount} in stock</span>
                                  : <span style={{ color: '#dc2626', marginLeft: 6 }}>Out of stock</span>
                                }
                              </p>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                              background: item.alreadyBought ? '#bbf7d0' : '#fef3c7',
                              color: item.alreadyBought ? '#166534' : '#92400e',
                            }}>
                              {item.alreadyBought ? '\u2705 Bought' : '\u23f3 Not yet'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Communication History ── */}
                <div style={cardSx}>
                  <div style={{ padding: '14px 16px' }}>
                    <SectionHead icon={<IconMail />}>
                      Communication History {data.communications.length > 0 && `\u2014 ${data.communications.length} entries`}
                    </SectionHead>

                    {/* New communication form */}
                    <div style={{
                      background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
                      padding: '12px 14px', marginBottom: 14,
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>
                        Log Communication
                      </p>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        {['email', 'sms', 'note'].map(t => (
                          <button key={t} onClick={() => setCommsForm(f => ({ ...f, type: t }))}
                            style={{
                              padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                              fontSize: 11, fontWeight: 700,
                              background: commsForm.type === t ? '#2563eb' : '#f3f4f6',
                              color: commsForm.type === t ? '#fff' : '#374151',
                              border: commsForm.type === t ? 'none' : '1px solid #e5e7eb',
                              transition: 'all 0.12s',
                            }}>
                            {t === 'email' ? '\u2709 Email' : t === 'sms' ? '\ud83d\udcf1 SMS' : '\ud83d\udcdd Note'}
                          </button>
                        ))}
                      </div>
                      {commsForm.type !== 'note' && (
                        <input type="text" placeholder="Recipient email / phone"
                          value={commsForm.recipient}
                          onChange={e => setCommsForm(f => ({ ...f, recipient: e.target.value }))}
                          style={{
                            width: '100%', padding: '7px 10px', fontSize: 12,
                            border: '1px solid #e5e7eb', borderRadius: 6,
                            outline: 'none', marginBottom: 8,
                          }} />
                      )}
                      <input type="text" placeholder="Subject"
                        value={commsForm.subject}
                        onChange={e => setCommsForm(f => ({ ...f, subject: e.target.value }))}
                        style={{
                          width: '100%', padding: '7px 10px', fontSize: 12,
                          border: '1px solid #e5e7eb', borderRadius: 6,
                          outline: 'none', marginBottom: 8,
                        }} />
                      <textarea rows={2} placeholder="Body / Notes"
                        value={commsForm.body}
                        onChange={e => setCommsForm(f => ({ ...f, body: e.target.value }))}
                        style={{
                          width: '100%', padding: '7px 10px', fontSize: 12,
                          border: '1px solid #e5e7eb', borderRadius: 6,
                          outline: 'none', resize: 'vertical', minHeight: 48, marginBottom: 10,
                        }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={handleAddComms} disabled={commsSending || (!commsForm.subject && !commsForm.body)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 6, border: 'none',
                            background: commsSending || (!commsForm.subject && !commsForm.body) ? '#93c5fd' : '#2563eb',
                            color: '#fff', fontSize: 12, fontWeight: 700, cursor: commsSending || (!commsForm.subject && !commsForm.body) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.12s',
                          }}>
                          {commsSending ? <Spin size={13} /> : <IconSend />}
                          {commsSending ? 'Saving...' : 'Log Entry'}
                        </button>
                        {commsMsg && (
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: commsMsg.includes('Failed') ? '#dc2626' : '#16a34a',
                            animation: 'c360Fade 0.2s ease',
                          }}>{commsMsg}</span>
                        )}
                      </div>
                    </div>

                    {/* History list */}
                    {data.communications.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                        No communications logged yet
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                        {data.communications.map((comm, i) => {
                          const typeConfig = {
                            email: { icon: '\u2709\ufe0f', bg: '#eff6ff', color: '#2563eb' },
                            sms:   { icon: '\ud83d\udcf1', bg: '#eff6ff', color: '#1d4ed8' },
                            note:  { icon: '\ud83d\udcdd', bg: '#f0fdf4', color: '#16a34a' },
                          }
                          const tc = typeConfig[comm.type] || typeConfig.note
                          return (
                            <div key={comm._id || i} style={{
                              padding: '10px 12px', borderRadius: 8,
                              background: tc.bg, border: '1px solid ' + tc.bg,
                              animation: 'c360Fade 0.2s ease',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 12 }}>{tc.icon}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: tc.color, textTransform: 'uppercase' }}>
                                  {comm.type}
                                </span>
                                {comm.subject && (
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', flex: 1 }}>
                                    {comm.subject}
                                  </span>
                                )}
                                <span style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                  {fmtDateTime(comm.createdAt)}
                                </span>
                              </div>
                              {comm.body && (
                                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0', lineHeight: 1.5 }}>
                                  {comm.body}
                                </p>
                              )}
                              {comm.recipient && comm.type !== 'note' && (
                                <p style={{ fontSize: 10, color: '#9ca3af', margin: '4px 0 0' }}>
                                  To: {comm.recipient}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Customer360Drawer
