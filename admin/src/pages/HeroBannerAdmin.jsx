// pages/HeroBannerAdmin.jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff,
  FiSave, FiX, FiAlertCircle, FiCheck, FiImage,
  FiArrowUp, FiArrowDown,
} from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// ── Gradient presets ──────────────────────────────────────────────────────────
const BG_PRESETS = [
  { label: 'Blue',   value: 'from-blue-800 via-blue-700 to-blue-900' },
  { label: 'Orange', value: 'from-orange-600 via-orange-500 to-red-600' },
  { label: 'Slate',  value: 'from-slate-800 via-slate-700 to-slate-900' },
  { label: 'Green',  value: 'from-green-700 via-green-600 to-teal-800' },
  { label: 'Purple', value: 'from-purple-800 via-purple-700 to-indigo-900' },
  { label: 'Red',    value: 'from-red-700 via-red-600 to-rose-800' },
]

const ACCENT_PRESETS = [
  { label: 'Yellow',  value: 'text-yellow-300' },
  { label: 'Cyan',    value: 'text-cyan-300' },
  { label: 'Pink',    value: 'text-pink-300' },
  { label: 'Green',   value: 'text-green-300' },
  { label: 'White',   value: 'text-white' },
  { label: 'Yellow2', value: 'text-yellow-200' },
]

// ── bgImage added to empty form template ─────────────────────────────────────
const EMPTY_FORM = {
  badge: '', title: '', titleAccent: '', subtitle: '',
  desc: '', cta: '', ctaLink: '',
  bg:          BG_PRESETS[0].value,
  accentColor: ACCENT_PRESETS[0].value,
  image:   '',   // foreground product image
  bgImage: '',   // ← NEW: background image URL
  order: 0, isActive: true,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
})

// ── Input label wrapper ───────────────────────────────────────────────────────
const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
      style={{ color: '#64748b' }}>
      {label} {required && <span style={{ color: '#f87171' }}>*</span>}
    </label>
    {hint && <p className="text-[11px] mb-1.5" style={{ color: '#334155' }}>{hint}</p>}
    {children}
  </div>
)

const inp = 'w-full bg-[#0a0f1e] border border-[#00c2ff22] focus:border-cyan-400 text-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder-slate-600'

// ── Slide list card ───────────────────────────────────────────────────────────
const SlideCard = ({ slide, index, total, onEdit, onDelete, onToggle, onMoveUp, onMoveDown }) => (
  <div className="rounded-2xl overflow-hidden transition-all"
    style={{
      background: '#0d1a2e',
      border: `1px solid ${slide.isActive ? '#00c2ff33' : '#00c2ff11'}`,
      opacity: slide.isActive ? 1 : 0.55,
    }}>

    {/* Preview strip */}
    <div
      className={`bg-gradient-to-r ${slide.bg} h-20 relative flex items-center px-5 gap-4`}
      style={slide.bgImage ? {
        backgroundImage: `url(${slide.bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      {/* Dark overlay so text stays readable when bgImage is set */}
      {slide.bgImage && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      )}

      <img src={slide.image} alt={slide.title}
        className="h-16 w-24 object-cover rounded-xl flex-shrink-0 ring-2 ring-white/20 relative z-10"
        onError={e => { e.target.src = 'https://placehold.co/120x64?text=No+Image' }} />

      <div className="min-w-0 relative z-10">
        <p className="text-[10px] font-bold text-white/60 truncate">{slide.badge}</p>
        <p className="text-sm font-black text-white leading-tight truncate">{slide.title}</p>
        <p className={`text-sm font-black ${slide.accentColor} leading-tight truncate`}>{slide.titleAccent}</p>
      </div>

      {/* Background image indicator */}
      {slide.bgImage && (
        <div className="absolute bottom-2 left-3 z-10">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#00c2ff33', color: '#00c2ff', border: '1px solid #00c2ff44' }}>
            🖼 BG image
          </span>
        </div>
      )}

      {/* Status pill */}
      <div className="absolute top-2 right-3 z-10">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: slide.isActive ? '#22c55e22' : '#64748b22',
            color:      slide.isActive ? '#22c55e'   : '#64748b',
          }}>
          {slide.isActive ? 'Active' : 'Hidden'}
        </span>
      </div>
    </div>

    {/* Info + actions row */}
    <div className="px-5 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold text-white truncate">{slide.title} {slide.titleAccent}</p>
        <p className="text-[11px] truncate" style={{ color: '#475569' }}>{slide.cta} → {slide.ctaLink}</p>
        {slide.bgImage && (
          <p className="text-[10px] truncate mt-0.5" style={{ color: '#334155' }}>
            BG: {slide.bgImage.length > 50 ? slide.bgImage.slice(0, 50) + '…' : slide.bgImage}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={() => onMoveUp(index)} disabled={index === 0}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: '#00c2ff11', color: '#00c2ff' }} title="Move Up">
          <FiArrowUp size={13} />
        </button>
        <button onClick={() => onMoveDown(index)} disabled={index === total - 1}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: '#00c2ff11', color: '#00c2ff' }} title="Move Down">
          <FiArrowDown size={13} />
        </button>

        <button onClick={() => onToggle(slide._id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: slide.isActive ? '#22c55e22' : '#64748b22',
            color:      slide.isActive ? '#22c55e'   : '#94a3b8',
          }}
          title={slide.isActive ? 'Deactivate' : 'Activate'}>
          {slide.isActive ? <FiEye size={13} /> : <FiEyeOff size={13} />}
        </button>

        <button onClick={() => onEdit(slide)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ background: '#00c2ff22', color: '#00c2ff' }} title="Edit">
          <FiEdit2 size={13} />
        </button>

        <button onClick={() => onDelete(slide._id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ background: '#ef444422', color: '#ef4444' }} title="Delete">
          <FiTrash2 size={13} />
        </button>
      </div>
    </div>
  </div>
)

// ── Slide form modal ──────────────────────────────────────────────────────────
const SlideModal = ({ slide, onClose, onSave, saving, error }) => {
  const isEdit = !!slide?._id
  const [form, setForm] = useState(slide || EMPTY_FORM)

  const set      = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const setCheck = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.checked }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: '#000000bb', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#0d1a2e', border: '1px solid #00c2ff33' }}
        onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #00c2ff22' }}>
          <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#00c2ff' }}>
            {isEdit ? 'Edit Slide' : 'Add New Slide'}
          </h2>
          <button onClick={onClose} style={{ color: '#64748b' }}
            className="hover:text-white transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── Live preview strip ── */}
          <div
            className={`bg-gradient-to-r ${form.bg} rounded-xl h-20 flex items-center px-4 gap-3 overflow-hidden relative`}
            style={form.bgImage ? {
              backgroundImage: `url(${form.bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            {/* Dark overlay when bgImage is active */}
            {form.bgImage && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: 12 }} />
            )}

            {form.image && (
              <img src={form.image} alt="preview"
                className="h-14 w-20 object-cover rounded-lg flex-shrink-0 ring-2 ring-white/20 relative z-10"
                onError={e => { e.target.style.display = 'none' }} />
            )}
            <div className="relative z-10">
              <p className="text-xs text-white/60 font-semibold">{form.badge || 'Badge'}</p>
              <p className="text-sm font-black text-white">
                {form.title || 'Title'}{' '}
                <span className={form.accentColor}>{form.titleAccent || 'Accent'}</span>
              </p>
              {form.subtitle && (
                <p className="text-xs text-white/70 mt-0.5">{form.subtitle}</p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: '#7f1d1d33', border: '1px solid #ef444433' }}>
              <FiAlertCircle size={14} style={{ color: '#ef4444' }} />
              <p className="text-xs font-medium" style={{ color: '#fca5a5' }}>{error}</p>
            </div>
          )}

          {/* Form fields grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Badge Text" required>
              <input value={form.badge} onChange={set('badge')} placeholder="🎉 Sale Live Now!" className={inp} />
            </Field>
            <Field label="Display Order">
              <input type="number" value={form.order} onChange={set('order')} min="0" className={inp} />
            </Field>
            <Field label="Title" required>
              <input value={form.title} onChange={set('title')} placeholder="Electronic" className={inp} />
            </Field>
            <Field label="Title Accent" required>
              <input value={form.titleAccent} onChange={set('titleAccent')} placeholder="Components" className={inp} />
            </Field>
            <Field label="Subtitle">
              <input value={form.subtitle} onChange={set('subtitle')} placeholder="& Modules..." className={inp} />
            </Field>
            <Field label="Description">
              <input value={form.desc} onChange={set('desc')} placeholder="Short description..." className={inp} />
            </Field>
            <Field label="CTA Button Label" required>
              <input value={form.cta} onChange={set('cta')} placeholder="Shop Now" className={inp} />
            </Field>
            <Field label="CTA Link" required>
              <input value={form.ctaLink} onChange={set('ctaLink')} placeholder="/collection/Sensors" className={inp} />
            </Field>
          </div>

          {/* ── Foreground product image ── */}
          <Field label="Product / Foreground Image URL" required
            hint="Main product image shown in front of the slide.">
            <div className="flex gap-2">
              <input value={form.image} onChange={set('image')}
                placeholder="https://example.com/product.png" className={`${inp} flex-1`} />
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 flex items-center justify-center border border-[#00c2ff22]">
                {form.image
                  ? <img src={form.image} alt="" className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none' }} />
                  : <FiImage size={16} style={{ color: '#475569' }} />}
              </div>
            </div>
          </Field>

          {/* ── Background image (NEW) ── */}
          <Field label="Background Image URL"
            hint="Optional full-bleed background photo placed behind the gradient. Leave empty to use gradient only.">
            <div className="flex gap-2">
              <input value={form.bgImage} onChange={set('bgImage')}
                placeholder="https://example.com/banner-bg.jpg (optional)" className={`${inp} flex-1`} />
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 flex items-center justify-center border border-[#00c2ff22]">
                {form.bgImage
                  ? <img src={form.bgImage} alt="" className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none' }} />
                  : <FiImage size={16} style={{ color: '#334155' }} />}
              </div>
            </div>
            {/* Tip: preview updates live in the strip above */}
            {form.bgImage && (
              <p className="text-[11px] mt-1.5" style={{ color: '#00c2ff88' }}>
                ✓ Background image applied — see preview above.
              </p>
            )}
          </Field>

          {/* ── Background gradient ── */}
          <Field label="Gradient Overlay" required
            hint="Shown when no background image is set, or blended over the image.">
            <div className="grid grid-cols-3 gap-2">
              {BG_PRESETS.map(p => (
                <button key={p.value} type="button"
                  onClick={() => setForm(f => ({ ...f, bg: p.value }))}
                  className={`bg-gradient-to-r ${p.value} h-10 rounded-xl text-white text-xs font-bold transition-all`}
                  style={{ outline: form.bg === p.value ? '2px solid #00c2ff' : 'none', outlineOffset: 2 }}>
                  {p.label}
                </button>
              ))}
            </div>
            <input value={form.bg} onChange={set('bg')} placeholder="or type custom Tailwind class..."
              className={`${inp} mt-2`} />
          </Field>

          {/* ── Accent colour ── */}
          <Field label="Title Accent Color" required>
            <div className="flex gap-2 flex-wrap">
              {ACCENT_PRESETS.map(p => (
                <button key={p.value} type="button"
                  onClick={() => setForm(f => ({ ...f, accentColor: p.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${p.value}`}
                  style={{
                    background: form.accentColor === p.value ? '#00c2ff22' : '#0a0f1e',
                    border: `1px solid ${form.accentColor === p.value ? '#00c2ff' : '#00c2ff22'}`,
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
            <input value={form.accentColor} onChange={set('accentColor')} placeholder="text-yellow-300"
              className={`${inp} mt-2`} />
          </Field>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={form.isActive} onChange={setCheck('isActive')}
              className="w-4 h-4 accent-cyan-400 rounded" />
            <span className="text-sm font-semibold" style={{ color: '#94a3b8' }}>
              Show this slide on the homepage
            </span>
          </label>

          {/* Save */}
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm tracking-wider uppercase transition-all"
            style={{
              background:  saving ? '#1e3a5f' : 'linear-gradient(90deg,#00c2ff,#0077b6)',
              color:       '#fff',
              boxShadow:   saving ? 'none' : '0 0 20px #00c2ff44',
              cursor:      saving ? 'not-allowed' : 'pointer',
            }}>
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
              : <><FiSave size={15} /> {isEdit ? 'Update Slide' : 'Create Slide'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main admin page ───────────────────────────────────────────────────────────
export default function HeroBannerAdmin() {
  const [slides,   setSlides]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)   // null | form object
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [error,    setError]    = useState('')
  const [toast,    setToast]    = useState('')
  const [formErr,  setFormErr]  = useState('')

  // ── Fetch all slides ──────────────────────────────────────────────────────
  const fetchSlides = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE}/api/hero-banner/admin`, authHeaders())
      if (data.success) setSlides(data.slides)
      else setError(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchSlides() }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async (form) => {
    setFormErr('')
    // Validate required fields only
    if (!form.badge || !form.title || !form.titleAccent || !form.cta ||
        !form.ctaLink || !form.bg || !form.accentColor || !form.image) {
      setFormErr('Please fill in all required fields (bgImage is optional).')
      return
    }
    setSaving(true)
    try {
      const isEdit = !!form._id
      const url    = isEdit
        ? `${API_BASE}/api/hero-banner/${form._id}`
        : `${API_BASE}/api/hero-banner`
      const method = isEdit ? axios.put : axios.post
      const { data } = await method(url, form, authHeaders())

      if (data.success) {
        setSlides(prev =>
          isEdit
            ? prev.map(s => s._id === data.slide._id ? data.slide : s)
            : [...prev, data.slide]
        )
        setModal(null)
        showToast(isEdit ? 'Slide updated!' : 'Slide created!')
      } else {
        setFormErr(data.message || 'Save failed.')
      }
    } catch (err) {
      setFormErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slide? This cannot be undone.')) return
    setDeleting(id)
    try {
      const { data } = await axios.delete(`${API_BASE}/api/hero-banner/${id}`, authHeaders())
      if (data.success) {
        setSlides(prev => prev.filter(s => s._id !== id))
        showToast('Slide deleted.')
      }
    } catch {
      showToast('Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    try {
      const { data } = await axios.patch(
        `${API_BASE}/api/hero-banner/${id}/toggle`, {}, authHeaders()
      )
      if (data.success) {
        setSlides(prev => prev.map(s => s._id === id ? { ...s, isActive: data.isActive } : s))
        showToast(data.message)
      }
    } catch {
      showToast('Toggle failed.')
    }
  }

  // ── Reorder (local swap + persist order field) ────────────────────────────
  const handleMove = async (index, dir) => {
    const newSlides = [...slides]
    const target    = index + dir
    if (target < 0 || target >= newSlides.length) return
    ;[newSlides[index], newSlides[target]] = [newSlides[target], newSlides[index]]
    newSlides.forEach((s, i) => { s.order = i })
    setSlides(newSlides)
    try {
      await Promise.all([
        axios.put(`${API_BASE}/api/hero-banner/${newSlides[index]._id}`,  { order: newSlides[index].order },  authHeaders()),
        axios.put(`${API_BASE}/api/hero-banner/${newSlides[target]._id}`, { order: newSlides[target].order }, authHeaders()),
      ])
    } catch { /* silent — UI already updated */ }
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#0a0f1e', fontFamily: "'Courier New',monospace" }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-0.5">
              Hero Banner
            </h1>
            <p className="text-xs" style={{ color: '#475569' }}>
              {slides.length} slide{slides.length !== 1 ? 's' : ''} · {slides.filter(s => s.isActive).length} active
            </p>
          </div>
          <button
            onClick={() => { setFormErr(''); setModal({ ...EMPTY_FORM }) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all"
            style={{ background: 'linear-gradient(90deg,#00c2ff,#0077b6)', color: '#fff', boxShadow: '0 0 20px #00c2ff33' }}>
            <FiPlus size={15} /> Add Slide
          </button>
        </div>

        {/* Fetch error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5"
            style={{ background: '#7f1d1d33', border: '1px solid #ef444433' }}>
            <FiAlertCircle size={15} style={{ color: '#ef4444' }} />
            <p className="text-xs font-medium" style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#0d1a2e' }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && slides.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FiImage size={40} style={{ color: '#1e3a5f' }} className="mb-4" />
            <p className="font-bold text-sm" style={{ color: '#334155' }}>No slides yet</p>
            <p className="text-xs mt-1 mb-6" style={{ color: '#1e3a5f' }}>Add your first hero banner slide</p>
            <button onClick={() => { setFormErr(''); setModal({ ...EMPTY_FORM }) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black"
              style={{ background: '#00c2ff22', color: '#00c2ff', border: '1px solid #00c2ff33' }}>
              <FiPlus size={14} /> Add First Slide
            </button>
          </div>
        )}

        {/* Slides list */}
        {!loading && slides.length > 0 && (
          <div className="space-y-3">
            {slides.map((slide, i) => (
              <SlideCard
                key={slide._id}
                slide={slide}
                index={i}
                total={slides.length}
                onEdit={(s) => { setFormErr(''); setModal({ ...s }) }}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onMoveUp={(idx)  => handleMove(idx, -1)}
                onMoveDown={(idx) => handleMove(idx,  1)}
              />
            ))}
          </div>
        )}

        {/* Reorder hint */}
        {slides.length > 1 && (
          <p className="text-center text-xs mt-4" style={{ color: '#1e3a5f' }}>
            Use ↑ ↓ arrows to reorder slides
          </p>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <SlideModal
          slide={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
          error={formErr}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold z-50"
          style={{ background: '#0d1a2e', border: '1px solid #00c2ff33', color: '#00c2ff', boxShadow: '0 0 20px #00c2ff22' }}>
          <FiCheck size={14} /> {toast}
        </div>
      )}
    </div>
  )
}