import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'

const C = {
  bg: '#0a0f1e', card: '#0d1a2e', border: '#00c2ff22',
  cyan: '#00c2ff', cyanDim: '#00c2ff11', text: '#e2e8f0',
  muted: '#64748b', danger: '#f87171', dangerBg: '#7f1d1d22',
  success: '#4ade80', successBg: '#14532d22',
}

const CATEGORIES = [
  'General','Tutorials','Projects','News',
  'Components','Robotics','Arduino','Raspberry Pi',
]

const inputStyle = {
  background: '#0a1628', border: `1px solid ${C.border}`,
  color: C.text, borderRadius: 8, padding: '9px 13px',
  fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit',
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
const EditModal = ({ blog, token, onClose, onSaved }) => {
  const [title, setTitle]             = useState(blog.title)
  const [description, setDescription] = useState(blog.description)
  const [content, setContent]         = useState(blog.content)
  const [category, setCategory]       = useState(blog.category)
  const [tags, setTags]               = useState((blog.tags || []).join(', '))
  const [author, setAuthor]           = useState(blog.author)
  const [published, setPublished]     = useState(blog.published)
  const [image, setImage]             = useState(null)
  const [preview, setPreview]         = useState(blog.image || null)
  const [loading, setLoading]         = useState(false)

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

      const { data } = await axios.post(`${backendUrl}/api/blog/update`, fd, {
        headers: { token },
      })

      if (data.success) { toast.success('Blog updated!'); onSaved() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#00000088', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
        width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: `0 0 40px ${C.cyan}22`,
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, background: C.card, zIndex: 1,
        }}>
          <div>
            <p style={{ color: C.cyan, fontSize: 10, fontFamily: "'Courier New',monospace", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Edit Blog Post</p>
            <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0, marginTop: 2 }}>{blog.title.slice(0, 40)}{blog.title.length > 40 ? '…' : ''}</h2>
          </div>
          <button onClick={onClose} style={{ background: '#1e3a5f', border: 'none', color: C.muted, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Image */}
          <label style={{ display: 'block' }}>
            <span style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Courier New',monospace", display: 'block', marginBottom: 6 }}>Cover Image</span>
            <div style={{ border: `2px dashed ${preview ? C.cyan : C.border}`, borderRadius: 10, padding: 16, cursor: 'pointer', textAlign: 'center', background: preview ? C.cyanDim : 'transparent' }}>
              {preview
                ? <img src={preview} alt="" style={{ height: 120, objectFit: 'cover', borderRadius: 8, maxWidth: '100%' }} />
                : <p style={{ color: C.muted, fontSize: 12 }}>Click to change cover image</p>
              }
            </div>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) { setImage(f); setPreview(URL.createObjectURL(f)) } }} />
          </label>

          <div>
            <span style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Courier New',monospace", display: 'block', marginBottom: 6 }}>Title</span>
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} onFocus={e => e.target.style.borderColor = C.cyan} onBlur={e => e.target.style.borderColor = C.border} />
          </div>

          <div>
            <span style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Courier New',monospace", display: 'block', marginBottom: 6 }}>Short Description</span>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} value={description} onChange={e => setDescription(e.target.value)} onFocus={e => e.target.style.borderColor = C.cyan} onBlur={e => e.target.style.borderColor = C.border} />
          </div>

          <div>
            <span style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Courier New',monospace", display: 'block', marginBottom: 6 }}>Full Content</span>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 160, lineHeight: 1.7 }} value={content} onChange={e => setContent(e.target.value)} onFocus={e => e.target.style.borderColor = C.cyan} onBlur={e => e.target.style.borderColor = C.border} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Courier New',monospace", display: 'block', marginBottom: 6 }}>Category</span>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={category} onChange={e => setCategory(e.target.value)} onFocus={e => e.target.style.borderColor = C.cyan} onBlur={e => e.target.style.borderColor = C.border}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0d1a2e' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <span style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Courier New',monospace", display: 'block', marginBottom: 6 }}>Author</span>
              <input style={inputStyle} value={author} onChange={e => setAuthor(e.target.value)} onFocus={e => e.target.style.borderColor = C.cyan} onBlur={e => e.target.style.borderColor = C.border} />
            </div>
          </div>

          <div>
            <span style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Courier New',monospace", display: 'block', marginBottom: 6 }}>Tags (comma-separated)</span>
            <input style={inputStyle} value={tags} onChange={e => setTags(e.target.value)} placeholder="arduino, sensor, led" onFocus={e => e.target.style.borderColor = C.cyan} onBlur={e => e.target.style.borderColor = C.border} />
          </div>

          {/* Status + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" onClick={() => setPublished(p => !p)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: published ? C.cyan : '#1e3a5f', position: 'relative', transition: 'background 0.3s' }}>
                <span style={{ position: 'absolute', top: 3, left: published ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', display: 'block' }} />
              </button>
              <span style={{ color: published ? C.cyan : C.muted, fontSize: 13, fontWeight: 600 }}>{published ? 'Published' : 'Draft'}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ background: '#1e293b', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={loading} style={{ background: loading ? '#1e3a5f' : `linear-gradient(135deg,${C.cyan},#0077b6)`, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : `0 0 14px ${C.cyan}44` }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ListBlog ─────────────────────────────────────────────────────────────
const ListBlog = ({ token }) => {
  const [blogs, setBlogs]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [editBlog, setEditBlog] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

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

  const handleDelete = async (id) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/blog/remove`, { id }, { headers: { token } })
      if (data.success) { toast.success('Blog deleted'); setBlogs(b => b.filter(x => x._id !== id)) }
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
    setConfirmId(null)
  }

  const handleToggle = async (id) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/blog/toggle-publish`, { blogId: id }, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        setBlogs(b => b.map(x => x._id === id ? { ...x, published: data.published } : x))
      } else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
  }

  const displayed = blogs.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
                        b.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'All' || b.category === filterCat
    return matchSearch && matchCat
  })

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px', fontFamily: 'system-ui,sans-serif' }}>
      {/* Heading */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.cyan, display: 'inline-block' }} />
          <span style={{ color: C.cyan, fontFamily: "'Courier New',monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Blog Management</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: 0 }}>All Blog Posts <span style={{ color: C.muted, fontSize: 15, fontWeight: 400 }}>({blogs.length})</span></h1>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          style={{ ...inputStyle, maxWidth: 260, background: C.card, border: `1px solid ${C.border}` }}
          placeholder="🔍  Search blogs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => e.target.style.borderColor = C.cyan}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <select
          style={{ ...inputStyle, maxWidth: 160, background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer' }}
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0d1a2e' }}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading
        ? <div style={{ textAlign: 'center', color: C.cyan, padding: 60, fontSize: 14 }}>Loading blogs...</div>
        : displayed.length === 0
        ? <div style={{ textAlign: 'center', color: C.muted, padding: 60, fontSize: 14 }}>No blogs found.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map(blog => (
              <div key={blog._id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHover || '#00c2ff44'}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                {/* Thumbnail */}
                <div style={{ width: 80, height: 70, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#0a1628', border: `1px solid ${C.border}` }}>
                  {blog.image
                    ? <img src={blog.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 22 }}>📄</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{blog.title}</h3>
                    <span style={{ background: blog.published ? C.successBg : C.dangerBg, color: blog.published ? C.success : C.danger, border: `1px solid ${blog.published ? C.success + '44' : C.danger + '44'}`, borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {blog.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p style={{ color: C.muted, fontSize: 12, margin: '0 0 8px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {blog.description}
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ background: C.cyanDim, color: C.cyan, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>{blog.category}</span>
                    <span style={{ color: '#334155', fontSize: 11 }}>By {blog.author}</span>
                    <span style={{ color: '#334155', fontSize: 11 }}>{new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span style={{ color: '#334155', fontSize: 11 }}>👁 {blog.views}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setEditBlog(blog)} style={{ background: C.cyanDim, color: C.cyan, border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleToggle(blog._id)} style={{ background: blog.published ? C.dangerBg : C.successBg, color: blog.published ? C.danger : C.success, border: `1px solid ${blog.published ? C.danger+'44' : C.success+'44'}`, borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {blog.published ? '⏸ Unpublish' : '▶ Publish'}
                  </button>
                  <button onClick={() => setConfirmId(blog._id)} style={{ background: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}44`, borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Edit Modal */}
      {editBlog && (
        <EditModal
          blog={editBlog}
          token={token}
          onClose={() => setEditBlog(null)}
          onSaved={() => { setEditBlog(null); fetchBlogs() }}
        />
      )}

      {/* Delete confirm */}
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#00000088', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmId(null) }}
        >
          <div style={{ background: C.card, border: `1px solid ${C.danger}44`, borderRadius: 14, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: `0 0 30px ${C.danger}22` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ color: C.text, margin: '0 0 8px', fontSize: 17 }}>Delete Blog Post?</h3>
            <p style={{ color: C.muted, fontSize: 13, margin: '0 0 24px' }}>This action cannot be undone. The blog and its image will be permanently removed.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setConfirmId(null)} style={{ background: '#1e293b', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmId)} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListBlog
