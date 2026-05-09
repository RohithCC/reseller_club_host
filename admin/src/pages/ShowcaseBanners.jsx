// admin/src/pages/ShowcaseBanners.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin page for managing homepage showcase banners.
// Add to your admin sidebar/router as:  /admin/showcase-banners
//
// Features:
//   ✅ List all banners (active + inactive) with live preview thumbnail
//   ✅ Create new banner via modal (all fields)
//   ✅ Edit existing banner via modal (pre-filled)
//   ✅ Delete with confirmation
//   ✅ Toggle active/inactive per banner
//   ✅ Drag-to-reorder (↑↓ arrow buttons — no extra library needed)
//   ✅ Live image URL preview inside modal
//   ✅ Preset overlay gradient selector
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'

// ─── Overlay gradient presets ─────────────────────────────────────────────────
const OVERLAY_PRESETS = [
  { label: 'Slate',    value: 'from-slate-900/85 via-slate-900/50 to-transparent'  },
  { label: 'Blue',     value: 'from-blue-900/85 via-blue-900/50 to-transparent'    },
  { label: 'Orange',   value: 'from-orange-900/85 via-orange-900/50 to-transparent'},
  { label: 'Green',    value: 'from-green-900/85 via-green-900/50 to-transparent'  },
  { label: 'Red',      value: 'from-red-900/85 via-red-900/50 to-transparent'      },
  { label: 'Violet',   value: 'from-violet-900/85 via-violet-900/50 to-transparent'},
  { label: 'Indigo',   value: 'from-indigo-900/85 via-indigo-900/50 to-transparent'},
  { label: 'Rose',     value: 'from-rose-900/85 via-rose-900/50 to-transparent'    },
  { label: 'Black',    value: 'from-black/90 via-black/60 to-transparent'          },
]

// ─── Blank form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title:    '',
  subtitle: '',
  cta:      'Shop Now',
  link:     '/collection/',
  image:    '',
  overlay:  'from-slate-900/85 via-slate-900/50 to-transparent',
  order:    0,
  isActive: true,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inp = "w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.06] transition-all"
const lbl = "block text-[10px] font-black text-white/35 uppercase tracking-[0.1em] mb-1.5"

// ─────────────────────────────────────────────────────────────────────────────
// BANNER FORM MODAL (Create + Edit)
// ─────────────────────────────────────────────────────────────────────────────
function BannerModal({ banner, token, onClose, onSaved }) {
  const isEdit = Boolean(banner?._id)
  const [form, setForm]       = useState(banner ? { ...banner } : { ...EMPTY_FORM })
  const [loading, setLoading] = useState(false)
  const [imgOk, setImgOk]     = useState(Boolean(banner?.image))

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.subtitle.trim() || !form.link.trim() || !form.image.trim()) {
      toast.error('Title, subtitle, link and image URL are required.')
      return
    }
    setLoading(true)
    try {
      const url = isEdit
        ? `${backendUrl}/api/showcase/admin/banners/${banner._id}`
        : `${backendUrl}/api/showcase/admin/banners`

      const { data } = isEdit
        ? await axios.put(url, form, { headers: { token } })
        : await axios.post(url, form, { headers: { token } })

      if (data.success) {
        toast.success(isEdit ? 'Banner updated!' : 'Banner created!')
        onSaved(data.banner)
        onClose()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-md flex items-center justify-center px-4 py-6">
      <div className="relative bg-[#080f1a] border border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

        {/* Top accent line */}
        <div className="h-0.5 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)' }} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {isEdit ? '✏️ Edit Banner' : '✨ New Banner'}
              </h2>
              <p className="text-xs text-white/30 mt-0.5">
                {isEdit ? `Editing: ${banner.title}` : 'Add a new showcase banner to the homepage'}
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/40 hover:text-white flex items-center justify-center transition-all">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Two-column: form left, preview right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* ── Left: form fields ── */}
              <div className="space-y-4">

                <div>
                  <label className={lbl}>Banner Title *</label>
                  <input type="text" placeholder="Motors & Motor Drivers"
                    value={form.title} onChange={e => set('title', e.target.value)}
                    className={inp} maxLength={120} required />
                  <p className="text-[9px] text-white/20 mt-1 text-right">{form.title.length}/120</p>
                </div>

                <div>
                  <label className={lbl}>Subtitle *</label>
                  <textarea rows={3} placeholder="DC, Geared, Servo motors + L298N drivers…"
                    value={form.subtitle} onChange={e => set('subtitle', e.target.value)}
                    className={inp + ' resize-none'} maxLength={300} required />
                  <p className="text-[9px] text-white/20 mt-1 text-right">{form.subtitle.length}/300</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>CTA Button Text</label>
                    <input type="text" placeholder="Shop Now"
                      value={form.cta} onChange={e => set('cta', e.target.value)}
                      className={inp} maxLength={40} />
                  </div>
                  <div>
                    <label className={lbl}>Display Order</label>
                    <input type="number" min={0} step={1}
                      value={form.order} onChange={e => set('order', Number(e.target.value))}
                      className={inp} />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Collection / Page Link *</label>
                  <input type="text" placeholder="/collection/Motor"
                    value={form.link} onChange={e => set('link', e.target.value)}
                    className={inp} required />
                  <p className="text-[9px] text-white/20 mt-1">
                    e.g. /collection/Sensors%20%26%20Modules · /products · /deals
                  </p>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-white/80">Show on homepage</p>
                    <p className="text-[10px] text-white/30 mt-0.5">Inactive banners are hidden from visitors</p>
                  </div>
                  <button type="button"
                    onClick={() => set('isActive', !form.isActive)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.isActive ? 'bg-cyan-500' : 'bg-white/10'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${form.isActive ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {/* ── Right: image + overlay ── */}
              <div className="space-y-4">

                {/* Image URL input */}
                <div>
                  <label className={lbl}>Image URL *</label>
                  <input type="url" placeholder="https://…/banner.jpg"
                    value={form.image}
                    onChange={e => { set('image', e.target.value); setImgOk(false) }}
                    className={inp} required />
                  <p className="text-[9px] text-white/20 mt-1">Recommended: 1400×440px · JPG or WebP</p>
                </div>

                {/* Live preview */}
                <div className="relative rounded-2xl overflow-hidden h-36 bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  {form.image ? (
                    <>
                      <img
                        src={form.image}
                        alt="Preview"
                        onLoad={() => setImgOk(true)}
                        onError={() => setImgOk(false)}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imgOk ? 'opacity-100' : 'opacity-0'}`}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-r ${form.overlay}`} />
                      <div className="absolute bottom-2 left-3 right-3 z-10">
                        <p className="text-white font-black text-sm leading-snug line-clamp-1 drop-shadow-lg">{form.title || 'Banner Title'}</p>
                        <p className="text-white/70 text-[10px] mt-0.5 line-clamp-1">{form.subtitle || 'Subtitle preview'}</p>
                      </div>
                      {!imgOk && (
                        <p className="text-white/20 text-xs z-10">Loading preview…</p>
                      )}
                    </>
                  ) : (
                    <p className="text-white/20 text-xs">Enter an image URL to preview</p>
                  )}
                </div>

                {/* Overlay gradient selector */}
                <div>
                  <label className={lbl}>Overlay Gradient</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OVERLAY_PRESETS.map(p => (
                      <button type="button" key={p.value}
                        onClick={() => set('overlay', p.value)}
                        className={`py-2 px-2 rounded-xl border text-[10px] font-bold transition-all ${
                          form.overlay === p.value
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/15'
                        }`}>
                        {p.label}
                      </button>
                    ))}
                    {/* Custom */}
                    <div className="col-span-3">
                      <input type="text" placeholder="or type custom Tailwind gradient classes…"
                        value={OVERLAY_PRESETS.some(p => p.value === form.overlay) ? '' : form.overlay}
                        onChange={e => set('overlay', e.target.value)}
                        className={inp + ' text-[11px]'} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-white/[0.05]">
              <button type="button" onClick={onClose}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 hover:text-white py-3 rounded-xl text-sm font-bold transition-all">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEdit ? 'Saving…' : 'Creating…'}</>
                  : isEdit ? '→ Save Changes' : '→ Create Banner'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE CONFIRMATION MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DeleteModal({ banner, token, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/showcase/admin/banners/${banner._id}`,
        { headers: { token } }
      )
      if (data.success) {
        toast.success('Banner deleted')
        onDeleted(banner._id)
        onClose()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-md flex items-center justify-center px-4">
      <div className="bg-[#080f1a] border border-red-500/20 rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🗑️</div>
          <h2 className="text-lg font-black text-white">Delete Banner?</h2>
          <p className="text-xs text-white/40 mt-2 leading-relaxed">
            "<span className="text-white/60 font-bold">{banner.title}</span>" will be permanently removed from the homepage.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 hover:text-white py-3 rounded-xl text-sm font-bold transition-all">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
              : '🗑️ Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BANNER ROW CARD
// ─────────────────────────────────────────────────────────────────────────────
function BannerCard({ banner, index, total, token, onEdit, onDelete, onToggle, onMove }) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/showcase/admin/banners/${banner._id}/toggle`,
        {},
        { headers: { token } }
      )
      if (data.success) {
        toast.success(data.message)
        onToggle(data.banner)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className={`relative bg-white/[0.03] border rounded-2xl overflow-hidden transition-all duration-200 ${
      banner.isActive ? 'border-white/[0.08] hover:border-white/15' : 'border-white/[0.04] opacity-60'
    }`}>
      {/* Status stripe */}
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${banner.isActive ? 'bg-cyan-500' : 'bg-white/10'}`} />

      <div className="flex items-center gap-4 p-4 pl-5">

        {/* Order controls */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={() => onMove(index, index - 1)} disabled={index === 0}
            className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] disabled:opacity-20 text-white/50 hover:text-white text-xs flex items-center justify-center transition-all">
            ↑
          </button>
          <span className="text-[9px] text-white/20 font-mono text-center">{index + 1}</span>
          <button onClick={() => onMove(index, index + 1)} disabled={index === total - 1}
            className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] disabled:opacity-20 text-white/50 hover:text-white text-xs flex items-center justify-center transition-all">
            ↓
          </button>
        </div>

        {/* Thumbnail */}
        <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
          <img src={banner.image} alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { e.target.src = 'https://placehold.co/96x64?text=📷' }} />
          <div className={`absolute inset-0 bg-gradient-to-r ${banner.overlay} opacity-60`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-black text-white/90 truncate">{banner.title}</p>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${
              banner.isActive
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25'
                : 'bg-white/[0.05] text-white/25 border-white/[0.08]'
            }`}>
              {banner.isActive ? 'Active' : 'Hidden'}
            </span>
          </div>
          <p className="text-[11px] text-white/35 mt-0.5 line-clamp-1">{banner.subtitle}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-[10px] text-cyan-400/70 font-mono bg-cyan-500/[0.08] border border-cyan-500/15 px-2 py-0.5 rounded-lg">
              {banner.link}
            </span>
            <span className="text-[10px] text-white/20 font-bold">CTA: "{banner.cta}"</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle */}
          <button onClick={handleToggle} disabled={toggling} title={banner.isActive ? 'Deactivate' : 'Activate'}
            className={`relative w-10 h-5 rounded-full transition-all duration-300 ${banner.isActive ? 'bg-cyan-500' : 'bg-white/10'} ${toggling ? 'opacity-50' : ''}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${banner.isActive ? 'left-5' : 'left-0.5'}`} />
          </button>

          <button onClick={() => onEdit(banner)}
            className="text-[10px] font-black bg-white/[0.05] hover:bg-cyan-500/20 text-white/50 hover:text-cyan-300 border border-white/[0.08] hover:border-cyan-500/30 px-3 py-1.5 rounded-xl transition-all">
            Edit
          </button>
          <button onClick={() => onDelete(banner)}
            className="text-[10px] font-black bg-white/[0.05] hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 px-3 py-1.5 rounded-xl transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ShowcaseBanners = ({ token }) => {
  const [banners,     setBanners]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [editBanner,  setEditBanner]  = useState(null)   // null=closed | {} =create | banner=edit
  const [deleteBanner,setDeleteBanner]= useState(null)
  const [reordering,  setReordering]  = useState(false)

  // ── Fetch all banners (admin view) ────────────────────────────────────────
  const fetchBanners = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/showcase/admin/banners`,
        { headers: { token } }
      )
      if (data.success) setBanners(data.banners ?? [])
      else toast.error(data.message)
    } catch (err) {
      toast.error('Failed to load banners')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  // ── Patch helpers (avoid full refetch) ───────────────────────────────────
  const onSaved = (banner) => {
    setBanners(prev => {
      const exists = prev.find(b => b._id === banner._id)
      return exists
        ? prev.map(b => b._id === banner._id ? banner : b)
        : [...prev, banner].sort((a, b) => a.order - b.order)
    })
  }

  const onToggle = (banner) => {
    setBanners(prev => prev.map(b => b._id === banner._id ? banner : b))
  }

  const onDeleted = (id) => {
    setBanners(prev => prev.filter(b => b._id !== id))
  }

  // ── Move banner ↑↓ and save new order to backend ─────────────────────────
  const handleMove = async (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= banners.length) return
    const reordered = [...banners]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setBanners(reordered)  // optimistic update

    setReordering(true)
    try {
      await axios.put(
        `${backendUrl}/api/showcase/admin/reorder`,
        { ids: reordered.map(b => b._id) },
        { headers: { token } }
      )
      toast.success('Order saved')
    } catch (err) {
      toast.error('Failed to save order — refreshing')
      fetchBanners()  // revert on failure
    } finally {
      setReordering(false)
    }
  }

  const activeCount   = banners.filter(b => b.isActive).length
  const inactiveCount = banners.length - activeCount

  return (
    <>
      {/* Modals */}
      {editBanner !== null && (
        <BannerModal
          banner={editBanner._id ? editBanner : null}
          token={token}
          onClose={() => setEditBanner(null)}
          onSaved={onSaved}
        />
      )}
      {deleteBanner && (
        <DeleteModal
          banner={deleteBanner}
          token={token}
          onClose={() => setDeleteBanner(null)}
          onDeleted={onDeleted}
        />
      )}

      <div className="space-y-5 min-h-screen">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Showcase Banners</h1>
            <p className="text-sm text-white/30 mt-1">
              {loading ? 'Loading…' : (
                <>
                  <span className="text-cyan-400 font-bold">{activeCount}</span> active ·{' '}
                  <span className="text-white/40">{inactiveCount}</span> hidden ·{' '}
                  {reordering && <span className="text-amber-400 font-bold animate-pulse">Saving order…</span>}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchBanners} disabled={loading}
              className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-white/50 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30">
              <span className={`text-base ${loading ? 'animate-spin inline-block' : ''}`}>⟳</span>
              Refresh
            </button>
            <button onClick={() => setEditBanner({})}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-cyan-500/20">
              ✨ Add Banner
            </button>
          </div>
        </div>

        {/* ── Info strip ────────────────────────────────────────────────── */}
        <div className="bg-cyan-500/[0.06] border border-cyan-500/[0.12] rounded-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-cyan-400 text-lg flex-shrink-0">💡</span>
          <p className="text-xs text-cyan-200/60 leading-relaxed">
            Active banners are shown on the homepage in the order listed below.
            Use the <span className="font-black text-cyan-300">↑↓ arrows</span> to reorder.
            Toggle the switch to show/hide a banner without deleting it.
          </p>
        </div>

        {/* ── Banner list ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4 opacity-20">🖼️</div>
            <p className="text-white/30 text-sm font-bold">No banners yet</p>
            <p className="text-white/15 text-xs mt-1">Click "Add Banner" to create your first showcase banner.</p>
            <button onClick={() => setEditBanner({})}
              className="mt-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-cyan-500/20 inline-flex items-center gap-2">
              ✨ Add First Banner
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, idx) => (
              <BannerCard
                key={banner._id}
                banner={banner}
                index={idx}
                total={banners.length}
                token={token}
                onEdit={setEditBanner}
                onDelete={setDeleteBanner}
                onToggle={onToggle}
                onMove={handleMove}
              />
            ))}
          </div>
        )}

        {/* ── Homepage preview hint ─────────────────────────────────────── */}
        {!loading && banners.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-4">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.12em] mb-2">
              Visitor-facing banner order
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {banners.filter(b => b.isActive).map((b, i) => (
                <div key={b._id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-white/15">→</span>}
                  <span className="text-[10px] bg-white/[0.04] border border-white/[0.07] text-white/40 px-2 py-1 rounded-lg font-medium truncate max-w-[140px]">
                    {b.title}
                  </span>
                </div>
              ))}
              {activeCount === 0 && (
                <p className="text-xs text-amber-400/60">⚠️ No active banners — homepage will use static fallback.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ShowcaseBanners