import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import ToggleSwitch from '../components/ToggleSwitch'

const EMPTY_FORM = {
  image: '', imageMobile: '', link: '/collection/',
  order: 0, isActive: true,
}

const CARD = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}

const ii = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'
const ll = 'block text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1.5'

function SlideModal({ token, onClose, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [loading, setLoading] = useState(false)
  const [desktopFile, setDesktopFile] = useState(null)
  const [mobileFile, setMobileFile] = useState(null)
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const validateDesktopImage = (e, setFile, setFormField) => {
    const f = e.target.files[0]
    if (!f) return
    if (!['image/webp', 'image/jpeg', 'image/png'].includes(f.type)) {
      toast.error('Only WebP, JPEG, or PNG allowed.'); e.target.value = ''; return
    }
    if (f.size > 500 * 1024) {
      toast.error('Image must be under 500KB.'); e.target.value = ''; return
    }
    const img = new Image()
    img.onload = () => {
      if (img.width < 1900 || img.height < 400) {
        toast.error('Desktop image must be at least 1900×400px (wide banner).'); e.target.value = ''; return
      }
      setFile(f); setFormField('image', ''); URL.revokeObjectURL(img.src)
    }
    img.onerror = () => { toast.error('Failed to load image.'); e.target.value = '' }
    img.src = URL.createObjectURL(f)
  }

  const validateMobileImage = (e, setFile, setFormField) => {
    const f = e.target.files[0]
    if (!f) return
    if (!['image/webp', 'image/jpeg', 'image/png'].includes(f.type)) {
      toast.error('Only WebP, JPEG, or PNG allowed.'); e.target.value = ''; return
    }
    if (f.size > 500 * 1024) {
      toast.error('Image must be under 500KB.'); e.target.value = ''; return
    }
    const img = new Image()
    img.onload = () => {
      if (img.width < 600 || img.height < 800) {
        toast.error('Mobile image must be at least 600×800px.'); e.target.value = ''; return
      }
      setFile(f); setFormField('imageMobile', ''); URL.revokeObjectURL(img.src)
    }
    img.onerror = () => { toast.error('Failed to load image.'); e.target.value = '' }
    img.src = URL.createObjectURL(f)
  }

  const imgSrc = desktopFile
    ? URL.createObjectURL(desktopFile)
    : form.image
      ? (form.image.startsWith('http') ? form.image : backendUrl + form.image)
      : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!imgSrc) { toast.error('Desktop image is required.'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', 'Hero Slide')
      fd.append('link', form.link.trim() || '/collection')
      fd.append('order', Number(form.order) || 0)
      fd.append('isActive', Boolean(form.isActive))
      if (desktopFile) fd.append('image', desktopFile)
      if (mobileFile) fd.append('imageMobile', mobileFile)

      const { data } = await axios.post(backendUrl + '/api/hero-banner', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      if (data.success) { toast.success('Slide created!'); onSaved(data.slide); onClose() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #2563eb, #1d4ed8)' }} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">New Hero Slide</h2>
              <p className="text-xs text-gray-400 mt-0.5">Full-width banner shown at top of homepage</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center text-sm">X</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Link */}
            <div>
              <label className={ll}>Link (click anywhere on banner) *</label>
              <input type="text" placeholder="/collection/summer" value={form.link} onChange={e => set('link', e.target.value)} className={ii} />
            </div>

            {/* Desktop Image */}
            <div>
              <label className={ll}>Desktop Image *</label>
              <label className="block cursor-pointer">
                <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 transition-colors bg-gray-50/50">
                  {(desktopFile || form.image) ? (
                    <div className="relative w-24 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      <img src={desktopFile ? URL.createObjectURL(desktopFile) : (form.image.startsWith('http') ? form.image : backendUrl + form.image)} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                    </div>
                  ) : (
                    <div className="w-24 h-10 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700">{desktopFile ? desktopFile.name : 'Click to upload'}</p>
                    <p className="text-[10px] text-gray-400">{desktopFile ? (desktopFile.size / 1024).toFixed(0) + ' KB' : '1920×500px wide · Max 500KB'}</p>
                  </div>
                  {desktopFile && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDesktopFile(null) }} className="text-red-400 hover:text-red-500 text-sm font-bold shrink-0">X</button>
                  )}
                </div>
                <input type="file" accept="image/webp,image/jpeg,image/png" className="hidden" onChange={e => { validateDesktopImage(e, setDesktopFile, key => set(key, '')) }} />
              </label>
            </div>

            {/* Mobile Image */}
            <div>
              <label className={ll}>Mobile Image</label>
              <label className="block cursor-pointer">
                <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 transition-colors bg-gray-50/50">
                  {(mobileFile || form.imageMobile) ? (
                    <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      <img src={mobileFile ? URL.createObjectURL(mobileFile) : (form.imageMobile.startsWith('http') ? form.imageMobile : backendUrl + form.imageMobile)} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                    </div>
                  ) : (
                    <div className="w-10 h-14 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700">{mobileFile ? mobileFile.name : 'Click to upload (optional)'}</p>
                    <p className="text-[10px] text-gray-400">{mobileFile ? (mobileFile.size / 1024).toFixed(0) + ' KB' : '600×800px tall · Falls back to desktop'}</p>
                  </div>
                  {mobileFile && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setMobileFile(null) }} className="text-red-400 hover:text-red-500 text-sm font-bold shrink-0">X</button>
                  )}
                </div>
                <input type="file" accept="image/webp,image/jpeg,image/png" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) { setMobileFile(f); set('imageMobile', '') } }} />
              </label>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Show on homepage</p>
                  <p className="text-[11px] text-gray-400">Slide visible in hero banner slideshow</p>
                </div>
              </div>
              <ToggleSwitch val={form.isActive} onToggle={() => set('isActive', !form.isActive)} />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl text-sm font-bold">Cancel</button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20">
                {loading ? 'Creating...' : 'Create Slide'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ slide, token, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const handleDelete = async () => {
    setLoading(true)
    try {
      const { data } = await axios.delete(backendUrl + '/api/hero-banner/' + slide._id, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) { toast.success('Deleted'); onDeleted(slide._id); onClose() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">X</div>
          <h2 className="text-lg font-bold text-gray-900">Delete Slide?</h2>
          <p className="text-xs text-gray-500 mt-2">This hero slide will be removed permanently.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl text-sm font-bold">Cancel</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold">{loading ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>
  )
}

function SlideCard({ slide, index, total, token, onDelete, onToggle, onMove }) {
  const [toggling, setToggling] = useState(false)
  const handleToggle = async () => {
    setToggling(true)
    try {
      const { data } = await axios.patch(backendUrl + '/api/hero-banner/' + slide._id + '/toggle', {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) { toast.success(data.message); onToggle({ ...slide, isActive: data.isActive }) }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setToggling(false) }
  }
  const st = slide.isActive ? { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e', border: '#bbf7d0', label: 'Active' }
    : { bg: '#f3f4f6', text: '#9ca3af', dot: '#d1d5db', border: '#e5e7eb', label: 'Hidden' }

  return (
    <div style={{ ...CARD, overflow: 'hidden', opacity: !slide.isActive ? 0.6 : 1 }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-[14px]" style={{ background: st.dot }} />
      <div className="flex items-center gap-4 p-4 pl-5">
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={() => onMove(index, index - 1)} disabled={index === 0} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-20 text-gray-500 text-xs">^</button>
          <span className="text-[9px] text-gray-300 font-mono text-center">{index + 1}</span>
          <button onClick={() => onMove(index, index + 1)} disabled={index === total - 1} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-20 text-gray-500 text-xs">v</button>
        </div>
        <div className="relative w-32 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
          <img src={slide.image?.startsWith('http') ? slide.image : backendUrl + slide.image} alt="" className="absolute inset-0 w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
          {slide.imageMobile && <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[7px] px-1 py-0.5 rounded">M</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">Hero Slide #{slide.order !== undefined ? slide.order + 1 : ''}</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: '1px solid ' + st.border, background: st.bg, color: st.text, flexShrink: 0 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />{st.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[10px] text-blue-600 font-mono bg-blue-50 border border-blue-200 px-2 py-0.5 rounded truncate max-w-[220px]">{slide.link}</span>
            {slide.imageMobile && <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">Mobile img</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ToggleSwitch val={slide.isActive} onToggle={handleToggle} disabled={toggling} />
          <button onClick={() => onDelete(slide)} className="text-[10px] font-bold bg-white border border-gray-200 hover:border-red-300 text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function HeroBannerAdmin({ token }) {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteSlide, setDeleteSlide] = useState(null)

  const fetchSlides = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/hero-banner/admin', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) setSlides(data.slides ?? [])
      else toast.error(data.message)
    } catch (err) { toast.error('Failed to load'); console.error(err) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchSlides() }, [fetchSlides])

  const onSaved = (slide) => {
    setSlides(prev => [...prev, slide].sort((a, b) => a.order - b.order))
  }
  const onToggle = (slide) => setSlides(prev => prev.map(s => s._id === slide._id ? slide : s))
  const onDeleted = (id) => setSlides(prev => prev.filter(s => s._id !== id))

  const handleMove = async (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= slides.length) return
    const reordered = [...slides]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    reordered.forEach((s, i) => { s.order = i })
    setSlides(reordered)
    try {
      await Promise.all([
        axios.put(backendUrl + '/api/hero-banner/' + reordered[fromIdx]._id, { order: reordered[fromIdx].order }, { headers: { Authorization: `Bearer ${token}` } }),
        axios.put(backendUrl + '/api/hero-banner/' + reordered[toIdx]._id, { order: reordered[toIdx].order }, { headers: { Authorization: `Bearer ${token}` } }),
      ])
    } catch { fetchSlides() }
  }

  const activeCount = slides.filter(s => s.isActive).length

  return (
    <div style={{ maxWidth: 860, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showModal && <SlideModal token={token} onClose={() => setShowModal(false)} onSaved={onSaved} />}
      {deleteSlide && <DeleteModal slide={deleteSlide} token={token} onClose={() => setDeleteSlide(null)} onDeleted={onDeleted} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Hero Banner</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            {loading ? 'Loading...' : activeCount + ' active \u00B7 ' + (slides.length - activeCount) + ' hidden \u00B7 ' + slides.length + ' total'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchSlides} disabled={loading} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Refresh</button>
          <button onClick={() => setShowModal(true)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>+ Add Slide</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ ...CARD, height: 72, background: '#f9fafb' }} />)}
        </div>
      ) : slides.length === 0 ? (
        <div style={{ ...CARD, padding: 50, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No slides yet</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Create your first hero banner slide.</p>
          <button onClick={() => setShowModal(true)} style={{ marginTop: 14, padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>+ Add First Slide</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slides.map((slide, idx) => (
            <SlideCard key={slide._id} slide={slide} index={idx} total={slides.length} token={token} onDelete={setDeleteSlide} onToggle={onToggle} onMove={handleMove} />
          ))}
        </div>
      )}
    </div>
  )
}
