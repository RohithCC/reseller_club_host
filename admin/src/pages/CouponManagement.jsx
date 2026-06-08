// pages/CouponManagement.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full Coupon Management:
//   ✅ List all coupons with usage stats, expiry alerts
//   ✅ Create / Edit coupon form
//   ✅ Bulk generation modal
//   ✅ Per-customer usage tracking
//   ✅ Expiry notifications (dashboard-style)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import ToggleSwitch from '../components/ToggleSwitch'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const fmtDateTime = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const fmtPrice = n => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

const cardSx = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}

const EMPTY_FORM = {
  code: '', label: '', description: '', type: 'percent',
  value: '', minOrderValue: 0, maxDiscount: '',
  usageLimit: '', perUserLimit: 1,
  eligibility: 'all', validFrom: '', validTill: '',
  isActive: true,
}

// ─── Coupon Management Page ──────────────────────────────────────────────────
const CouponManagement = ({ token }) => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [bulkCount, setBulkCount] = useState(10)
  const [bulkPrefix, setBulkPrefix] = useState('CAMPAIGN')
  const [bulkTpl, setBulkTpl] = useState({ type: 'percent', value: 10, minOrderValue: 0, validTill: '', label: '' })
  const [usageModal, setUsageModal] = useState(null) // coupon data with usage
  const [usageLoading, setUsageLoading] = useState(false)
  const [expiringCoupons, setExpiringCoupons] = useState([])

  // ── Fetch coupons ─────────────────────────────────────────────────────────
  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/coupons/admin`, {
        headers: { token },
      })
      if (data.success) setCoupons(data.coupons)
      else setError(data.message)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch expiring coupons ────────────────────────────────────────────────
  const fetchExpiring = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/coupons/expiring-soon`, {
        headers: { token },
      })
      if (data.success) setExpiringCoupons(data.coupons)
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchCoupons()
    fetchExpiring()
  }, [token])

  // ── Open form for create/edit ─────────────────────────────────────────────
  const openCreate = () => {
    setForm({ ...EMPTY_FORM, validFrom: new Date().toISOString().slice(0, 16) })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (coupon) => {
    setForm({
      code: coupon.code,
      label: coupon.label || '',
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || '',
      usageLimit: coupon.usageLimit || '',
      perUserLimit: coupon.perUserLimit || 1,
      eligibility: coupon.eligibility || 'all',
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
      validTill: coupon.validTill ? new Date(coupon.validTill).toISOString().slice(0, 16) : '',
      isActive: coupon.isActive,
    })
    setEditingId(coupon._id)
    setShowForm(true)
  }

  // ── Save coupon ───────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        minOrderValue: Number(form.minOrderValue) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: Number(form.perUserLimit) || 1,
        validFrom: form.validFrom ? new Date(form.validFrom) : undefined,
        validTill: form.validTill ? new Date(form.validTill) : undefined,
      }
      if (!payload.validTill) { toast.error('Expiry date is required'); return }

      let res
      if (editingId) {
        res = await axios.put(`${backendUrl}/api/coupons/${editingId}`, payload, { headers: { token } })
      } else {
        res = await axios.post(`${backendUrl}/api/coupons`, payload, { headers: { token } })
      }

      if (res.data.success) {
        toast.success(editingId ? 'Coupon updated!' : 'Coupon created!')
        setShowForm(false)
        fetchCoupons()
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete coupon ─────────────────────────────────────────────────────────
  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"? This cannot be undone.`)) return
    try {
      const { data } = await axios.delete(`${backendUrl}/api/coupons/${id}`, { headers: { token } })
      if (data.success) {
        toast.success(`Coupon "${code}" deleted`)
        fetchCoupons()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────
  const toggleActive = async (coupon) => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/coupons/${coupon._id}`,
        { isActive: !coupon.isActive }, { headers: { token } })
      if (data.success) {
        toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`)
        fetchCoupons()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  // ── Bulk generate ─────────────────────────────────────────────────────────
  const handleBulkGenerate = async (e) => {
    e.preventDefault()
    if (!bulkTpl.validTill) { toast.error('Expiry date required'); return }
    setSaving(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/coupons/bulk-generate`, {
        count: bulkCount,
        prefix: bulkPrefix,
        template: {
          type: bulkTpl.type,
          value: Number(bulkTpl.value),
          minOrderValue: Number(bulkTpl.minOrderValue) || 0,
          validTill: new Date(bulkTpl.validTill),
          label: bulkTpl.label || `${bulkPrefix} Campaign`,
          description: `Bulk generated - ${bulkPrefix} campaign`,
          perUserLimit: 1,
          isActive: true,
        },
      }, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        setShowBulk(false)
        fetchCoupons()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── View usage details ────────────────────────────────────────────────────
  const openUsage = async (coupon) => {
    setUsageLoading(true)
    setUsageModal({ code: coupon.code, _id: coupon._id, usedBy: [], usedCount: coupon.usedCount })
    try {
      const { data } = await axios.get(`${backendUrl}/api/coupons/${coupon._id}/usage`, {
        headers: { token },
      })
      if (data.success) {
        setUsageModal({
          couponCode: coupon.code,
          usedCount: data.usedCount ?? coupon.usedCount ?? 0,
          usageLimit: data.usageLimit ?? coupon.usageLimit ?? null,
          usedBy: data.usedBy ?? [],
        })
      }
    } catch (err) {
      toast.error('Failed to load usage details')
    } finally {
      setUsageLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1200, width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <style>{`
        @keyframes cpFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        .cp-scroll { overflow-x: auto; }
        .cp-table { width: 100%; border-collapse: collapse; min-width: 700px; }
        .cp-table th { text-align: left; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; padding: 10px 14px; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }
        .cp-table td { padding: 10px 14px; border-bottom: 1px solid #f9fafb; vertical-align: middle; font-size: 12px; }
        .cp-table tr:hover td { background: #fafafa; }
        .cp-table tr:last-child td { border-bottom: none; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(3px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; animation: cpFade 0.15s ease; }
        .modal-box { background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-width: 600px; width: 100%; max-height: 85vh; overflow-y: auto; }
        @media (max-width: 640px) { .modal-box { max-width: 100%; margin: 0 10px; } }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
            Coupon Management
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            {coupons.length} coupons · {coupons.filter(c => c.isActive && !c.isExpired).length} active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowBulk(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
              background: '#fff', color: '#374151', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            Bulk Generate
          </button>
          <button onClick={openCreate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: '#2563eb', color: '#fff', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            }}>
            + New Coupon
          </button>
        </div>
      </div>

      {/* ── Expiring Soon Alert ── */}
      {expiringCoupons.length > 0 && (
        <div style={{
          ...cardSx, padding: '14px 18px', borderLeft: '4px solid #f59e0b',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 20 }}>⏰</span>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 13, color: '#92400e' }}>
              {expiringCoupons.length} coupon{expiringCoupons.length > 1 ? 's' : ''} expiring soon
            </strong>
            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
              {expiringCoupons.map(c => `${c.code} (${fmtDate(c.validTill)})`).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* ── Coupon Table ── */}
      {loading ? (
        <div style={{ ...cardSx, padding: 40, textAlign: 'center', color: '#9ca3af' }}>
          Loading coupons...
        </div>
      ) : error ? (
        <div style={{ ...cardSx, padding: 40, textAlign: 'center', borderLeft: '4px solid #dc2626' }}>
          <p style={{ color: '#dc2626', fontWeight: 600, fontSize: 13 }}>⚠️ {error}</p>
        </div>
      ) : coupons.length === 0 ? (
        <div style={{ ...cardSx, padding: 60, textAlign: 'center' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏷️</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No coupons yet</p>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Create your first coupon to start offering discounts.</p>
        </div>
      ) : (
        <div style={{ ...cardSx, overflow: 'hidden' }}>
          <div className="cp-scroll">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Used / Limit</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => (
                  <tr key={c._id} style={{ animation: `cpFade 0.2s ease ${i * 0.02}s both`, opacity: c.isExpired ? 0.6 : 1 }}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 13, fontFamily: 'monospace' }}>{c.code}</span>
                      {c.label && <span style={{ display: 'block', fontSize: 10, color: '#9ca3af' }}>{c.label}</span>}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: 12 }}>
                        {c.type === 'percent' ? `${c.value}%` : fmtPrice(c.value)}
                      </span>
                      {c.maxDiscount && c.type === 'percent' && (
                        <span style={{ display: 'block', fontSize: 10, color: '#9ca3af' }}>max {fmtPrice(c.maxDiscount)}</span>
                      )}
                    </td>
                    <td>
                      {c.minOrderValue > 0 ? (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{fmtPrice(c.minOrderValue)}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: c.usageLimit && c.usedCount >= c.usageLimit ? '#dc2626' : '#111827',
                        }}>{c.usedCount}</span>
                        {c.usageLimit && (
                          <>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>/ {c.usageLimit}</span>
                            <div style={{
                              width: 40, height: 4, borderRadius: 2, background: '#f3f4f6', overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${Math.min(c.usagePercent || 0, 100)}%`, height: '100%',
                                borderRadius: 2,
                                background: c.usagePercent > 80 ? '#ef4444' : c.usagePercent > 50 ? '#f59e0b' : '#22c55e',
                              }} />
                            </div>
                          </>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{c.uniqueUsers} unique users</span>
                    </td>
                    <td>
                      <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {fmtDate(c.validFrom)} →<br />
                        <span style={{
                          fontWeight: 600,
                          color: c.isExpired ? '#dc2626' : c.isExpiringSoon ? '#d97706' : '#6b7280',
                        }}>{fmtDate(c.validTill)}</span>
                      </div>
                    </td>
                    <td>
                      {c.isExpired ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fff5f5', padding: '2px 8px', borderRadius: 99, border: '1px solid #fecaca', whiteSpace: 'nowrap' }}>Expired</span>
                      ) : c.isExpiringSoon ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: 99, border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>Expiring</span>
                      ) : c.isActive ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 99, border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>Active</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 99, border: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Inactive</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => openUsage(c)} title="View usage"
                          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#6b7280', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13}}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          <span className="hide-mobile">Usage</span>
                        </button>
                        <ToggleSwitch val={c.isActive} onToggle={() => toggleActive(c)} />
                        <button onClick={() => openEdit(c)} title="Edit"
                          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#2563eb', fontSize: 11, fontFamily: 'inherit' }}>
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(c._id, c.code)} title="Delete"
                          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', color: '#dc2626', fontSize: 11, fontFamily: 'inherit' }}>
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
            {coupons.filter(c => c.isActive && !c.isExpired).length} active · {coupons.filter(c => c.isExpired).length} expired · {coupons.filter(c => c.isExpiringSoon).length} expiring soon
          </div>
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                {editingId ? `Edit ${form.code}` : 'New Coupon'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Code *</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="SUMMER20" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'monospace', fontWeight: 600, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Label</label>
                  <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="20% off summer" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none', background: '#fff' }}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Value *</label>
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required min="1" placeholder={form.type === 'percent' ? '10' : '100'} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Min Order Value (₹)</label>
                  <input type="number" value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: e.target.value })} min="0" placeholder="0 = no min" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} min="0" placeholder="Leave empty = no cap" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Usage Limit</label>
                  <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} min="0" placeholder="Empty = unlimited" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Per User Limit</label>
                  <input type="number" value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: e.target.value })} min="1" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Valid From</label>
                  <input type="datetime-local" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Valid Till *</label>
                  <input type="datetime-local" value={form.validTill} onChange={e => setForm({ ...form, validTill: e.target.value })} required style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ToggleSwitch val={form.isActive} onToggle={() => setForm({ ...form, isActive: !form.isActive })} />
                <span style={{ fontSize: 12, color: '#374151' }}>Active on creation</span>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: saving ? '#9ca3af' : '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                  {saving ? 'Saving...' : editingId ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk Generate Modal ── */}
      {showBulk && (
        <div className="modal-overlay" onClick={() => setShowBulk(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Bulk Generate Coupons</h3>
              <button onClick={() => setShowBulk(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleBulkGenerate} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                Generate multiple unique coupon codes with a shared prefix. Each code will have <code>XXXXXX</code> randomized suffix.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Count</label>
                  <input type="number" value={bulkCount} onChange={e => setBulkCount(Math.min(Number(e.target.value), 500))} min="1" max="500" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Prefix</label>
                  <input value={bulkPrefix} onChange={e => setBulkPrefix(e.target.value.toUpperCase())} placeholder="CAMPAIGN" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'monospace', fontWeight: 600, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Discount Type</label>
                  <select value={bulkTpl.type} onChange={e => setBulkTpl({ ...bulkTpl, type: e.target.value })} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none', background: '#fff' }}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Value</label>
                  <input type="number" value={bulkTpl.value} onChange={e => setBulkTpl({ ...bulkTpl, value: e.target.value })} min="1" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Min Order Value (₹)</label>
                  <input type="number" value={bulkTpl.minOrderValue} onChange={e => setBulkTpl({ ...bulkTpl, minOrderValue: e.target.value })} min="0" style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Expiry *</label>
                  <input type="date" value={bulkTpl.validTill} onChange={e => setBulkTpl({ ...bulkTpl, validTill: e.target.value })} required style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Label (optional)</label>
                <input value={bulkTpl.label} onChange={e => setBulkTpl({ ...bulkTpl, label: e.target.value })} placeholder={`${bulkPrefix} Campaign`} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
                <button type="button" onClick={() => setShowBulk(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: saving ? '#9ca3af' : '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                  {saving ? 'Generating...' : `Generate ${bulkCount} Codes`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Usage Modal ── */}
      {usageModal && (
        <div className="modal-overlay" onClick={() => setUsageModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
                  {usageModal.couponCode}
                </h3>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                  Used {usageModal.usedCount} time{usageModal.usedCount !== 1 ? 's' : ''}
                  {usageModal.usageLimit ? ` · Limit: ${usageModal.usageLimit}` : ' · Unlimited'}
                </p>
              </div>
              <button onClick={() => setUsageModal(null)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ padding: '16px 24px', maxHeight: 400, overflowY: 'auto' }}>
              {usageLoading ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>Loading usage details...</p>
              ) : usageModal.usedBy?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>📭</p>
                  <p style={{ fontSize: 13 }}>No one has used this coupon yet</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>Email</th>
                      <th style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>Order</th>
                      <th style={{ textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageModal.usedBy?.map((u, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: '#374151', borderBottom: '1px solid #f9fafb' }}>{u.email || '—'}</td>
                        <td style={{ padding: '8px 10px', fontSize: 11, color: '#6b7280', fontFamily: 'monospace', borderBottom: '1px solid #f9fafb' }}>
                          {u.orderId ? String(u.orderId).slice(-8).toUpperCase() : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 11, color: '#9ca3af', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1px solid #f9fafb' }}>
                          {fmtDateTime(u.usedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CouponManagement
