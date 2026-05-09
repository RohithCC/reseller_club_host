import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import {
  FiMail, FiPhone, FiSearch, FiRefreshCw,
  FiAlertCircle, FiCheck, FiClock, FiMessageSquare,
  FiChevronDown, FiChevronUp, FiX, FiInbox,
} from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new:     { label: 'New',     color: '#00c2ff', bg: '#00c2ff18', dot: '#00c2ff' },
  read:    { label: 'Read',    color: '#f59e0b', bg: '#f59e0b18', dot: '#f59e0b' },
  replied: { label: 'Replied', color: '#22c55e', bg: '#22c55e18', dot: '#22c55e' },
}

const FILTERS = ['all', 'new', 'read', 'replied']

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const Badge = ({ status }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.new
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: c.bg, color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      {c.label}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, count, color }) => (
  <div className="rounded-xl px-5 py-4 flex flex-col gap-1"
    style={{ background: '#0d1a2e', border: '1px solid #00c2ff22' }}>
    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>{label}</p>
    <p className="text-2xl font-black" style={{ color }}>{count}</p>
  </div>
)

// ── Contact row / card ────────────────────────────────────────────────────────
const ContactCard = ({ contact, onStatusChange, updating }) => {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background:   '#0d1a2e',
        border:       `1px solid ${contact.status === 'new' ? '#00c2ff33' : '#00c2ff11'}`,
        boxShadow:    contact.status === 'new' ? '0 0 12px #00c2ff11' : 'none',
      }}>

      {/* ── Row header ── */}
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
          style={{ background: '#00c2ff22', color: '#00c2ff' }}>
          {contact.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{contact.name}</p>
          <p className="text-xs truncate" style={{ color: '#64748b' }}>{contact.email}</p>
        </div>

        {/* Subject — hidden on mobile */}
        <p className="hidden sm:block text-xs flex-1 min-w-0 truncate" style={{ color: '#94a3b8' }}>
          {contact.subject}
        </p>

        {/* Date — hidden on mobile */}
        <p className="hidden md:block text-xs flex-shrink-0" style={{ color: '#475569' }}>
          {fmt(contact.createdAt)}
        </p>

        {/* Status badge */}
        <Badge status={contact.status} />

        {/* Expand chevron */}
        <span style={{ color: '#475569' }}>
          {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </span>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid #00c2ff11' }}>

          {/* Contact meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
              <FiMail size={13} style={{ color: '#00c2ff' }} />
              <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors truncate">
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
                <FiPhone size={13} style={{ color: '#00c2ff' }} />
                <a href={`tel:${contact.phone}`} className="hover:text-white transition-colors">
                  {contact.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
              <FiMessageSquare size={13} style={{ color: '#00c2ff' }} />
              <span>{contact.subject}</span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
              <FiClock size={13} style={{ color: '#00c2ff' }} />
              <span>{fmt(contact.createdAt)}</span>
            </div>
          </div>

          {/* Message */}
          <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
            style={{ background: '#0a0f1e', color: '#94a3b8', border: '1px solid #00c2ff11' }}>
            {contact.message}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Reply via email */}
            <a
              href={`mailto:${contact.email}?subject=Re: ${contact.subject}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: '#00c2ff22', color: '#00c2ff', border: '1px solid #00c2ff33' }}
              onMouseEnter={e => e.currentTarget.style.background = '#00c2ff33'}
              onMouseLeave={e => e.currentTarget.style.background = '#00c2ff22'}
            >
              <FiMail size={13} /> Reply via Email
            </a>

            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
                disabled={updating === contact._id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                style={{ background: '#1e3a5f', color: '#94a3b8', border: '1px solid #00c2ff22' }}
              >
                {updating === contact._id ? (
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiChevronDown size={13} />
                )}
                Change Status
              </button>
              {menuOpen && (
                <div className="absolute bottom-full mb-1 left-0 rounded-xl overflow-hidden z-20"
                  style={{ background: '#0d1a2e', border: '1px solid #00c2ff22', minWidth: 130 }}>
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(false)
                        if (key !== contact.status) onStatusChange(contact._id, key)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors text-left"
                      style={{
                        color:      key === contact.status ? val.color : '#94a3b8',
                        background: key === contact.status ? val.bg    : 'transparent',
                      }}
                      onMouseEnter={e => { if (key !== contact.status) e.currentTarget.style.background = '#00c2ff0a' }}
                      onMouseLeave={e => { if (key !== contact.status) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: val.dot }} />
                      {val.label}
                      {key === contact.status && <FiCheck size={11} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ContactsList() {
  const [contacts,  setContacts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [updating,  setUpdating]  = useState(null)   // id of row being updated
  const [toast,     setToast]     = useState('')

  // ── Fetch all contacts ────────────────────────────────────────────────────
  const fetchContacts = async () => {
    setLoading(true); setError('')
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.get(`${API_BASE}/api/contact/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) setContacts(data.contacts)
      else setError(data.message || 'Failed to load contacts.')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Network error.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchContacts() }, [])

  // ── Update status ─────────────────────────────────────────────────────────
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
        setContacts(prev =>
          prev.map(c => c._id === id ? { ...c, status } : c)
        )
        showToast(`Marked as ${STATUS_CONFIG[status].label}`)
      } else {
        showToast(data.message || 'Update failed.')
      }
    } catch (err) {
      showToast(err.message || 'Update failed.')
    } finally {
      setUpdating(null)
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    all:     contacts.length,
    new:     contacts.filter(c => c.status === 'new').length,
    read:    contacts.filter(c => c.status === 'read').length,
    replied: contacts.filter(c => c.status === 'replied').length,
  }), [contacts])

  // ── Filtered + searched list ──────────────────────────────────────────────
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
    <div className="min-h-screen p-6" style={{ background: '#0a0f1e', fontFamily: "'Courier New',monospace" }}>
      <div className="max-w-5xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-0.5">
              Contact Inbox
            </h1>
            <p className="text-xs" style={{ color: '#475569' }}>
              All messages from the contact form
            </p>
          </div>
          <button
            onClick={fetchContacts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: '#00c2ff18', color: '#00c2ff', border: '1px solid #00c2ff33' }}
          >
            <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total"   count={stats.all}     color="#94a3b8" />
          <StatCard label="New"     count={stats.new}     color="#00c2ff" />
          <StatCard label="Read"    count={stats.read}    color="#f59e0b" />
          <StatCard label="Replied" count={stats.replied} color="#22c55e" />
        </div>

        {/* ── Search + Filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2" size={14}
              style={{ color: '#475569' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, subject..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: '#0d1a2e', color: '#e2e8f0',
                border: '1px solid #00c2ff22',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#475569' }}>
                <FiX size={13} />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 p-1 rounded-xl flex-shrink-0"
            style={{ background: '#0d1a2e', border: '1px solid #00c2ff11' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                style={{
                  background: filter === f ? '#00c2ff22' : 'transparent',
                  color:      filter === f ? '#00c2ff'   : '#64748b',
                  border:     filter === f ? '1px solid #00c2ff33' : '1px solid transparent',
                }}
              >
                {f} {f !== 'all' && stats[f] > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">({stats[f]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4"
            style={{ background: '#7f1d1d33', border: '1px solid #ef444433' }}>
            <FiAlertCircle size={15} style={{ color: '#ef4444' }} />
            <p className="text-xs font-medium" style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse"
                style={{ background: '#0d1a2e' }} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FiInbox size={40} style={{ color: '#1e3a5f' }} className="mb-4" />
            <p className="font-bold text-sm" style={{ color: '#334155' }}>
              {search ? 'No results found' : 'No messages yet'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#1e3a5f' }}>
              {search ? 'Try a different search term' : 'Contact form submissions will appear here'}
            </p>
          </div>
        )}

        {/* ── Contacts list ── */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(contact => (
              <ContactCard
                key={contact._id}
                contact={contact}
                onStatusChange={handleStatusChange}
                updating={updating}
              />
            ))}
          </div>
        )}

        {/* ── Result count ── */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
            Showing {filtered.length} of {contacts.length} messages
          </p>
        )}
      </div>

      {/* ── Toast notification ── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold z-50 transition-all"
          style={{ background: '#0d1a2e', border: '1px solid #00c2ff33', color: '#00c2ff',
                   boxShadow: '0 0 20px #00c2ff22' }}>
          <FiCheck size={14} /> {toast}
        </div>
      )}
    </div>
  )
}
