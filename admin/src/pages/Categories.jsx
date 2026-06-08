// pages/Categories.jsx
// TailAdmin-inspired white Categories page
// ✅ All API logic preserved   ✅ Mobile responsive
// ✅ Clean white UI            ✅ Cards, accordion, search, stats
// ✅ Confirm dialog            ✅ Add/edit/delete/toggle all intact

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import ToggleSwitch from '../components/ToggleSwitch'

// ─── Image URL helper (prepend backend URL to relative paths) ──────────────────
const imgUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads/')) return `${backendUrl}${url}`
  return url
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}>
      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}>
      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  ),
  ChevronDown: ({ open }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{width:14,height:14,flexShrink:0,transform:open?'rotate(180deg)':'none',transition:'transform 0.25s'}}>
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20,color:'#d1d5db'}}>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}>
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,color:'#9ca3af',flexShrink:0}}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
}

// ─── Shared style tokens ───────────────────────────────────────────────────────
const S = {
  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  inp: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    color: '#111827',
    padding: '9px 12px',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 6,
  },
  btn: (variant = 'primary') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    ...(variant === 'primary' && {
      background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
      color: '#fff',
      boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
    }),
    ...(variant === 'ghost' && {
      background: '#eff6ff',
      color: '#2563eb',
      border: '1px solid #bfdbfe',
    }),
    ...(variant === 'danger' && {
      background: '#fff5f5',
      color: '#dc2626',
      border: '1px solid #fecaca',
    }),
    ...(variant === 'success' && {
      background: '#f0fdf4',
      color: '#16a34a',
      border: '1px solid #bbf7d0',
    }),
    ...(variant === 'muted' && {
      background: '#f3f4f6',
      color: '#6b7280',
      border: '1px solid #e5e7eb',
    }),
  }),
}

const focusInp = e => {
  e.target.style.borderColor = '#2563eb'
  e.target.style.boxShadow   = '0 0 0 3px rgba(79,70,229,0.1)'
}
const blurInp = e => {
  e.target.style.borderColor = '#e5e7eb'
  e.target.style.boxShadow   = 'none'
}

// ─── Image Upload ──────────────────────────────────────────────────────────────
const ImageUpload = ({ value, onChange, id, size = 80 }) => (
  <label htmlFor={id} style={{ cursor: 'pointer', display: 'block', width: size, height: size, flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: 10, overflow: 'hidden',
      border: value ? '2px solid #2563eb' : '2px dashed #d1d5db',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb', transition: 'border-color 0.15s',
    }}>
      {value
        ? <img src={typeof value === 'string' ? imgUrl(value) : URL.createObjectURL(value)}
            style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" />
        : <div style={{textAlign:'center'}}>
            <Icon.Image />
            <div style={{fontSize:9,color:'#9ca3af',marginTop:2}}>Upload</div>
          </div>
      }
    </div>
    <input id={id} type="file" accept="image/*" hidden onChange={e => onChange(e.target.files[0])} />
  </label>
)

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  }}>
    <div style={{ ...S.card, padding: 28, maxWidth: 380, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <p style={{fontSize:14,fontWeight:700,color:'#111827',margin:'0 0 4px'}}>Confirm Delete</p>
          <p style={{fontSize:13,color:'#6b7280',margin:0,lineHeight:1.5}}>{message}</p>
        </div>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
        <button style={S.btn('muted')} onClick={onCancel}>Cancel</button>
        <button style={S.btn('danger')} onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
)

// ─── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = ({ size = 14, color = '#fff' }) => (
  <span style={{
    width: size, height: size, flexShrink: 0,
    border: `2px solid rgba(255,255,255,0.3)`,
    borderTopColor: color, borderRadius: '50%',
    display: 'inline-block', animation: 'catSpin 0.7s linear infinite',
  }} />
)

// ─── SubCategory Row ───────────────────────────────────────────────────────────
const SubCategoryRow = ({ sub, categoryId, token, onRefresh }) => {
  const [editing, setEditing] = useState(false)
  const [name,    setName]    = useState(sub.name)
  const [desc,    setDesc]    = useState(sub.description || '')
  const [image,   setImage]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const handleUpdate = async () => {
    try {
      setLoading(true)
      const fd = new FormData()
      fd.append('categoryId',    categoryId)
      fd.append('subCategoryId', sub._id)
      fd.append('name',          name)
      fd.append('description',   desc)
      if (image) fd.append('image', image)
      const { data } = await axios.post(`${backendUrl}/api/category/sub/update`, fd, { headers: { token } })
      if (data.success) { toast.success('Sub-category updated'); setEditing(false); onRefresh() }
      else toast.error(data.message)
    } catch { toast.error('Update failed') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/category/sub/remove`,
        { categoryId, subCategoryId: sub._id }, { headers: { token } })
      if (data.success) { toast.success('Sub-category removed'); onRefresh() }
      else toast.error(data.message)
    } catch { toast.error('Delete failed') }
    setConfirm(false)
  }

  const handleToggle = async () => {
    try {
      const fd = new FormData()
      fd.append('categoryId',    categoryId)
      fd.append('subCategoryId', sub._id)
      fd.append('isActive',      String(!sub.isActive))
      const { data } = await axios.post(`${backendUrl}/api/category/sub/update`, fd, { headers: { token } })
      if (data.success) onRefresh()
      else toast.error(data.message)
    } catch { toast.error('Toggle failed') }
  }

  return (
    <>
      {confirm && <ConfirmDialog
        message={`Delete sub-category "${sub.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(false)}
      />}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 8, marginBottom: 6,
        background: '#fafafa', border: '1px solid #f3f4f6',
        transition: 'border-color 0.15s', flexWrap: 'wrap',
      }}>
        {/* Thumbnail */}
        <div style={{
          width: 34, height: 34, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
          background: '#f3f4f6', border: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>            {sub.image
              ? <img src={imgUrl(sub.image)} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" />
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,color:'#d1d5db'}}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
          }
        </div>

        {editing ? (
          <>
            <ImageUpload value={image || sub.image} onChange={setImage} id={`sub-img-${sub._id}`} size={34} />
            <input value={name} onChange={e => setName(e.target.value)}
              style={{...S.inp, flex:1, minWidth:100}} placeholder="Sub-category name"
              onFocus={focusInp} onBlur={blurInp} />
            <input value={desc} onChange={e => setDesc(e.target.value)}
              style={{...S.inp, flex:1, minWidth:100}} placeholder="Description (optional)"
              onFocus={focusInp} onBlur={blurInp} />
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button style={S.btn('success')} onClick={handleUpdate} disabled={loading}>
                {loading ? <Spinner color="#16a34a" /> : 'Save'}
              </button>
              <button style={S.btn('muted')} onClick={() => setEditing(false)}><Icon.X /></button>
            </div>
          </>
        ) : (
          <>
            <div style={{flex:1, minWidth:80}}>
              <p style={{fontSize:13,fontWeight:600,color:'#111827',margin:0}}>{sub.name}</p>
              {sub.description && (
                <p style={{fontSize:11,color:'#9ca3af',margin:'1px 0 0'}}>{sub.description}</p>
              )}
            </div>
            <span style={{
              fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
              background: sub.isActive ? '#dbeafe' : '#f3f4f6',
              color: sub.isActive ? '#2563eb' : '#9ca3af',
              flexShrink: 0,
            }}>
              {sub.isActive ? 'Active' : 'Hidden'}
            </span>
            <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
              <ToggleSwitch val={sub.isActive} onToggle={handleToggle} />
              <button style={S.btn('ghost')} onClick={() => setEditing(true)}><Icon.Edit /></button>
              <button style={S.btn('danger')} onClick={() => setConfirm(true)}><Icon.Trash /></button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── Add SubCategory Form ──────────────────────────────────────────────────────
const AddSubForm = ({ categoryId, token, onRefresh, onClose }) => {
  const [name,    setName]    = useState('')
  const [desc,    setDesc]    = useState('')
  const [image,   setImage]   = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error('Sub-category name is required')
    try {
      setLoading(true)
      const fd = new FormData()
      fd.append('categoryId',  categoryId)
      fd.append('name',        name.trim())
      fd.append('description', desc.trim())
      if (image) fd.append('image', image)
      const { data } = await axios.post(`${backendUrl}/api/category/sub/add`, fd, { headers: { token } })
      if (data.success) { toast.success('Sub-category added'); onRefresh(); onClose() }
      else toast.error(data.message)
    } catch { toast.error('Failed to add sub-category') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
      padding:'10px 12px', borderRadius:8, marginBottom:8,
      background:'#eff6ff', border:'1px dashed #c4b5fd',
    }}>
      <ImageUpload value={image} onChange={setImage} id={`new-sub-img-${categoryId}`} size={38} />
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Sub-category name *"
        style={{...S.inp, flex:1, minWidth:120}} autoFocus onFocus={focusInp} onBlur={blurInp} />
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)"
        style={{...S.inp, flex:1, minWidth:120}} onFocus={focusInp} onBlur={blurInp} />
      <div style={{display:'flex',gap:6,flexShrink:0}}>
        <button style={S.btn('primary')} onClick={handleSubmit} disabled={loading}>
          {loading ? <><Spinner /> Adding…</> : <><Icon.Plus /> Add</>}
        </button>
        <button style={S.btn('muted')} onClick={onClose}><Icon.X /></button>
      </div>
    </div>
  )
}

// ─── Category Card ─────────────────────────────────────────────────────────────
const CategoryCard = ({ cat, token, onRefresh }) => {
  const [open,      setOpen]      = useState(false)
  const [editing,   setEditing]   = useState(false)
  const [addingSub, setAddingSub] = useState(false)
  const [confirm,   setConfirm]   = useState(false)
  const [loading,   setLoading]   = useState(false)

  const [name,  setName]  = useState(cat.name)
  const [desc,  setDesc]  = useState(cat.description || '')
  const [image, setImage] = useState(null)

  const handleUpdate = async () => {
    try {
      setLoading(true)
      const fd = new FormData()
      fd.append('categoryId',  cat._id)
      fd.append('name',        name)
      fd.append('description', desc)
      if (image) fd.append('image', image)
      const { data } = await axios.post(`${backendUrl}/api/category/update`, fd, { headers: { token } })
      if (data.success) { toast.success('Category updated'); setEditing(false); onRefresh() }
      else toast.error(data.message)
    } catch { toast.error('Update failed') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/category/remove`,
        { categoryId: cat._id }, { headers: { token } })
      if (data.success) { toast.success('Category deleted'); onRefresh() }
      else toast.error(data.message)
    } catch { toast.error('Delete failed') }
    setConfirm(false)
  }

  const handleToggle = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/category/toggle`,
        { categoryId: cat._id, isActive: String(!cat.isActive) }, { headers: { token } })
      if (data.success) onRefresh()
      else toast.error(data.message)
    } catch { toast.error('Toggle failed') }
  }

  const subCount = cat.subCategories?.length || 0

  return (
    <>
      {confirm && <ConfirmDialog
        message={`Delete category "${cat.name}" and all its sub-categories?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(false)}
      />}

      <div style={{ ...S.card, marginBottom: 12, overflow: 'hidden' }}>

        {/* ── Header row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', flexWrap: 'wrap',
        }}>
          {/* Thumbnail */}
          <div style={{
            width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
            background: '#f3f4f6', border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {cat.image
              ? <img src={imgUrl(cat.image)} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" />
              : <Icon.Image />
            }
          </div>

          {/* Name + meta */}
          <div style={{flex:1, minWidth:100, cursor:'pointer'}} onClick={() => !editing && setOpen(o => !o)}>
            <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
              <span style={{fontSize:15, fontWeight:700, color:'#111827'}}>{cat.name}</span>
              <span style={{
                fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:99,
                background: cat.isActive ? '#dbeafe' : '#f3f4f6',
                color: cat.isActive ? '#2563eb' : '#9ca3af',
              }}>
                {cat.isActive ? 'Active' : 'Hidden'}
              </span>
            </div>
            <p style={{fontSize:12, color:'#9ca3af', margin:'2px 0 0'}}>
              {subCount} sub-categor{subCount === 1 ? 'y' : 'ies'}
              {cat.description && <span> · {cat.description}</span>}
            </p>
          </div>

          {/* Actions */}
          <div style={{display:'flex', alignItems:'center', gap:6, flexShrink:0, flexWrap:'wrap'}}>
            <ToggleSwitch val={cat.isActive} onToggle={handleToggle} />
            <button style={S.btn('ghost')} onClick={() => { setEditing(e => !e); setOpen(true) }}>
              <Icon.Edit />
              <span className="cat-btn-label">Edit</span>
            </button>
            <button style={S.btn('danger')} onClick={() => setConfirm(true)}>
              <Icon.Trash />
              <span className="cat-btn-label">Delete</span>
            </button>
            <button style={S.btn('muted')} onClick={() => setOpen(o => !o)}>
              <Icon.ChevronDown open={open} />
            </button>
          </div>
        </div>

        {/* ── Edit inline form ── */}
        {editing && (
          <div style={{
            padding: '14px 16px', borderTop: '1px solid #f3f4f6',
            background: '#fafafa', animation: 'catFade 0.2s ease',
          }}>
            <div style={{display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap'}}>
              <ImageUpload value={image || cat.image} onChange={setImage}
                id={`cat-img-${cat._id}`} size={60} />
              <div style={{flex:1, minWidth:140}}>
                <label style={S.label}>Category Name *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  style={S.inp} onFocus={focusInp} onBlur={blurInp} />
              </div>
              <div style={{flex:1, minWidth:140}}>
                <label style={S.label}>Description</label>
                <input value={desc} onChange={e => setDesc(e.target.value)}
                  style={S.inp} placeholder="Optional" onFocus={focusInp} onBlur={blurInp} />
              </div>
              <div style={{display:'flex', gap:8, flexShrink:0}}>
                <button style={S.btn('success')} onClick={handleUpdate} disabled={loading}>
                  {loading ? <><Spinner color="#16a34a" /> Saving…</> : 'Save'}
                </button>
                <button style={S.btn('muted')} onClick={() => setEditing(false)}><Icon.X /></button>
              </div>
            </div>
          </div>
        )}

        {/* ── Sub-categories accordion ── */}
        {open && (
          <div style={{
            padding: '0 16px 16px', borderTop: '1px solid #f3f4f6',
            animation: 'catFade 0.2s ease',
          }}>
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              paddingTop:14, paddingBottom:12,
            }}>
              <span style={{
                fontSize:10, fontWeight:700, letterSpacing:'0.1em',
                textTransform:'uppercase', color:'#9ca3af',
              }}>
                Sub-Categories ({subCount})
              </span>
              <button style={S.btn('ghost')} onClick={() => setAddingSub(true)}>
                <Icon.Plus /> Add Sub
              </button>
            </div>

            {addingSub && (
              <AddSubForm
                categoryId={cat._id} token={token}
                onRefresh={onRefresh} onClose={() => setAddingSub(false)}
              />
            )}

            {subCount === 0 && !addingSub && (
              <div style={{
                textAlign:'center', padding:20, color:'#9ca3af', fontSize:13,
                border:'1px dashed #e5e7eb', borderRadius:10,
              }}>
                No sub-categories yet — click "Add Sub" to create one.
              </div>
            )}

            {cat.subCategories?.map(sub => (
              <SubCategoryRow
                key={sub._id} sub={sub}
                categoryId={cat._id} token={token} onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Add Category Form ─────────────────────────────────────────────────────────
const AddCategoryForm = ({ token, onRefresh, onClose }) => {
  const [name,    setName]    = useState('')
  const [desc,    setDesc]    = useState('')
  const [image,   setImage]   = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Category name is required')
    try {
      setLoading(true)
      const fd = new FormData()
      fd.append('name',        name.trim())
      fd.append('description', desc.trim())
      if (image) fd.append('image', image)
      const { data } = await axios.post(`${backendUrl}/api/category/add`, fd, { headers: { token } })
      if (data.success) { toast.success('Category created!'); onRefresh(); onClose() }
      else toast.error(data.message)
    } catch { toast.error('Failed to create category') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ ...S.card, padding: 20, marginBottom: 20, animation: 'catFade 0.2s ease' }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16,
      }}>
        <h3 style={{fontSize:14, fontWeight:700, color:'#111827', margin:0}}>New Category</h3>
        <button style={S.btn('muted')} onClick={onClose}><Icon.X /></button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap'}}>
          <ImageUpload value={image} onChange={setImage} id="new-cat-img" size={68} />
          <div style={{flex:1, minWidth:140}}>
            <label style={S.label}>Category Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              style={S.inp} placeholder="e.g. Sensors & Modules"
              autoFocus required onFocus={focusInp} onBlur={blurInp} />
          </div>
          <div style={{flex:1, minWidth:140}}>
            <label style={S.label}>Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              style={S.inp} placeholder="Short description (optional)"
              onFocus={focusInp} onBlur={blurInp} />
          </div>
          <button type="submit" style={S.btn('primary')} disabled={loading}>
            {loading
              ? <><Spinner /> Creating…</>
              : <><Icon.Plus /> Create</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const Categories = ({ token }) => {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [adding,     setAdding]     = useState(false)
  const [search,     setSearch]     = useState('')

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${backendUrl}/api/category/list`, { headers: { token } })
      if (data.success) setCategories(data.categories)
      else toast.error(data.message)
    } catch { toast.error('Failed to load categories') }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const filtered   = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const totalSubs  = categories.reduce((acc, c) => acc + (c.subCategories?.length || 0), 0)
  const activeCount = categories.filter(c => c.isActive).length

  return (
    <div style={{maxWidth: 860, width: '100%'}}>
      <style>{`
        @keyframes catSpin { to { transform: rotate(360deg); } }
        @keyframes catFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .cat-btn-label { display: inline; }
        @media (max-width: 520px) { .cat-btn-label { display: none; } }
      `}</style>

      {/* ── Page header ── */}
      <div style={{
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        marginBottom:24, flexWrap:'wrap', gap:12,
      }}>
        <div>
          <h1 style={{fontSize:20, fontWeight:700, color:'#111827', letterSpacing:'-0.02em', margin:0}}>
            Categories
          </h1>
          <p style={{fontSize:13, color:'#9ca3af', marginTop:4}}>
            {categories.length} categories · {totalSubs} sub-categories
          </p>
        </div>
        <button style={S.btn('primary')} onClick={() => setAdding(true)} disabled={adding}>
          <Icon.Plus /> New Category
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div style={{display:'flex', gap:12, marginBottom:20, flexWrap:'wrap'}}>
        {[
          { label: 'Total',       value: categories.length, color: '#2563eb', bg: '#dbeafe' },
          { label: 'Sub-cats',    value: totalSubs,         color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Active',      value: activeCount,       color: '#0891b2', bg: '#ecfeff' },
          { label: 'Hidden',      value: categories.length - activeCount, color: '#dc2626', bg: '#fff5f5' },
        ].map(stat => (
          <div key={stat.label} style={{
            ...S.card, padding:'14px 18px', flex:'1 1 100px',
            display:'flex', flexDirection:'column', gap:3,
          }}>
            <span style={{fontSize:24, fontWeight:800, color:stat.color, lineHeight:1}}>
              {stat.value}
            </span>
            <span style={{fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em'}}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Add form ── */}
      {adding && (
        <AddCategoryForm token={token} onRefresh={fetchCategories} onClose={() => setAdding(false)} />
      )}

      {/* ── Search ── */}
      <div style={{position:'relative', marginBottom:16}}>
        <span style={{
          position:'absolute', left:12, top:'50%',
          transform:'translateY(-50%)', display:'flex', pointerEvents:'none',
        }}>
          <Icon.Search />
        </span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          style={{...S.inp, paddingLeft:38}}
          placeholder="Search categories…"
          onFocus={focusInp} onBlur={blurInp}
        />
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{textAlign:'center', padding:60}}>
          <div style={{
            width:36, height:36, border:'3px solid #e5e7eb',
            borderTopColor:'#2563eb', borderRadius:'50%',
            animation:'catSpin 0.8s linear infinite', margin:'0 auto 12px',
          }} />
          <p style={{color:'#9ca3af', fontSize:13}}>Loading categories…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign:'center', padding:60, border:'1px dashed #e5e7eb',
          borderRadius:14, color:'#9ca3af', fontSize:13,
        }}>
          {search
            ? `No categories matching "${search}"`
            : 'No categories yet — create your first one above.'}
        </div>
      ) : (
        filtered.map(cat => (
          <div key={cat._id} style={{animation:'catFade 0.2s ease'}}>
            <CategoryCard cat={cat} token={token} onRefresh={fetchCategories} />
          </div>
        ))
      )}
    </div>
  )
}

export default Categories