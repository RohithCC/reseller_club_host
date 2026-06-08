import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import ToggleSwitch from '../components/ToggleSwitch'

const EMPTY_FORM = {
  title: '', description: '',
  image: '', order: 0, isActive: true,
  bgColor: 'bg-cyan-100',
  buttons: [{ label: '', link: '', icon: '' }],
}

const BG_COLORS = [
  { val: 'bg-white',        label: 'White'      },
  { val: 'bg-gray-50',      label: 'Gray 50'    },
  { val: 'bg-slate-100',    label: 'Slate 100'  },
  { val: 'bg-cyan-100',     label: 'Cyan 100'   },
  { val: 'bg-blue-50',      label: 'Blue 50'    },
  { val: 'bg-indigo-50',    label: 'Indigo 50'  },
  { val: 'bg-amber-50',     label: 'Amber 50'   },
  { val: 'bg-pink-50',      label: 'Pink 50'    },
  { val: 'bg-green-50',     label: 'Green 50'   },
  { val: 'bg-purple-50',    label: 'Purple 50'  },
  { val: 'bg-orange-50',    label: 'Orange 50'  },
  { val: 'bg-rose-50',      label: 'Rose 50'    },
]

const CARD = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}

const ii = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'
const ll = 'block text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1.5'

function BannerModal({ token, onClose, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [loading, setLoading] = useState(false)
  const [desktopFile, setDesktopFile] = useState(null)
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const setBtn = (idx, key, val) =>
    setForm(f => {
      const btns = [...(f.buttons || [])]
      if (!btns[idx]) btns[idx] = { label: '', link: '', icon: '' }
      btns[idx] = { ...btns[idx], [key]: val }
      return { ...f, buttons: btns }
    })

  const validateAndSetImage = (e, setFile, setFormField) => {
    const f = e.target.files[0]
    if (!f) return

    if (!['image/webp', 'image/jpeg', 'image/png'].includes(f.type)) {
      toast.error('Only WebP, JPEG, or PNG allowed.')
      e.target.value = ''
      return
    }

    if (f.size > 200 * 1024) {
      toast.error('Image must be under 200KB.')
      e.target.value = ''
      return
    }

    const img = new Image()
    img.onload = () => {
      if (img.width < 500 || img.height < 500) {
        toast.error('Image must be at least 500×500px.')
        e.target.value = ''
        return
      }
      setFile(f)
      setFormField('image', '')
      URL.revokeObjectURL(img.src)
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
    if (!imgSrc) {
      toast.error('Desktop image is required.')
      return
    }
    setLoading(true)
    try {
      const url = backendUrl + '/api/showcase/admin/banners'

      let payload
      let headers = { token }
      if (desktopFile) {
        const fd = new FormData()
        fd.append('title', form.title.trim() || 'Banner')
        fd.append('description', form.description?.trim() || '')
        fd.append('buttons', JSON.stringify(form.buttons || []))
        fd.append('bgColor', form.bgColor || 'bg-white')
        fd.append('order', Number(form.order) || 0)
        fd.append('isActive', Boolean(form.isActive))
        fd.append('image', desktopFile)
        payload = fd
        headers = { token, 'Content-Type': 'multipart/form-data' }
      } else {
        payload = {
          title: form.title.trim() || 'Banner',
          description: form.description?.trim() || '',
          buttons: form.buttons || [],
          bgColor: form.bgColor || 'bg-white',
          image: form.image.startsWith('http') ? form.image : (form.image || ''),
          order: Number(form.order) || 0,
          isActive: Boolean(form.isActive),
        }
      }

      const { data } = await axios.post(url, payload, { headers })
      if (data.success) {
        toast.success('Banner created!')
        onSaved(data.banner)
        onClose()
      } else toast.error(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #2563eb, #1d4ed8)' }} />
        <div className="flex gap-0 min-h-[500px]">

          {/* ── LEFT: FORM ────────────────────────── */}
          <div className="flex-1 p-6 pb-4">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">New CTA Banner</h2>
                <p className="text-xs text-gray-400 mt-0.5">Configure the storefront CTA section</p>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center text-sm">X</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Title */}
              <div>
                <label className={ll}>Title *</label>
                <input type="text" placeholder="Get the Amulya App" value={form.title} onChange={e => set('title', e.target.value)} className={ii} maxLength={120} />
              </div>

              {/* Description */}
              <div>
                <label className={ll}>Description</label>
                <textarea placeholder="Download our app for exclusive deals, faster checkout, and order tracking on the go."
                  value={form.description} onChange={e => set('description', e.target.value)}
                  className={`${ii} min-h-[72px] resize-none`} maxLength={500} rows={3} />
              </div>

              {/* Background Color */}
              <div>
                <label className={ll}>Background Color</label>
                <div className="flex flex-wrap gap-2">
                  {BG_COLORS.map(c => (
                    <button key={c.val} type="button" onClick={() => set('bgColor', c.val)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${c.val} ${form.bgColor === c.val ? 'border-blue-500 ring-2 ring-blue-200 scale-110' : 'border-gray-200 hover:border-gray-300'}`}
                      title={c.label} />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{BG_COLORS.find(c => c.val === form.bgColor)?.label || form.bgColor}</p>
              </div>

              {/* CTA Button */}
              <div>
                <label className={ll}>CTA Button</label>
                <div className="flex gap-2">
                  <input type="text"
                    placeholder="Shop Now"
                    value={form.buttons?.[0]?.label || ''}
                    onChange={e => setBtn(0, 'label', e.target.value)}
                    className={`${ii} flex-[3]`} maxLength={40} />
                  <input type="text"
                    placeholder="/collection/category"
                    value={form.buttons?.[0]?.link || ''}
                    onChange={e => setBtn(0, 'link', e.target.value)}
                    className={`${ii} flex-[5]`} />
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className={ll}>Image *</label>
                <label className="block cursor-pointer">
                  <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 transition-colors bg-gray-50/50">
                    {imgSrc ? (
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <img src={imgSrc} alt="" className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }} />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-300 text-lg">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700">{desktopFile ? desktopFile.name : 'Click to upload'}</p>
                      <p className="text-[10px] text-gray-400">{desktopFile ? (desktopFile.size / 1024).toFixed(0) + ' KB' : 'WebP · 500×500px · Max 200KB'}</p>
                    </div>
                    {desktopFile && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setDesktopFile(null) }}
                        className="text-red-400 hover:text-red-500 text-sm font-bold shrink-0">X</button>
                    )}
                  </div>
                  <input type="file" accept="image/webp,image/jpeg,image/png" className="hidden" onChange={e => { validateAndSetImage(e, setDesktopFile, set) }} />
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
                    <p className="text-sm font-bold text-gray-900">Show on site</p>
                    <p className="text-[11px] text-gray-400">Visitors see active banners only</p>
                  </div>
                </div>
                <ToggleSwitch val={form.isActive} onToggle={() => set('isActive', !form.isActive)} />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl text-sm font-bold">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20">
                  {loading ? 'Creating...' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT: LIVE PREVIEW ────────────────── */}
          <div className="w-[360px] shrink-0 bg-gray-50 border-l border-gray-200 p-6 hidden lg:block">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-4">Preview</p>

            <div className={`rounded-xl overflow-hidden border border-gray-200 ${form.bgColor}`}>
                <div className="grid grid-cols-5 gap-0 min-h-[200px]">
                  <div className="col-span-3 flex flex-col justify-center p-5">
                    <h3 className="text-sm font-black text-gray-900 mb-1 leading-tight">
                      {form.title || 'Get the Amulya App'}
                    </h3>
                    <p className="text-[10px] text-gray-500 mb-3 leading-relaxed line-clamp-3">
                      {form.description || 'Download our app for exclusive deals and faster checkout.'}
                    </p>
                    <div className="flex gap-2">
                      {form.buttons?.[0]?.label ? (
                        <div className="flex items-center gap-1 text-[9px] font-bold bg-gray-900 text-white px-2.5 py-1.5 rounded-lg">
                          <span className="truncate max-w-[80px]">{form.buttons[0].label}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-gray-400 italic">Add button</div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-end justify-center relative">
                    {imgSrc ? (
                      <img src={imgSrc} alt="" className="max-h-[160px] object-contain" />
                    ) : (
                      <div className="w-full h-full min-h-[120px] bg-gray-200 rounded-tl-xl flex items-center justify-center text-[9px] text-gray-400">Image</div>
                    )}
                  </div>
                </div>
              </div>

            {!form.isActive && (
              <div className="mt-2 text-center text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-1.5">Hidden — not visible to visitors</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ banner, token, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const handleDelete = async () => {
    setLoading(true)
    try {
      const { data } = await axios.delete(backendUrl + '/api/showcase/admin/banners/' + banner._id, { headers: { token } })
      if (data.success) { toast.success('Deleted'); onDeleted(banner._id); onClose() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">X</div>
          <h2 className="text-lg font-bold text-gray-900">Delete Banner?</h2>
          <p className="text-xs text-gray-500 mt-2">"<span className="font-bold">{banner.title}</span>" will be removed permanently.</p>
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

function BannerCard({ banner, index, total, token, onDelete, onToggle, onMove }) {
  const [toggling, setToggling] = useState(false)
  const handleToggle = async () => {
    setToggling(true)
    try {
      const { data } = await axios.put(backendUrl + '/api/showcase/admin/banners/' + banner._id + '/toggle', {}, { headers: { token } })
      if (data.success) { toast.success(data.message); onToggle(data.banner) }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setToggling(false) }
  }
  const st = banner.isActive ? { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e', border: '#bbf7d0', label: 'Active' }
    : { bg: '#f3f4f6', text: '#9ca3af', dot: '#d1d5db', border: '#e5e7eb', label: 'Hidden' }

  const hasButtons = Array.isArray(banner.buttons) && banner.buttons.some(b => b.label)

  return (
    <div style={{ ...CARD, overflow: 'hidden', opacity: !banner.isActive ? 0.6 : 1 }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-[14px]" style={{ background: st.dot }} />
      <div className="flex items-center gap-4 p-4 pl-5">
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={() => onMove(index, index - 1)} disabled={index === 0} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-20 text-gray-500 text-xs">^</button>
          <span className="text-[9px] text-gray-300 font-mono text-center">{index + 1}</span>
          <button onClick={() => onMove(index, index + 1)} disabled={index === total - 1} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-20 text-gray-500 text-xs">v</button>
        </div>
        <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
          <img src={banner.image} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 truncate">{banner.title}</p>
            {banner.bgColor && banner.bgColor !== 'bg-white' && (
              <span className={`inline-block w-3 h-3 rounded ${banner.bgColor} border border-gray-300 shrink-0 mt-0.5`} title={banner.bgColor} />
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: '1px solid ' + st.border, background: st.bg, color: st.text, flexShrink: 0 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />{st.label}
            </span>
          </div>
          {hasButtons ? (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{banner.buttons[0].label}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-[10px] text-blue-600 font-mono bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">{banner.buttons?.[0]?.link || '—'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ToggleSwitch val={banner.isActive} onToggle={handleToggle} disabled={toggling} />
          <button onClick={() => onDelete(banner)} className="text-[10px] font-bold bg-white border border-gray-200 hover:border-red-300 text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  )
}

const ShowcaseBanners = ({ token }) => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteBanner, setDeleteBanner] = useState(null)
  const [reordering, setReordering] = useState(false)

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/showcase/admin/banners', { headers: { token } })
      if (data.success) setBanners(data.banners ?? [])
      else toast.error(data.message)
    } catch (err) { toast.error('Failed to load'); console.error(err) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  const onSaved = (banner) => {
    setBanners(prev => {
      const exists = prev.find(b => b._id === banner._id)
      return exists ? prev.map(b => b._id === banner._id ? banner : b) : [...prev, banner].sort((a, b) => a.order - b.order)
    })
  }
  const onToggle = (banner) => setBanners(prev => prev.map(b => b._id === banner._id ? banner : b))
  const onDeleted = (id) => setBanners(prev => prev.filter(b => b._id !== id))

  const handleMove = async (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= banners.length) return
    const reordered = [...banners]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setBanners(reordered)
    setReordering(true)
    try {
      await axios.put(backendUrl + '/api/showcase/admin/reorder', { ids: reordered.map(b => b._id) }, { headers: { token } })
      toast.success('Order saved')
    } catch (err) { toast.error('Failed to save order'); fetchBanners() }
    finally { setReordering(false) }
  }

  const activeCount = banners.filter(b => b.isActive).length

  return (
    <div style={{ maxWidth: 1000, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showModal && <BannerModal token={token} onClose={() => setShowModal(false)} onSaved={onSaved} />}
      {deleteBanner && <DeleteModal banner={deleteBanner} token={token} onClose={() => setDeleteBanner(null)} onDeleted={onDeleted} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>CTA Banners</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            {loading ? 'Loading...' : activeCount + ' active \u00B7 ' + (banners.length - activeCount) + ' hidden \u00B7 ' + banners.length + ' total'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchBanners} disabled={loading} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Refresh</button>
          <button onClick={() => setShowModal(true)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>+ Add Banner</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ ...CARD, height: 72, background: '#f9fafb' }} />)}
        </div>
      ) : banners.length === 0 ? (
        <div style={{ ...CARD, padding: 50, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No banners yet</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Create your first banner.</p>
          <button onClick={() => setShowModal(true)} style={{ marginTop: 14, padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>+ Add First Banner</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {banners.map((banner, idx) => (
            <BannerCard key={banner._id} banner={banner} index={idx} total={banners.length} token={token} onDelete={setDeleteBanner} onToggle={onToggle} onMove={handleMove} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ShowcaseBanners
