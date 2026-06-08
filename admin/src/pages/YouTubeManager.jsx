import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import ToggleSwitch from '../components/ToggleSwitch'

const EMPTY_FORM = { videoId: '', title: '', category: 'tutorials', isActive: true }

const CARD = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}

const ii = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'
const ll = 'block text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1.5'

// ─── ADD / EDIT MODAL ────────────────────────────────────────────────────────
function VideoModal({ token, onClose, onSaved, editVideo }) {
  const [form, setForm] = useState(editVideo ? { ...editVideo } : { ...EMPTY_FORM })
  const [loading, setLoading] = useState(false)
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.videoId.trim()) { toast.error('YouTube Video ID is required.'); return }
    setLoading(true)
    try {
      const payload = {
        videoId: form.videoId.trim(),
        title: form.title.trim(),
        category: form.category,
        isActive: Boolean(form.isActive),
      }
      let data
      if (editVideo) {
        const res = await axios.put(backendUrl + '/api/youtube-videos/' + editVideo._id, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        data = res.data
      } else {
        const res = await axios.post(backendUrl + '/api/youtube-videos', payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        data = res.data
      }
      if (data.success) {
        toast.success(editVideo ? 'Video updated!' : 'Video added!')
        onSaved(data.video)
        onClose()
      } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setLoading(false) }
  }

  const thumbUrl = form.videoId ? `https://img.youtube.com/vi/${form.videoId}/mqdefault.jpg` : null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #2563eb, #1d4ed8)' }} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{editVideo ? 'Edit Video' : 'Add YouTube Video'}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Videos appear in the YouTube Reels section on the homepage</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center text-sm">X</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Video ID */}
            <div>
              <label className={ll}>YouTube Video ID *</label>
              <div className="flex gap-2">
                <span className="text-xs text-gray-400 mt-1 font-mono flex-shrink-0 hidden sm:block leading-[42px]">youtube.com/watch?v=</span>
                <input type="text" placeholder="dQw4w9WgXcQ" value={form.videoId} onChange={e => set('videoId', e.target.value)} className={ii} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Copy the ID from any YouTube URL: <code className="bg-gray-100 px-1 rounded">youtube.com/watch?v=<strong className="text-blue-600">VIDEO_ID</strong></code></p>
            </div>

            {/* Thumbnail preview */}
            {thumbUrl && (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 bg-gray-50/50">
                <p className="text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-wide">Preview</p>
                <img src={thumbUrl} alt="" className="w-full max-h-[180px] object-cover rounded-lg"
                  onError={e => { e.target.style.display = 'none' }} />
              </div>
            )}

            {/* Title */}
            <div>
              <label className={ll}>Title</label>
              <input type="text" placeholder="Getting Started with Arduino" value={form.title} onChange={e => set('title', e.target.value)} className={ii} maxLength={200} />
            </div>

            {/* Category */}
            <div>
              <label className={ll}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={ii}>
                <option value="tutorials">📚 Tutorials</option>
                <option value="reviews">⭐ Customer Reviews</option>
              </select>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Show on homepage</p>
                <p className="text-[11px] text-gray-400">Video appears in the YouTube Reels section</p>
              </div>
              <ToggleSwitch val={form.isActive} onToggle={() => set('isActive', !form.isActive)} />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl text-sm font-bold">Cancel</button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20">
                {loading ? 'Saving...' : editVideo ? 'Update Video' : 'Add Video'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── DELETE CONFIRM MODAL ────────────────────────────────────────────────────
function DeleteModal({ video, token, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const handleDelete = async () => {
    setLoading(true)
    try {
      const { data } = await axios.delete(backendUrl + '/api/youtube-videos/' + video._id, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) { toast.success('Deleted'); onDeleted(video._id); onClose() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
          <h2 className="text-lg font-bold text-gray-900">Delete Video?</h2>
          <p className="text-xs text-gray-500 mt-2">This video will be removed from the homepage permanently.</p>
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

// ─── VIDEO CARD ──────────────────────────────────────────────────────────────
function VideoCard({ video, onEdit, onDelete, onToggle }) {
  const [toggling, setToggling] = useState(false)
  const thumbUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
  const st = video.isActive
    ? { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e', border: '#bbf7d0', label: 'Active' }
    : { bg: '#f3f4f6', text: '#9ca3af', dot: '#d1d5db', border: '#e5e7eb', label: 'Hidden' }
  const catLabel = video.category === 'tutorials' ? '📚 Tutorial' : '⭐ Review'

  return (
    <div style={{ ...CARD, overflow: 'hidden', opacity: video.isActive ? 1 : 0.6 }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-[14px]" style={{ background: st.dot }} />
      <div className="flex items-center gap-4 p-4 pl-5">
        {/* Thumbnail */}
        <div className="relative w-28 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
          <img src={thumbUrl} alt="" className="absolute inset-0 w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center shadow-md opacity-80">
              <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 ml-0.5"><polygon points="5,3 19,12 5,21" /></svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 truncate max-w-[220px]">{video.title || 'Untitled'}</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: '1px solid ' + st.border, background: st.bg, color: st.text, flexShrink: 0 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />{st.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[10px] text-blue-600 font-mono bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">{video.videoId}</span>
            <span className="text-[10px] text-gray-500 font-semibold bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">{catLabel}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ToggleSwitch val={video.isActive} onToggle={async () => {
            setToggling(true)
            try {
              const { data } = await axios.patch(backendUrl + '/api/youtube-videos/' + video._id + '/toggle', {}, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (data.success) { toast.success(data.message); onToggle({ ...video, isActive: data.isActive }) }
              else toast.error(data.message)
            } catch (err) { toast.error(err.response?.data?.message || err.message) }
            finally { setToggling(false) }
          }} disabled={toggling} />
          <button onClick={() => onEdit(video)}
            className="text-[10px] font-bold bg-white border border-gray-200 hover:border-blue-300 text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg">Edit</button>
          <button onClick={() => onDelete(video)}
            className="text-[10px] font-bold bg-white border border-gray-200 hover:border-red-300 text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN YOUTUBE MANAGER ───────────────────────────────────────────────────
export default function YouTubeManager({ token }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editVideo, setEditVideo] = useState(null)
  const [deleteVideo, setDeleteVideo] = useState(null)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/youtube-videos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) setVideos(data.videos ?? [])
      else toast.error(data.message)
    } catch (err) { toast.error('Failed to load'); console.error(err) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  const onSaved = (video) => {
    if (editVideo) {
      setVideos(prev => prev.map(v => v._id === video._id ? video : v))
    } else {
      setVideos(prev => [...prev, video])
    }
  }

  const onDeleted = (id) => setVideos(prev => prev.filter(v => v._id !== id))
  const onToggle = (video) => setVideos(prev => prev.map(v => v._id === video._id ? video : v))

  const filtered = filterCat === 'all' ? videos : videos.filter(v => v.category === filterCat)
  const tutorials = filtered.filter(v => v.category === 'tutorials')
  const reviews = filtered.filter(v => v.category === 'reviews')
  const activeCount = videos.filter(v => v.isActive).length

  return (
    <div style={{ maxWidth: 900, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showModal && <VideoModal token={token} onClose={() => { setShowModal(false); setEditVideo(null) }} onSaved={onSaved} editVideo={editVideo} />}
      {deleteVideo && <DeleteModal video={deleteVideo} token={token} onClose={() => setDeleteVideo(null)} onDeleted={onDeleted} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>YouTube Reels</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            {loading ? 'Loading...' : `${activeCount} active · ${videos.length - activeCount} hidden · ${videos.length} total`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchVideos} disabled={loading}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            Refresh
          </button>
          <button onClick={() => { setEditVideo(null); setShowModal(true) }}
            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
            + Add Video
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'tutorials', label: '📚 Tutorials' },
          { key: 'reviews', label: '⭐ Reviews' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilterCat(tab.key)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: filterCat === tab.key ? '2px solid #2563eb' : '1px solid #e5e7eb',
              background: filterCat === tab.key ? '#eff6ff' : '#fff',
              color: filterCat === tab.key ? '#2563eb' : '#6b7280',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ ...CARD, height: 72, background: '#f9fafb' }} />)}
        </div>
      ) : videos.length === 0 ? (
        <div style={{ ...CARD, padding: 50, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No videos yet</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Add your first YouTube tutorial or review reel.</p>
          <button onClick={() => setShowModal(true)}
            style={{ marginTop: 14, padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
            + Add First Video
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...CARD, padding: 50, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No videos in this category</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(video => (
            <VideoCard
              key={video._id}
              video={video}
              onEdit={(v) => { setEditVideo(v); setShowModal(true) }}
              onDelete={setDeleteVideo}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}

      {/* Summary by category when showing all */}
      {filterCat === 'all' && !loading && videos.length > 0 && (
        <div style={{ ...CARD, padding: 16, textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
          📚 <strong style={{ color: '#374151' }}>{tutorials.length}</strong> tutorials · ⭐ <strong style={{ color: '#374151' }}>{reviews.length}</strong> reviews
        </div>
      )}
    </div>
  )
}
