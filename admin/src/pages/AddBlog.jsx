import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'

const C = {
  bg: '#0a0f1e', card: '#0d1a2e', border: '#00c2ff22',
  cyan: '#00c2ff', cyanDim: '#00c2ff11', text: '#e2e8f0',
  muted: '#64748b', error: '#f87171',
}

const CATEGORIES = [
  'General', 'Tutorials', 'Projects', 'News',
  'Components', 'Robotics', 'Arduino', 'Raspberry Pi',
]

const inputStyle = {
  background: '#0a1628', border: `1px solid #00c2ff22`,
  color: '#e2e8f0', borderRadius: '8px', padding: '10px 14px',
  fontSize: '14px', width: '100%', outline: 'none',
  transition: 'border-color 0.2s', fontFamily: 'inherit',
}

const labelStyle = {
  fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#00c2ff', marginBottom: '6px',
  display: 'block', fontFamily: "'Courier New', monospace",
}

const AddBlog = ({ token }) => {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent]         = useState('')
  const [category, setCategory]       = useState('General')
  const [tags, setTags]               = useState('')
  const [author, setAuthor]           = useState('Admin')
  const [published, setPublished]     = useState(false)
  const [image, setImage]             = useState(null)
  const [preview, setPreview]         = useState(null)
  const [loading, setLoading]         = useState(false)

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !description || !content) {
      toast.error('Title, description and content are required')
      return
    }

    // ── Token validation before sending ──────────────────────────────────────
    if (!token) {
      toast.error('Not authorized. Please login again.')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title',       title)
      fd.append('description', description)
      fd.append('content',     content)
      fd.append('category',    category)
      fd.append('tags',        JSON.stringify(
        tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
      ))
      fd.append('author',    author)
      fd.append('published', String(published))
      if (image) fd.append('image', image)

      // ── FIXED: send token exactly as adminAuth reads it ───────────────────
      // adminAuth reads:  req.headers.token
      // axios header key must be lowercase "token" — NOT "Authorization"
      const { data } = await axios.post(
        `${backendUrl}/api/blog/add`,
        fd,
        {
          headers: {
            token: token,                          // ✅ matches req.headers.token in adminAuth
            // DO NOT set Content-Type manually —
            // axios sets multipart/form-data + boundary automatically for FormData
          }
        }
      )

      if (data.success) {
        toast.success('Blog post added!')
        setTitle(''); setDescription(''); setContent('')
        setTags(''); setAuthor('Admin'); setCategory('General')
        setPublished(false); setImage(null); setPreview(null)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Page heading */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.cyan, display: 'inline-block' }} />
          <span style={{ color: C.cyan, fontFamily: "'Courier New',monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Blog Management
          </span>
        </div>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>Add New Blog Post</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: '24px', alignItems: 'start' }}>

          {/* ── Left ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Cover image */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <label style={labelStyle}>Cover Image</label>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: `2px dashed ${preview ? C.cyan : C.border}`, borderRadius: 10, padding: 24,
                cursor: 'pointer', minHeight: 160,
                background: preview ? '#00c2ff08' : 'transparent',
              }}>
                {preview
                  ? <img src={preview} alt="preview" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8 }} />
                  : <>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p style={{ color: C.muted, fontSize: 13, marginTop: 10 }}>Click to upload cover image</p>
                      <p style={{ color: '#334155', fontSize: 11, marginTop: 4 }}>PNG, JPG, WEBP</p>
                    </>
                }
                <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Title */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} placeholder="e.g. Getting Started with Arduino Uno"
                value={title} onChange={e => setTitle(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.cyan}
                onBlur={e => e.target.style.borderColor = C.border} required />
            </div>

            {/* Description */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <label style={labelStyle}>Short Description *</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                placeholder="A brief summary shown on the blog listing page..."
                value={description} onChange={e => setDescription(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.cyan}
                onBlur={e => e.target.style.borderColor = C.border} required />
            </div>

            {/* Content */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <label style={labelStyle}>Full Content *</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 240, lineHeight: '1.7' }}
                placeholder="Write the full blog article here. HTML is supported."
                value={content} onChange={e => setContent(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.cyan}
                onBlur={e => e.target.style.borderColor = C.border} required />
              <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
                HTML tags supported: &lt;b&gt;, &lt;i&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;h2&gt;, &lt;code&gt;, &lt;a&gt;
              </p>
            </div>
          </div>

          {/* ── Right: meta ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Status toggle */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <label style={labelStyle}>Status</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" onClick={() => setPublished(p => !p)}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: published ? C.cyan : '#1e3a5f', position: 'relative', transition: 'background 0.3s' }}>
                  <span style={{ position: 'absolute', top: 3, left: published ? 22 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.3s', display: 'block' }} />
                </button>
                <span style={{ color: published ? C.cyan : C.muted, fontSize: 13, fontWeight: 600 }}>
                  {published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            {/* Category */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <label style={labelStyle}>Category</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={category}
                onChange={e => setCategory(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.cyan}
                onBlur={e => e.target.style.borderColor = C.border}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0d1a2e' }}>{c}</option>)}
              </select>
            </div>

            {/* Author */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <label style={labelStyle}>Author</label>
              <input style={inputStyle} placeholder="Author name" value={author}
                onChange={e => setAuthor(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.cyan}
                onBlur={e => e.target.style.borderColor = C.border} />
            </div>

            {/* Tags */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <label style={labelStyle}>Tags</label>
              <input style={inputStyle} placeholder="arduino, led, sensor" value={tags}
                onChange={e => setTags(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.cyan}
                onBlur={e => e.target.style.borderColor = C.border} />
              <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Comma-separated</p>
              {tags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                    <span key={t} style={{
                      background: C.cyanDim, color: C.cyan, border: `1px solid ${C.border}`,
                      borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Token debug — remove in production */}
            {!token && (
              <div style={{ background: '#7f1d1d22', border: '1px solid #f8717144', borderRadius: 10, padding: 12 }}>
                <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>
                  ⚠️ No token found. Please logout and login again.
                </p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading || !token}
              style={{
                background: (loading || !token) ? '#1e3a5f' : `linear-gradient(135deg, ${C.cyan}, #0077b6)`,
                color: '#fff', border: 'none', borderRadius: 10, padding: '14px',
                fontSize: 14, fontWeight: 700, cursor: (loading || !token) ? 'not-allowed' : 'pointer',
                letterSpacing: '0.06em', transition: 'all 0.2s',
                boxShadow: (loading || !token) ? 'none' : `0 0 16px ${C.cyan}44`,
                width: '100%', opacity: !token ? 0.5 : 1,
              }}>
              {loading ? 'Publishing...' : '+ PUBLISH BLOG'}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}

export default AddBlog
