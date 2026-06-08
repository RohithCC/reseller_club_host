// pages/ContactsList.jsx
// TailAdmin-inspired white Contact Inbox
// ✅ All API logic preserved   ✅ Mobile responsive
// ✅ Clean white UI            ✅ react-icons replaced with inline SVGs
// ✅ Search, filter tabs, status dropdown, stats all intact

import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new:     { label: 'New',     color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6', border: '#bfdbfe' },
  read:    { label: 'Read',    color: '#d97706', bg: '#fffbeb', dot: '#f59e0b', border: '#fde68a' },
  replied: { label: 'Replied', color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e', border: '#bbf7d0' },
}
const FILTERS = ['all', 'new', 'read', 'replied']

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = iso => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const Ico = {
  Mail:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  Phone:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
  Search:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Refresh:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/></svg>,
  Alert:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Check:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}><path d="M20 6L9 17l-5-5"/></svg>,
  Clock:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Message:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  ChevDown:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}><path d="M6 9l6 6 6-6"/></svg>,
  ChevUp:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}><path d="M18 15l-6-6-6 6"/></svg>,
  X:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Inbox:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40,flexShrink:0}}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>,
}

// ─── Shared tokens ────────────────────────────────────────────────────────────
const T = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' },
  inp: {
    width: '100%', padding: '9px 12px', fontSize: 13,
    color: '#111827', background: '#fff',
    border: '1px solid #e5e7eb', borderRadius: 8,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
}
const fi = e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }
const bi = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }

// ─── Status badge ──────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.new
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, count, accent }) => (
  <div style={{
    ...T.card,
    padding: '16px 18px',
    borderLeft: `3px solid ${accent}`,
  }}>
    <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
      {label}
    </p>
    <p style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1 }}>{count}</p>
  </div>
)

// ─── Spinner ───────────────────────────────────────────────────────────────────
const Spin = ({ size = 13 }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    border: '2px solid #e5e7eb', borderTopColor: '#2563eb',
    display: 'inline-block', animation: 'clSpin 0.7s linear infinite',
  }} />
)

// ─── Contact card ──────────────────────────────────────────────────────────────
const ContactCard = ({ contact, onStatusChange, updating }) => {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isNew = contact.status === 'new'

  return (
    <div style={{
      ...T.card,
      border: `1px solid ${isNew ? '#bfdbfe' : '#e5e7eb'}`,
      boxShadow: isNew ? '0 0 0 1px #bfdbfe' : '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.15s',
    }}>
      {/* ── Row header ── */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', cursor: 'pointer', userSelect: 'none',
          flexWrap: 'nowrap',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: isNew ? '#eff6ff' : '#f3f4f6',
          color: isNew ? '#2563eb' : '#6b7280',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700,
        }}>
          {contact.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact.name}
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact.email}
          </p>
        </div>

        {/* Subject — hidden on small */}
        <p className="cl-subject" style={{ fontSize: 12, color: '#6b7280', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
          {contact.subject}
        </p>

        {/* Date — hidden on small */}
        <p className="cl-date" style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, margin: 0, whiteSpace: 'nowrap' }}>
          {fmt(contact.createdAt)}
        </p>

        {/* Status badge */}
        <Badge status={contact.status} />

        {/* Expand chevron */}
        <span style={{ color: '#9ca3af', display: 'flex', flexShrink: 0 }}>
          {expanded ? <Ico.ChevUp /> : <Ico.ChevDown />}
        </span>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div style={{
          padding: '16px', borderTop: '1px solid #f3f4f6',
          background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
            {[
              { icon: <Ico.Mail />,    content: <a href={`mailto:${contact.email}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>{contact.email}</a> },
              contact.phone && { icon: <Ico.Phone />,   content: <a href={`tel:${contact.phone}`}   style={{ color: '#374151', textDecoration: 'none' }}>{contact.phone}</a> },
              { icon: <Ico.Message />, content: <span style={{ color: '#374151' }}>{contact.subject}</span> },
              { icon: <Ico.Clock />,   content: <span style={{ color: '#6b7280' }}>{fmt(contact.createdAt)}</span> },
            ].filter(Boolean).map(({ icon, content }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                <span style={{ color: '#9ca3af', marginTop: 1, flexShrink: 0 }}>{icon}</span>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{content}</span>
              </div>
            ))}
          </div>

          {/* Message body */}
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '14px 16px',
            fontSize: 13, color: '#374151', lineHeight: 1.7,
            whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto',
          }}>
            {contact.message}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Reply via email */}
            <a
              href={`mailto:${contact.email}?subject=Re: ${contact.subject}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: '#eff6ff', color: '#2563eb',
                border: '1px solid #bfdbfe',
                fontSize: 12, fontWeight: 600, textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
              onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
            >
              <Ico.Mail /> Reply via Email
            </a>

            {/* Status dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
                disabled={updating === contact._id}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: '#f3f4f6', color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
              >
                {updating === contact._id ? <Spin /> : <Ico.ChevDown />}
                Change Status
              </button>

              {menuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={() => setMenuOpen(false)} aria-hidden="true" />
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
                    background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 20, overflow: 'hidden', minWidth: 140,
                  }}>
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => {
                      const active = key === contact.status
                      return (
                        <button
                          key={key}
                          onClick={e => { e.stopPropagation(); setMenuOpen(false); if (!active) onStatusChange(contact._id, key) }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '10px 14px', border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, textAlign: 'left',
                            background: active ? val.bg : 'transparent',
                            color: active ? val.color : '#374151',
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f9fafb' }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: val.dot, flexShrink: 0 }} />
                          {val.label}
                          {active && <span style={{ marginLeft: 'auto', display: 'flex' }}><Ico.Check /></span>}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ContactsList() {
  const [contacts, setContacts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [updating, setUpdating] = useState(null)
  const [toastMsg, setToastMsg] = useState('')

  const fetchContacts = async () => {
    setLoading(true); setError('')
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.get(`${API_BASE}/api/contact/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) setContacts(data.contacts)
      else setError(data.message || 'Failed to load contacts.')
    } catch (err) { setError(err.response?.data?.message || err.message || 'Network error.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchContacts() }, [])

  const handleStatusChange = async (id, status) => {
    setUpdating(id)
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.patch(
        `${API_BASE}/api/contact/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        setContacts(prev => prev.map(c => c._id === id ? { ...c, status } : c))
        showToast(`Marked as ${STATUS_CONFIG[status].label}`)
      } else showToast(data.message || 'Update failed.')
    } catch (err) { showToast(err.message || 'Update failed.') }
    finally { setUpdating(null) }
  }

  const showToast = msg => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000) }

  const stats = useMemo(() => ({
    all:     contacts.length,
    new:     contacts.filter(c => c.status === 'new').length,
    read:    contacts.filter(c => c.status === 'read').length,
    replied: contacts.filter(c => c.status === 'replied').length,
  }), [contacts])

  const filtered = useMemo(() => {
    let list = filter === 'all' ? contacts : contacts.filter(c => c.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q)    ||
        c.email.toLowerCase().includes(q)   ||
        c.subject.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
      )
    }
    return list
  }, [contacts, filter, search])

  return (
    <>
      <style>{`
        @keyframes clSpin { to { transform: rotate(360deg); } }
        @keyframes clFade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes clPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        * { box-sizing: border-box; }
        input::placeholder { color: #9ca3af; }
        .cl-subject { display: block; }
        .cl-date    { display: block; }
        @media (max-width: 640px) {
          .cl-subject { display: none !important; }
        }
        @media (max-width: 768px) {
          .cl-date { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 900, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
              Contact Inbox
            </h1>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              All messages from the contact form
            </p>
          </div>
          <button
            onClick={fetchContacts} disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 8,
              background: '#eff6ff', color: '#2563eb',
              border: '1px solid #bfdbfe',
              fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'all 0.15s',
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = '#ede9fe')}
            onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}
          >
            <span style={{ display: 'flex', animation: loading ? 'clSpin 0.8s linear infinite' : 'none' }}>
              <Ico.Refresh />
            </span>
            Refresh
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
          <StatCard label="Total"   count={stats.all}     accent="#9ca3af" />
          <StatCard label="New"     count={stats.new}     accent="#3b82f6" />
          <StatCard label="Read"    count={stats.read}    accent="#f59e0b" />
          <StatCard label="Replied" count={stats.replied} accent="#22c55e" />
        </div>

        {/* ── Search + Filter bar ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: '#9ca3af', pointerEvents: 'none' }}>
              <Ico.Search />
            </span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, subject…"
              style={{ ...T.inp, paddingLeft: 36, paddingRight: search ? 34 : 12 }}
              onFocus={fi} onBlur={bi}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
                  display: 'flex',
                }}>
                <Ico.X />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: 4, borderRadius: 10,
            background: '#f3f4f6', border: '1px solid #e5e7eb',
            flexShrink: 0, flexWrap: 'wrap',
          }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '6px 12px', borderRadius: 7,
                  border: filter === f ? '1px solid #bfdbfe' : '1px solid transparent',
                  background: filter === f ? '#fff' : 'transparent',
                  color: filter === f ? '#2563eb' : '#6b7280',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  textTransform: 'capitalize', transition: 'all 0.15s',
                  boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  whiteSpace: 'nowrap',
                }}>
                {f}
                {f !== 'all' && stats[f] > 0 && (
                  <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>({stats[f]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 14px', borderRadius: 10,
            background: '#fff5f5', border: '1px solid #fecaca',
            animation: 'clFade 0.2s ease',
          }}>
            <span style={{ color: '#dc2626', display: 'flex' }}><Ico.Alert /></span>
            <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                height: 64, borderRadius: 12, background: '#f3f4f6',
                animation: 'clPulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 20px', textAlign: 'center',
            border: '1px dashed #e5e7eb', borderRadius: 14,
            animation: 'clFade 0.2s ease',
          }}>
            <span style={{ color: '#d1d5db', marginBottom: 14 }}><Ico.Inbox /></span>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>
              {search ? 'No results found' : 'No messages yet'}
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
              {search ? 'Try a different search term' : 'Contact form submissions will appear here'}
            </p>
          </div>
        )}

        {/* ── Contacts list ── */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(contact => (
              <div key={contact._id} style={{ animation: 'clFade 0.2s ease' }}>
                <ContactCard
                  contact={contact}
                  onStatusChange={handleStatusChange}
                  updating={updating}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Result count ── */}
        {!loading && filtered.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            Showing {filtered.length} of {contacts.length} messages
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
          color: '#16a34a', fontSize: 13, fontWeight: 600,
          animation: 'clFade 0.2s ease',
        }}>
          <Ico.Check /> {toastMsg}
        </div>
      )}
    </>
  )
}