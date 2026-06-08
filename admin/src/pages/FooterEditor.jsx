// pages/FooterEditor.jsx
// TailAdmin-inspired white Footer Editor
// ✅ All API logic preserved   ✅ Mobile responsive
// ✅ Clean white UI            ✅ react-icons + react-icons/fa replaced with inline SVGs
// ✅ All sections intact: Contact, Social, Newsletter, Trust Badges, App Links, Copyright

import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'

const EMPTY = {
  phones:             ['', ''],
  email:              '',
  address:            '',
  hours:              '',
  whatsapp:           '',
  instagram:          '',
  facebook:           '',
  youtube:            '',
  twitter:            '',
  newsletterTitle:    '',
  newsletterSubtitle: '',
  playStoreLink:      '',
  appStoreLink:       '',
  trustBadges:        [],
  copyrightText:      '',
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const Ico = {
  Save:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>,
  Phone:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,flexShrink:0}}><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
  Mail:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,flexShrink:0}}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  MapPin:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,flexShrink:0}}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  Clock:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,flexShrink:0}}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Alert:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Check:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M20 6L9 17l-5-5"/></svg>,
  Plus:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}><path d="M12 5v14M5 12h14"/></svg>,
  Trash:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  Shield:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,flexShrink:0}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Download:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,flexShrink:0}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  // Social brand icons (simplified SVG outlines)
  Whatsapp:  () => <svg viewBox="0 0 24 24" fill="currentColor" style={{width:15,height:15,flexShrink:0}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  Instagram: () => <svg viewBox="0 0 24 24" fill="currentColor" style={{width:15,height:15,flexShrink:0}}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  Facebook:  () => <svg viewBox="0 0 24 24" fill="currentColor" style={{width:15,height:15,flexShrink:0}}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  Youtube:   () => <svg viewBox="0 0 24 24" fill="currentColor" style={{width:15,height:15,flexShrink:0}}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  Twitter:   () => <svg viewBox="0 0 24 24" fill="currentColor" style={{width:15,height:15,flexShrink:0}}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
}

// ─── Shared tokens ────────────────────────────────────────────────────────────
const T = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' },
  inp: {
    width: '100%', padding: '9px 12px', fontSize: 13,
    color: '#111827', background: '#fff',
    border: '1px solid #e5e7eb', borderRadius: 8,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 },
}
const fi = e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }
const bi = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }

// ─── Reusable section card ────────────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div style={T.card}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
      background: '#fafafa',
    }}>
      <span style={{ color: '#2563eb', display: 'flex' }}>{icon}</span>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0, letterSpacing: '-0.01em' }}>
        {title}
      </h2>
    </div>
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {children}
    </div>
  </div>
)

// ─── Field + Input helpers ────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label style={T.label}>{label}</label>
    {children}
  </div>
)

const SInput = ({ label, value, onChange, placeholder, type = 'text', style }) => (
  <Field label={label}>
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ ...T.inp, ...style }}
      onFocus={fi} onBlur={bi}
    />
  </Field>
)

// ─── Add button ───────────────────────────────────────────────────────────────
const AddBtn = ({ onClick, children }) => (
  <button type="button" onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 12, fontWeight: 600, color: '#2563eb',
      background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
      transition: 'color 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.color = '#3730a3'}
    onMouseLeave={e => e.currentTarget.style.color = '#2563eb'}
  >
    <Ico.Plus /> {children}
  </button>
)

// ─── Remove button ────────────────────────────────────────────────────────────
const RemoveBtn = ({ onClick }) => (
  <button type="button" onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 32, borderRadius: 7, border: 'none',
      background: '#fff5f5', color: '#dc2626',
      cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
    onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}
  >
    <Ico.Trash />
  </button>
)

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spin = ({ color = '#fff', size = 15 }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: color,
    display: 'inline-block', animation: 'feditSpin 0.7s linear infinite',
  }} />
)

// ─── Social row config ────────────────────────────────────────────────────────
const SOCIALS = [
  { key: 'whatsapp',  label: 'WhatsApp URL',  icon: <Ico.Whatsapp />,  color: '#16a34a' },
  { key: 'instagram', label: 'Instagram URL', icon: <Ico.Instagram />, color: '#db2777' },
  { key: 'facebook',  label: 'Facebook URL',  icon: <Ico.Facebook />,  color: '#2563eb' },
  { key: 'youtube',   label: 'YouTube URL',   icon: <Ico.Youtube />,   color: '#dc2626' },
  { key: 'twitter',   label: 'Twitter / X',   icon: <Ico.Twitter />,   color: '#374151' },
]

// ═══════════════════════════════════════════════════════════════════════════════
export default function FooterEditor() {
  const [form,    setForm]    = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  // ── Load current settings ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.get(`${API_BASE}/api/footer`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) setForm(data.settings)
        else setError(data.message)
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetchSettings()
  }, [])

  // ── Field helpers ─────────────────────────────────────────────────────────
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const setPhone    = i  => e => { const p = [...form.phones]; p[i] = e.target.value; setForm(f => ({ ...f, phones: p })) }
  const addPhone    = () => setForm(f => ({ ...f, phones: [...f.phones, ''] }))
  const removePhone = i  => setForm(f => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }))

  const setBadge    = (i, key) => e => { const tb = [...form.trustBadges]; tb[i] = { ...tb[i], [key]: e.target.value }; setForm(f => ({ ...f, trustBadges: tb })) }
  const addBadge    = () => setForm(f => ({ ...f, trustBadges: [...f.trustBadges, { emoji: '', text: '' }] }))
  const removeBadge = i  => setForm(f => ({ ...f, trustBadges: f.trustBadges.filter((_, idx) => idx !== i) }))

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async e => {
    e.preventDefault(); setError(''); setSuccess('')
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.put(`${API_BASE}/api/footer`, form, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) setSuccess('Footer updated successfully!')
      else setError(data.message || 'Update failed.')
    } catch (err) { setError(err.response?.data?.message || err.message) }
    finally { setSaving(false); setTimeout(() => setSuccess(''), 3000) }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid #e5e7eb', borderTopColor: '#2563eb',
        animation: 'feditSpin 0.8s linear infinite',
      }} />
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes feditSpin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
      `}</style>

      <div style={{ maxWidth: 760, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
              Footer Settings
            </h1>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              Edit all footer content. Changes reflect on the live site immediately.
            </p>
          </div>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 14px', borderRadius: 10,
            background: '#fff5f5', border: '1px solid #fecaca',
          }}>
            <span style={{ color: '#dc2626', display: 'flex' }}><Ico.Alert /></span>
            <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 14px', borderRadius: 10,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
          }}>
            <span style={{ color: '#16a34a', display: 'flex' }}><Ico.Check /></span>
            <p style={{ fontSize: 13, color: '#16a34a', margin: 0 }}>{success}</p>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── 1. Contact Info ── */}
          <Section title="Contact Information" icon={<Ico.Phone />}>
            <Field label="Phone Numbers">
              {form.phones.map((ph, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input
                    type="tel" value={ph} onChange={setPhone(i)}
                    placeholder={`Phone ${i + 1}`}
                    style={T.inp}
                    onFocus={fi} onBlur={bi}
                  />
                  {form.phones.length > 1 && <RemoveBtn onClick={() => removePhone(i)} />}
                </div>
              ))}
              <AddBtn onClick={addPhone}>Add Phone</AddBtn>
            </Field>

            <SInput label="Email Address"  value={form.email}   onChange={set('email')}   placeholder="contact@example.com" type="email" />
            <SInput label="Full Address"   value={form.address} onChange={set('address')} placeholder="Shop No. 12, MG Road, Dharwad" />
            <SInput label="Working Hours"  value={form.hours}   onChange={set('hours')}   placeholder="Mon – Sun | 9AM – 8PM" />
          </Section>

          {/* ── 2. Social Links ── */}
          <Section title="Social Media Links" icon={<Ico.Instagram />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {SOCIALS.map(({ key, label, icon, color }) => (
                <div key={key}>
                  <label style={{ ...T.label, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color, display: 'flex' }}>{icon}</span>
                    {label}
                  </label>
                  <input
                    type="url" value={form[key]} onChange={set(key)}
                    placeholder="https://..."
                    style={T.inp}
                    onFocus={fi} onBlur={bi}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* ── 3. Newsletter ── */}
          <Section title="Newsletter Strip" icon={<Ico.Mail />}>
            <SInput label="Title"    value={form.newsletterTitle}    onChange={set('newsletterTitle')}    placeholder="Subscribe to our newsletter" />
            <SInput label="Subtitle" value={form.newsletterSubtitle} onChange={set('newsletterSubtitle')} placeholder="Get the latest deals and updates" />
          </Section>

          {/* ── 4. Trust Badges ── */}
          <Section title="Trust Badges" icon={<Ico.Shield />}>
            {form.trustBadges.length === 0 && (
              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>
                No badges yet — add your first one below.
              </p>
            )}
            {form.trustBadges.map((badge, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={badge.emoji} onChange={setBadge(i, 'emoji')}
                  placeholder="🚚"
                  style={{ ...T.inp, width: 58, textAlign: 'center', flexShrink: 0 }}
                  onFocus={fi} onBlur={bi}
                />
                <input
                  value={badge.text} onChange={setBadge(i, 'text')}
                  placeholder="Free shipping above ₹499"
                  style={{ ...T.inp, flex: 1, minWidth: 140 }}
                  onFocus={fi} onBlur={bi}
                />
                <RemoveBtn onClick={() => removeBadge(i)} />
              </div>
            ))}
            <AddBtn onClick={addBadge}>Add Badge</AddBtn>
          </Section>

          {/* ── 5. App Download Links ── */}
          <Section title="App Download Links" icon={<Ico.Download />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              <SInput label="Google Play URL" value={form.playStoreLink} onChange={set('playStoreLink')} placeholder="https://play.google.com/store/apps/..." type="url" />
              <SInput label="App Store URL"   value={form.appStoreLink}  onChange={set('appStoreLink')}  placeholder="https://apps.apple.com/..."          type="url" />
            </div>
          </Section>

          {/* ── 6. Copyright ── */}
          <Section title="Copyright Text" icon={<Ico.Clock />}>
            <SInput label="Copyright Line" value={form.copyrightText} onChange={set('copyrightText')} placeholder="© 2026 Amulya Electronics. All rights reserved." />
          </Section>

          {/* ── Save button ── */}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px', borderRadius: 10, border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              background: saving ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              boxShadow: saving ? 'none' : '0 4px 14px rgba(79,70,229,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = saving ? 'none' : '0 4px 14px rgba(79,70,229,0.3)' }}
          >
            {saving
              ? <><Spin /> Saving…</>
              : <><Ico.Save /> Save Footer Settings</>
            }
          </button>
        </form>
      </div>
    </>
  )
}