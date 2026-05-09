import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  FiSave, FiPhone, FiMail, FiMapPin, FiClock,
  FiAlertCircle, FiCheck, FiPlus, FiTrash2,
} from 'react-icons/fi'
import {
  FaWhatsapp, FaInstagram, FaFacebookF, FaYoutube, FaTwitter,
} from 'react-icons/fa'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

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

// ── Reusable section card ─────────────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div className="bg-[#0d1a2e] border border-[#00c2ff22] rounded-2xl overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-[#00c2ff22]">
      <span className="text-cyan-400">{icon}</span>
      <h2 className="text-sm font-bold tracking-widest uppercase text-cyan-400"
        style={{ fontFamily: "'Courier New',monospace" }}>
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
)

// ── Input ─────────────────────────────────────────────────────────────────────
const Input = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-[#0a0f1e] border border-[#00c2ff22] focus:border-cyan-400 text-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder-slate-600"
    />
  </div>
)

// ── Admin Footer Editor ───────────────────────────────────────────────────────
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
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // ── Field helpers ─────────────────────────────────────────────────────────
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setPhone = (i) => (e) => {
    const phones = [...form.phones]
    phones[i] = e.target.value
    setForm((f) => ({ ...f, phones }))
  }
  const addPhone    = () => setForm((f) => ({ ...f, phones: [...f.phones, ''] }))
  const removePhone = (i) => setForm((f) => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }))

  const setBadge = (i, key) => (e) => {
    const trustBadges = [...form.trustBadges]
    trustBadges[i] = { ...trustBadges[i], [key]: e.target.value }
    setForm((f) => ({ ...f, trustBadges }))
  }
  const addBadge    = () => setForm((f) => ({ ...f, trustBadges: [...f.trustBadges, { emoji: '', text: '' }] }))
  const removeBadge = (i) => setForm((f) => ({ ...f, trustBadges: f.trustBadges.filter((_, idx) => idx !== i) }))

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.put(`${API_BASE}/api/footer`, form, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) setSuccess('Footer updated successfully!')
      else setError(data.message || 'Update failed.')
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setSaving(false)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const inputCls = 'w-full bg-[#0a0f1e] border border-[#00c2ff22] focus:border-cyan-400 text-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder-slate-600'

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen p-6" style={{ background: '#0a0f1e', fontFamily: "'Courier New',monospace" }}>
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-1">
            Footer Settings
          </h1>
          <p className="text-slate-400 text-sm">Edit all footer content. Changes reflect on the live site immediately.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/40 rounded-xl px-4 py-3 mb-5">
            <FiAlertCircle className="text-red-400 flex-shrink-0" size={15} />
            <p className="text-xs text-red-300 font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/40 rounded-xl px-4 py-3 mb-5">
            <FiCheck className="text-green-400 flex-shrink-0" size={15} />
            <p className="text-xs text-green-300 font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Contact Info ── */}
          <Section title="Contact Info" icon={<FiPhone />}>
            <div>
              <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                Phone Numbers
              </label>
              {form.phones.map((ph, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="tel"
                    value={ph}
                    onChange={setPhone(i)}
                    placeholder={`Phone ${i + 1}`}
                    className={inputCls}
                  />
                  {form.phones.length > 1 && (
                    <button type="button" onClick={() => removePhone(i)}
                      className="px-3 text-red-400 hover:text-red-300 transition-colors">
                      <FiTrash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPhone}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold mt-1 transition-colors">
                <FiPlus size={13} /> Add Phone
              </button>
            </div>
            <Input label="Email"   value={form.email}   onChange={set('email')}   placeholder="contact@example.com" type="email" />
            <Input label="Address" value={form.address} onChange={set('address')} placeholder="Full address" />
            <Input label="Working Hours" value={form.hours} onChange={set('hours')} placeholder="Mon – Sun | 9AM – 8PM" />
          </Section>

          {/* ── Social Links ── */}
          <Section title="Social Links" icon={<FaInstagram />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'whatsapp',  label: 'WhatsApp URL',  icon: <FaWhatsapp className="text-green-400" /> },
                { key: 'instagram', label: 'Instagram URL', icon: <FaInstagram className="text-pink-400" /> },
                { key: 'facebook',  label: 'Facebook URL',  icon: <FaFacebookF className="text-blue-400" /> },
                { key: 'youtube',   label: 'YouTube URL',   icon: <FaYoutube className="text-red-400" /> },
                { key: 'twitter',   label: 'Twitter URL',   icon: <FaTwitter className="text-sky-400" /> },
              ].map(({ key, label, icon }) => (
                <div key={key}>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                    {icon} {label}
                  </label>
                  <input
                    type="url"
                    value={form[key]}
                    onChange={set(key)}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* ── Newsletter ── */}
          <Section title="Newsletter Strip" icon={<FiMail />}>
            <Input label="Title"    value={form.newsletterTitle}    onChange={set('newsletterTitle')}    placeholder="Newsletter heading" />
            <Input label="Subtitle" value={form.newsletterSubtitle} onChange={set('newsletterSubtitle')} placeholder="Short description" />
          </Section>

          {/* ── Trust Badges ── */}
          <Section title="Trust Badges" icon={<FiCheck />}>
            {form.trustBadges.map((badge, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={badge.emoji}
                  onChange={setBadge(i, 'emoji')}
                  placeholder="🚚"
                  className={`${inputCls} w-16 text-center`}
                />
                <input
                  value={badge.text}
                  onChange={setBadge(i, 'text')}
                  placeholder="Badge text"
                  className={`${inputCls} flex-1`}
                />
                <button type="button" onClick={() => removeBadge(i)}
                  className="px-3 text-red-400 hover:text-red-300 transition-colors">
                  <FiTrash2 size={15} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addBadge}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold mt-1 transition-colors">
              <FiPlus size={13} /> Add Badge
            </button>
          </Section>

          {/* ── App Download ── */}
          <Section title="App Download Links" icon={<FiMapPin />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Google Play URL" value={form.playStoreLink} onChange={set('playStoreLink')} placeholder="https://play.google.com/..." />
              <Input label="App Store URL"   value={form.appStoreLink}  onChange={set('appStoreLink')}  placeholder="https://apps.apple.com/..." />
            </div>
          </Section>

          {/* ── Copyright ── */}
          <Section title="Copyright Text" icon={<FiClock />}>
            <Input label="Copyright Line" value={form.copyrightText} onChange={set('copyrightText')} placeholder="© 2026 Amulya Electronics..." />
          </Section>

          {/* ── Save button ── */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm tracking-wider uppercase transition-all"
            style={{
              background: saving ? '#1e3a5f' : 'linear-gradient(90deg,#00c2ff,#0077b6)',
              color: '#fff',
              boxShadow: saving ? 'none' : '0 0 20px #00c2ff44',
            }}
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><FiSave size={15} /> Save Footer Settings</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
