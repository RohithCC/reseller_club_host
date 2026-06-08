// pages/BlogManager.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Blog Manager — all blogs sorted by date, filter by category & date range.
//   ✅ One "Add New Blog" button → professional blog editor modal
//   ✅ Title, description, featured image, category (Project/Blog/News Updates), rich content
//   ✅ Sort by latest date (newest first)
//   ✅ Filter by category + date range
//   ✅ White TailAdmin theme
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import ToggleSwitch from '../components/ToggleSwitch'

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Project', 'Blog', 'News Updates']

// ─── Rich text editor ─────────────────────────────────────────────────────────
import RichTextEditor from '../components/RichTextEditor'

const T = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  inp: {
    width: '100%', padding: '9px 12px', fontSize: 13,
    color: '#111827', background: '#fff',
    border: '1px solid #e5e7eb', borderRadius: 8,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 },
  btn: (v = 'primary') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, border: 'none',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    fontFamily: 'inherit', transition: 'all 0.15s',
    flexShrink: 0, whiteSpace: 'nowrap',
    ...(v === 'primary' && { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', boxShadow: '0 2px 8px rgba(79,70,229,0.25)' }),
    ...(v === 'ghost'   && { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }),
    ...(v === 'danger'  && { background: '#fff5f5', color: '#dc2626', border: '1px solid #fecaca' }),
    ...(v === 'success' && { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }),
    ...(v === 'amber'   && { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }),
    ...(v === 'muted'   && { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }),
  }),
}
const fi = e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }
const bi = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }

// ─── Styled inputs ─────────────────────────────────────────────────────────────
const SInput = ({ style, ...props }) => (<input style={{ ...T.inp, ...style }} onFocus={fi} onBlur={bi} {...props} />)
const STextarea = ({ style, ...props }) => (<textarea style={{ ...T.inp, resize: 'vertical', minHeight: 72, ...style }} onFocus={fi} onBlur={bi} {...props} />)
const SSelect = ({ style, children, ...props }) => (<select style={{ ...T.inp, cursor: 'pointer', ...style }} onFocus={fi} onBlur={bi} {...props}>{children}</select>)

// ─── Helper: resolve relative image URL with backend URL ───────────────
const imgUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${backendUrl}${path}`
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spin = ({ size = 14, color = '#fff' }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    border: '2px solid rgba(79,70,229,0.2)', borderTopColor: color,
    display: 'inline-block', animation: 'bmSpin 0.7s linear infinite',
  }} />
)

// ─── Modal backdrop ───────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <div style={{
      ...T.card, width: '100%', maxWidth: 700,
      maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg,#2563eb,#1d4ed8)', borderRadius: '14px 14px 0 0', flexShrink: 0 }} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid #f3f4f6', flexShrink: 0,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ ...T.btn('muted'), padding: '6px 10px', fontSize: 14 }}>✕</button>
      </div>
      <div style={{ overflowY: 'auto', padding: 20 }}>{children}</div>
    </div>
  </div>
)

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
const DeleteConfirm = ({ onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  }} onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
    <div style={{ ...T.card, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>🗑️</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
        Delete Blog Post?
      </h3>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 22px', lineHeight: 1.6 }}>
        This action cannot be undone. The blog post and its image will be permanently removed.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={onCancel} style={T.btn('muted')}>Cancel</button>
        <button onClick={onConfirm} style={{ ...T.btn('danger'), background: '#dc2626', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
          Yes, Delete
        </button>
      </div>
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
//  BLOG: CREATE MODAL (professional blog editor)
// ═══════════════════════════════════════════════════════════════════════════════
const BlogCreateModal = ({ token, onClose, onSaved, editorToken }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Blog')
  const [tags, setTags] = useState('')
  const [author, setAuthor] = useState('Admin')
  const [published, setPublished] = useState(false)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title || !description || !content) {
      toast.error('Title, description and content are required')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('description', description)
      fd.append('content', content)
      fd.append('category', category)
      fd.append('tags', JSON.stringify(tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []))
      fd.append('author', author)
      fd.append('published', String(published))
      if (image) fd.append('image', image)

      const { data } = await axios.post(`${backendUrl}/api/blog/add`, fd, { headers: { token } })
      if (data.success) { toast.success('Blog post created!'); onSaved() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
    setLoading(false)
  }

  return (
    <Modal title="Add New Blog Post" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Featured / Cover Image */}
        <div>
          <label style={T.label}>Featured Image</label>
          <label style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{
              border: `2px dashed ${preview ? '#2563eb' : '#d1d5db'}`,
              borderRadius: 10, overflow: 'hidden',
              height: preview ? 180 : 'auto',
              display: 'flex', alignItems: preview ? 'unset' : 'center', justifyContent: preview ? 'unset' : 'center',
              background: preview ? '#eff6ff' : '#f9fafb',
              padding: preview ? 0 : 16,
            }}>
              {preview
                ? <img src={preview.startsWith('blob:') ? preview : imgUrl(preview)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>📷 Click to upload (recommended: 1200×1200px square)</p>
              }
            </div>
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files[0]; if (f) { setImage(f); setPreview(URL.createObjectURL(f)) } }} />
          </label>
        </div>

        {/* Title */}
        <div>
          <label style={T.label}>Title *</label>
          <SInput value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Getting Started with Arduino" />
        </div>

        {/* Description */}
        <div>
          <label style={T.label}>Short Description *</label>
          <STextarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief summary shown on listing..." />
        </div>

        {/* Content - Rich Text Editor */}
        <div>
          <label style={T.label}>Content *</label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your blog content here... Use the toolbar to format text, add images, links, and more."
            token={editorToken}
          />
        </div>

        {/* Category + Author */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={T.label}>Category</label>
            <SSelect value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </SSelect>
          </div>
          <div>
            <label style={T.label}>Author</label>
            <SInput value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name" />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label style={T.label}>Tags (comma-separated)</label>
          <SInput value={tags} onChange={e => setTags(e.target.value)} placeholder="arduino, sensor, led" />
        </div>

        {/* Status + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
          <ToggleSwitch val={published} onToggle={() => setPublished(p => !p)} label={published ? 'Published' : 'Draft'} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={T.btn('muted')}>Cancel</button>
            <button onClick={handleSubmit} disabled={loading}
              style={{
                ...T.btn('primary'),
                background: loading ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(79,70,229,0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? <><Spin /> Publishing…</> : '+ Create Blog'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BLOG: EDIT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
const BlogEditModal = ({ blog, token, onClose, onSaved, editorToken }) => {
  const [title, setTitle] = useState(blog.title)
  const [description, setDescription] = useState(blog.description)
  const [content, setContent] = useState(blog.content)
  const [category, setCategory] = useState(blog.category)
  const [tags, setTags] = useState((blog.tags || []).join(', '))
  const [author, setAuthor] = useState(blog.author)
  const [published, setPublished] = useState(blog.published)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(blog.image || null)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('blogId', blog._id)
      fd.append('title', title)
      fd.append('description', description)
      fd.append('content', content)
      fd.append('category', category)
      fd.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)))
      fd.append('author', author)
      fd.append('published', published)
      if (image) fd.append('image', image)

      const { data } = await axios.post(`${backendUrl}/api/blog/update`, fd, { headers: { token } })
      if (data.success) { toast.success('Blog updated!'); onSaved() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
    setLoading(false)
  }

  return (
    <Modal title={`Edit: ${blog.title.length > 40 ? blog.title.slice(0, 40) + '…' : blog.title}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={T.label}>Featured Image</label>
          <label style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{
              border: `2px dashed ${preview ? '#2563eb' : '#d1d5db'}`,
              borderRadius: 10, overflow: 'hidden',
              height: preview ? 240 : 'auto',
              aspectRatio: preview ? '1 / 1' : 'auto',
              display: 'flex', alignItems: preview ? 'unset' : 'center', justifyContent: preview ? 'unset' : 'center',
              background: preview ? '#eff6ff' : '#f9fafb',
              padding: preview ? 0 : 16,
            }}>
              {preview
                ? <img src={preview.startsWith('blob:') ? preview : imgUrl(preview)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>Click to change (recommended: 1200×1200px square)</p>
              }
            </div>
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files[0]; if (f) { setImage(f); setPreview(URL.createObjectURL(f)) } }} />
          </label>
        </div>

        <div>
          <label style={T.label}>Title</label>
          <SInput value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div>
          <label style={T.label}>Short Description</label>
          <STextarea value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        {/* Content - Rich Text Editor */}
          <div>
            <label style={T.label}>Content</label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Edit your blog content..."
              token={editorToken}
            />
          </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={T.label}>Category</label>
            <SSelect value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </SSelect>
          </div>
          <div>
            <label style={T.label}>Author</label>
            <SInput value={author} onChange={e => setAuthor(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={T.label}>Tags</label>
          <SInput value={tags} onChange={e => setTags(e.target.value)} placeholder="arduino, sensor, led" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
          <ToggleSwitch val={published} onToggle={() => setPublished(p => !p)} label={published ? 'Published' : 'Draft'} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={T.btn('muted')}>Cancel</button>
            <button onClick={handleSave} disabled={loading}
              style={{
                ...T.btn('primary'),
                background: loading ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(79,70,229,0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? <><Spin /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BLOG: CARD
// ═══════════════════════════════════════════════════════════════════════════════
const BlogCard = ({ blog, onEdit, onToggle, onDelete }) => {
  const [imgFailed, setImgFailed] = useState(false)
  const hasImg = blog.image && !imgFailed

  return (
  <div style={{
    ...T.card, padding: '10px 14px',
    display: 'flex', gap: 12, alignItems: 'center',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    flexWrap: 'wrap',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(79,70,229,0.08)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}
  >
    {hasImg && (
      <div style={{
        width: 90, height: 60, borderRadius: 8, overflow: 'hidden',
        flexShrink: 0, background: '#f3f4f6',
        border: '1px solid #e5e7eb',
      }}>
        <img src={imgUrl(blog.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgFailed(true)} />
      </div>
    )}

    {/* Content */}
    <div style={{ flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{blog.title}</h3>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          background: blog.published ? '#f0fdf4' : '#f3f4f6',
          color: blog.published ? '#16a34a' : '#6b7280',
          border: `1px solid ${blog.published ? '#bbf7d0' : '#e5e7eb'}`,
        }}>
          {blog.published ? 'Published' : 'Draft'}
        </span>
      </div>

      <p style={{
        fontSize: 12, color: '#6b7280', margin: '0 0 8px', lineHeight: 1.55,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{blog.description}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 6, background: '#dbeafe', color: '#2563eb', border: '1px solid #bfdbfe' }}>
          {blog.category}
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>By {blog.author}</span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>👁 {blog.views ?? 0}</span>
      </div>
    </div>

    {/* Actions */}
    <div className="bm-actions" style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
      <button onClick={() => onEdit(blog)} style={T.btn('ghost')}>✏️ Edit</button>
      <button onClick={() => onToggle(blog._id)} style={blog.published ? T.btn('amber') : T.btn('success')}>
        {blog.published ? '⏸ Unpublish' : '▶ Publish'}
      </button>
      <button onClick={() => onDelete(blog._id)} style={T.btn('danger')}>🗑 Delete</button>
    </div>
  </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN BLOG MANAGER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const BlogManager = ({ token }) => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // ── Modal state ────────────────────────────────────────────────────────────
  const [createBlogOpen, setCreateBlogOpen] = useState(false)
  const [editBlog, setEditBlog] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  // ── Fetch blogs ────────────────────────────────────────────────────────────
  const fetchBlogs = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/blog/list`)
      if (data.success) setBlogs(data.blogs)
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchBlogs() }, [fetchBlogs])

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleBlogToggle = async id => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/blog/toggle-publish`, { blogId: id }, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        setBlogs(b => b.map(x => x._id === id ? { ...x, published: data.published } : x))
      } else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
  }

  const handleBlogDelete = async () => {
    if (!confirmId) return
    try {
      const { data } = await axios.post(`${backendUrl}/api/blog/remove`, { id: confirmId }, { headers: { token } })
      if (data.success) { toast.success('Blog deleted'); setBlogs(b => b.filter(x => x._id !== confirmId)) }
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
    setConfirmId(null)
  }

  // ── Filter & sort ──────────────────────────────────────────────────────────
  const q = search.toLowerCase()

  const filteredBlogs = blogs
    .filter(b => {
      // Search
      if (q && !b.title.toLowerCase().includes(q) && !b.description.toLowerCase().includes(q)) return false
      // Category
      if (categoryFilter !== 'All' && b.category !== categoryFilter) return false
      // Date range
      const d = new Date(b.date)
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999) // end of day
        if (d > end) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first

  const published = blogs.filter(b => b.published).length
  const drafts = blogs.filter(b => !b.published).length

  return (
    <>
      <style>{`
        @keyframes bmSpin { to { transform: rotate(360deg); } }
        @keyframes bmPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bmFade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position: right 10px center; padding-right: 30px !important; }
        .bm-scroll { overflow-x: auto; }
        @media (max-width: 560px) { .bm-actions { flex-direction: row !important; flex-wrap: wrap; } }
        input[type="date"] { color-scheme: light; }
      `}</style>

      {/* ── Modals ── */}
      {createBlogOpen && (
        <BlogCreateModal
          token={token}
          editorToken={token}
          onClose={() => setCreateBlogOpen(false)}
          onSaved={() => { setCreateBlogOpen(false); fetchBlogs() }}
        />
      )}
      {editBlog && (
        <BlogEditModal
          blog={editBlog} token={token}
          editorToken={token}
          onClose={() => setEditBlog(null)}
          onSaved={() => { setEditBlog(null); fetchBlogs() }}
        />
      )}
      {confirmId && (
        <DeleteConfirm onConfirm={handleBlogDelete} onCancel={() => setConfirmId(null)} />
      )}

      <div style={{ maxWidth: 1000, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
              Blog Manager
            </h1>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              Create, edit, and manage all your blog posts, news updates, and project articles
            </p>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',       value: blogs.length,           accent: '#9ca3af' },
            { label: 'Published',   value: published,              accent: '#16a34a' },
            { label: 'Drafts',      value: drafts,                 accent: '#d97706' },
            { label: 'Categories',  value: CATEGORIES.length,      accent: '#1d4ed8' },
            { label: 'Showing',     value: filteredBlogs.length,   accent: '#2563eb' },
          ].map(s => (
            <div key={s.label} style={{
              ...T.card, padding: '12px 18px',
              borderLeft: `3px solid ${s.accent}`,
              flex: '1 1 100px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters toolbar ── */}
        <div style={{ ...T.card, padding: '14px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search blogs…" style={{ ...T.inp, paddingLeft: 36 }} onFocus={fi} onBlur={bi} />
          </div>

          {/* Category filter */}
          <SSelect value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </SSelect>

          {/* Date from */}
          <div>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ ...T.inp, maxWidth: 150, fontSize: 12 }} onFocus={fi} onBlur={bi} />
          </div>

          {/* Date to */}
          <div>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ ...T.inp, maxWidth: 150, fontSize: 12 }} onFocus={fi} onBlur={bi} />
          </div>

          {/* Clear filters */}
          {(search || categoryFilter !== 'All' || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setCategoryFilter('All'); setDateFrom(''); setDateTo('') }}
              style={T.btn('muted')}>✕ Clear</button>
          )}

          {/* Add New Blog */}
          <button onClick={() => setCreateBlogOpen(true)}
            style={{
              ...T.btn('primary'), gap: 8,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add New Blog
          </button>
        </div>

        {/* ── Blog list ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 100, borderRadius: 14, background: '#f3f4f6', animation: 'bmPulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div style={{ ...T.card, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>📝</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>
              {search || categoryFilter !== 'All' || dateFrom || dateTo ? 'No matching posts' : 'No blogs yet'}
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
              {search || categoryFilter !== 'All' || dateFrom || dateTo
                ? 'Try adjusting your search or filters'
                : 'Click "Add New Blog" to create your first post'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredBlogs.map((blog, i) => (
              <div key={blog._id} style={{ animation: `bmFade 0.2s ease ${i * 0.03}s both` }}>
                <BlogCard
                  blog={blog}
                  onEdit={async (b) => {
                    // Fetch full blog data (list excludes 'content' field)
                    try {
                      const { data } = await axios.get(`${backendUrl}/api/blog/${b._id}`)
                      if (data.success && data.blog) {
                        setEditBlog(data.blog)
                      } else {
                        toast.error('Failed to load blog content')
                      }
                    } catch (err) {
                      toast.error(err.message)
                    }
                  }}
                  onToggle={handleBlogToggle}
                  onDelete={id => setConfirmId(id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Count summary ── */}
        {!loading && filteredBlogs.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            Showing {filteredBlogs.length} of {blogs.length} post{blogs.length !== 1 ? 's' : ''}
          </p>
        )}

      </div>
    </>
  )
}

export default BlogManager
