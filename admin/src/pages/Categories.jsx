// pages/Categories.jsx
import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  ChevronDown: ({ open }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 transition-transform duration-300"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Toggle: ({ on }) => (
    <div className="relative w-10 h-5 rounded-full transition-colors duration-200 flex items-center"
      style={{ background: on ? '#00c2ff' : '#1e3a5f' }}>
      <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: on ? 'translateX(22px)' : 'translateX(3px)' }} />
    </div>
  ),
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const S = {
  card: {
    background: 'linear-gradient(135deg, #0d1a2e 0%, #0a1628 100%)',
    border: '1px solid #00c2ff22',
    borderRadius: 12,
    boxShadow: '0 4px 24px #00000044',
  },
  inp: {
    background: '#060d1a',
    border: '1px solid #00c2ff33',
    borderRadius: 8,
    color: '#e2e8f0',
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
  },
  btn: (variant = 'primary') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    ...(variant === 'primary' && {
      background: 'linear-gradient(135deg, #00c2ff, #0077b6)',
      color: '#fff',
      boxShadow: '0 0 16px #00c2ff33',
    }),
    ...(variant === 'ghost' && {
      background: '#00c2ff11',
      color: '#00c2ff',
      border: '1px solid #00c2ff33',
    }),
    ...(variant === 'danger' && {
      background: '#ff4d4d11',
      color: '#ff6b6b',
      border: '1px solid #ff4d4d33',
    }),
    ...(variant === 'success' && {
      background: '#00ff9511',
      color: '#00ff95',
      border: '1px solid #00ff9533',
    }),
  }),
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#4a6fa5',
    marginBottom: 6,
    fontFamily: "'Courier New', monospace",
  },
}

// ─── Image Upload Button ──────────────────────────────────────────────────────
const ImageUpload = ({ value, onChange, id, size = 80 }) => (
  <label htmlFor={id} style={{ cursor: 'pointer', display: 'block', width: size, height: size, flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: 10, overflow: 'hidden',
      border: value ? '2px solid #00c2ff' : '2px dashed #00c2ff44',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#060d1a', position: 'relative',
    }}>
      {value
        ? <img src={typeof value === 'string' ? value : URL.createObjectURL(value)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        : <div style={{ color: '#1e3a5f', textAlign: 'center' }}>
            <Icon.Image />
            <div style={{ fontSize: 9, marginTop: 2, color: '#2a4a70' }}>Image</div>
          </div>
      }
    </div>
    <input id={id} type="file" accept="image/*" hidden onChange={e => onChange(e.target.files[0])} />
  </label>
)

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: '#00000088', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{ ...S.card, padding: 28, maxWidth: 360, width: '90%' }}>
      <p style={{ color: '#e2e8f0', marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={S.btn('ghost')} onClick={onCancel}>Cancel</button>
        <button style={S.btn('danger')} onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
)

// ─── SubCategory Row ──────────────────────────────────────────────────────────
const SubCategoryRow = ({ sub, categoryId, token, onRefresh }) => {
  const [editing, setEditing]     = useState(false)
  const [name, setName]           = useState(sub.name)
  const [desc, setDesc]           = useState(sub.description || '')
  const [image, setImage]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [confirm, setConfirm]     = useState(false)

  const handleUpdate = async () => {
    try {
      setLoading(true)
      const fd = new FormData()
      fd.append('categoryId',    categoryId)
      fd.append('subCategoryId', sub._id)
      fd.append('name',          name)
      fd.append('description',   desc)
      if (image) fd.append('image', image)

      const { data } = await axios.post(`${backendUrl}/api/category/sub/update`, fd, {
        headers: { token },
      })
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
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 8,
        background: '#060d1a', border: '1px solid #00c2ff11',
        marginBottom: 6,
      }}>
        {/* Thumb */}
        <div style={{
          width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
          background: '#0d1a2e', border: '1px solid #00c2ff22',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {sub.image
            ? <img src={sub.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : <span style={{ fontSize: 8, color: '#2a4a70' }}>IMG</span>}
        </div>

        {editing ? (
          <>
            <ImageUpload value={image || sub.image} onChange={setImage} id={`sub-img-${sub._id}`} size={36} />
            <input value={name} onChange={e => setName(e.target.value)}
              style={{ ...S.inp, flex: 1 }} placeholder="Sub-category name" />
            <input value={desc} onChange={e => setDesc(e.target.value)}
              style={{ ...S.inp, flex: 1 }} placeholder="Description (optional)" />
            <button style={S.btn('success')} onClick={handleUpdate} disabled={loading}>
              {loading ? '...' : 'Save'}
            </button>
            <button style={S.btn('ghost')} onClick={() => setEditing(false)}>
              <Icon.X />
            </button>
          </>
        ) : (
          <>
            <div style={{ flex: 1 }}>
              <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{sub.name}</span>
              {sub.description && (
                <span style={{ color: '#4a6fa5', fontSize: 11, marginLeft: 8 }}>{sub.description}</span>
              )}
            </div>
            <button onClick={handleToggle} title={sub.isActive ? 'Disable' : 'Enable'}>
              <Icon.Toggle on={sub.isActive} />
            </button>
            <button style={S.btn('ghost')} onClick={() => setEditing(true)} title="Edit">
              <Icon.Edit />
            </button>
            <button style={S.btn('danger')} onClick={() => setConfirm(true)} title="Delete">
              <Icon.Trash />
            </button>
          </>
        )}
      </div>
    </>
  )
}

// ─── Add SubCategory Form ─────────────────────────────────────────────────────
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

      const { data } = await axios.post(`${backendUrl}/api/category/sub/add`, fd, {
        headers: { token },
      })
      if (data.success) {
        toast.success('Sub-category added')
        onRefresh()
        onClose()
      } else toast.error(data.message)
    } catch { toast.error('Failed to add sub-category') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 8,
      background: '#00c2ff08', border: '1px dashed #00c2ff33',
      marginBottom: 8,
    }}>
      <ImageUpload value={image} onChange={setImage} id={`new-sub-img-${categoryId}`} size={40} />
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Sub-category name *"
        style={{ ...S.inp, flex: 1 }} autoFocus />
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)"
        style={{ ...S.inp, flex: 1 }} />
      <button style={S.btn('primary')} onClick={handleSubmit} disabled={loading}>
        {loading ? '...' : 'Add'}
      </button>
      <button style={S.btn('ghost')} onClick={onClose}><Icon.X /></button>
    </div>
  )
}

// ─── Category Card ────────────────────────────────────────────────────────────
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

      const { data } = await axios.post(`${backendUrl}/api/category/update`, fd, {
        headers: { token },
      })
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
        {/* ── Category header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
          cursor: 'pointer', userSelect: 'none',
        }}>
          {/* Thumbnail */}
          <div style={{
            width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
            background: '#060d1a', border: '1px solid #00c2ff22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {cat.image
              ? <img src={cat.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : <Icon.Image />}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }} onClick={() => setOpen(o => !o)}>
            {editing ? null : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{cat.name}</span>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 20,
                    background: cat.isActive ? '#00c2ff22' : '#ff4d4d11',
                    color: cat.isActive ? '#00c2ff' : '#ff6b6b',
                    fontFamily: "'Courier New', monospace", fontWeight: 700,
                  }}>
                    {cat.isActive ? 'ACTIVE' : 'HIDDEN'}
                  </span>
                </div>
                <div style={{ color: '#4a6fa5', fontSize: 12, marginTop: 2 }}>
                  {subCount} sub-categor{subCount === 1 ? 'y' : 'ies'}
                  {cat.description && <span> · {cat.description}</span>}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleToggle} title={cat.isActive ? 'Disable' : 'Enable'}>
              <Icon.Toggle on={cat.isActive} />
            </button>
            <button style={S.btn('ghost')} onClick={() => { setEditing(e => !e); setOpen(true) }}>
              <Icon.Edit />
            </button>
            <button style={S.btn('danger')} onClick={() => setConfirm(true)}>
              <Icon.Trash />
            </button>
            <button style={{ ...S.btn('ghost'), padding: '8px 10px' }}
              onClick={() => setOpen(o => !o)}>
              <Icon.ChevronDown open={open} />
            </button>
          </div>
        </div>

        {/* ── Edit form (inline) ── */}
        {editing && (
          <div style={{
            padding: '0 16px 14px',
            borderTop: '1px solid #00c2ff11',
            paddingTop: 14,
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <ImageUpload value={image || cat.image} onChange={setImage}
                id={`cat-img-${cat._id}`} size={64} />
              <div style={{ flex: 1, display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Category Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} style={S.inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Description</label>
                  <input value={desc} onChange={e => setDesc(e.target.value)} style={S.inp} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
                <button style={S.btn('success')} onClick={handleUpdate} disabled={loading}>
                  {loading ? '...' : 'Save'}
                </button>
                <button style={S.btn('ghost')} onClick={() => setEditing(false)}>
                  <Icon.X />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Sub-categories ── */}
        {open && (
          <div style={{ padding: '0 16px 14px', borderTop: '1px solid #00c2ff11' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 14, paddingBottom: 10,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                color: '#2a4a70', fontFamily: "'Courier New', monospace",
                textTransform: 'uppercase',
              }}>
                Sub-Categories ({subCount})
              </span>
              <button style={S.btn('ghost')} onClick={() => setAddingSub(true)}>
                <Icon.Plus /> Add Sub
              </button>
            </div>

            {addingSub && (
              <AddSubForm
                categoryId={cat._id}
                token={token}
                onRefresh={onRefresh}
                onClose={() => setAddingSub(false)}
              />
            )}

            {subCount === 0 && !addingSub && (
              <div style={{
                textAlign: 'center', padding: '20px',
                color: '#1e3a5f', fontSize: 12,
                border: '1px dashed #00c2ff11', borderRadius: 8,
              }}>
                No sub-categories yet. Click "Add Sub" to create one.
              </div>
            )}

            {cat.subCategories?.map(sub => (
              <SubCategoryRow
                key={sub._id}
                sub={sub}
                categoryId={cat._id}
                token={token}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Add Category Form ────────────────────────────────────────────────────────
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

      const { data } = await axios.post(`${backendUrl}/api/category/add`, fd, {
        headers: { token },
      })
      if (data.success) {
        toast.success('Category created!')
        onRefresh()
        onClose()
      } else toast.error(data.message)
    } catch { toast.error('Failed to create category') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ ...S.card, padding: 20, marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
      }}>
        <h3 style={{ color: '#00c2ff', fontWeight: 700, fontSize: 14, margin: 0,
          fontFamily: "'Courier New', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          New Category
        </h3>
        <button style={S.btn('ghost')} onClick={onClose}><Icon.X /></button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          <ImageUpload value={image} onChange={setImage} id="new-cat-img" size={72} />
          <div style={{ flex: 1 }}>
            <label style={S.label}>Category Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              style={S.inp} placeholder="e.g. Sensors & Modules" autoFocus required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              style={S.inp} placeholder="Short description (optional)" />
          </div>
          <button type="submit" style={S.btn('primary')} disabled={loading}>
            {loading
              ? <><span style={{
                  width: 14, height: 14, border: '2px solid white',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.7s linear infinite',
                }} /> Creating...</>
              : <><Icon.Plus /> Create</>}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const Categories = ({ token }) => {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [adding,     setAdding]     = useState(false)
  const [search,     setSearch]     = useState('')

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${backendUrl}/api/category/list`, {
        headers: { token },
      })
      if (data.success) setCategories(data.categories)
      else toast.error(data.message)
    } catch { toast.error('Failed to load categories') }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalSubs = categories.reduce((acc, c) => acc + (c.subCategories?.length || 0), 0)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{
            color: '#e2e8f0', fontWeight: 800, fontSize: 22, margin: 0,
            fontFamily: "'Courier New', monospace", letterSpacing: '0.04em',
          }}>
            <span style={{ color: '#00c2ff' }}>/ </span>Categories
          </h1>
          <p style={{ color: '#2a4a70', fontSize: 12, marginTop: 4 }}>
            {categories.length} categories · {totalSubs} sub-categories
          </p>
        </div>
        <button style={S.btn('primary')} onClick={() => setAdding(true)} disabled={adding}>
          <Icon.Plus /> New Category
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
      }}>
        {[
          { label: 'Total Categories',    value: categories.length,                         color: '#00c2ff' },
          { label: 'Sub-Categories',      value: totalSubs,                                 color: '#00ff95' },
          { label: 'Active',              value: categories.filter(c => c.isActive).length, color: '#ffd700' },
          { label: 'Hidden',              value: categories.filter(c => !c.isActive).length,color: '#ff6b6b' },
        ].map(stat => (
          <div key={stat.label} style={{
            ...S.card, padding: '12px 18px', flex: '1 1 120px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: stat.color,
              fontFamily: "'Courier New', monospace" }}>{stat.value}</span>
            <span style={{ fontSize: 11, color: '#2a4a70', fontFamily: "'Courier New', monospace",
              textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Add form ── */}
      {adding && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <AddCategoryForm token={token} onRefresh={fetchCategories} onClose={() => setAdding(false)} />
        </div>
      )}

      {/* ── Search ── */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...S.inp, width: '100%', padding: '10px 14px', fontSize: 13 }}
          placeholder="🔍  Search categories..."
        />
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #00c2ff44',
            borderTopColor: '#00c2ff', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: '#2a4a70', fontSize: 13 }}>Loading categories...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 48, border: '1px dashed #00c2ff22',
          borderRadius: 12, color: '#2a4a70',
        }}>
          {search ? `No categories matching "${search}"` : 'No categories yet. Create your first one!'}
        </div>
      ) : (
        filtered.map(cat => (
          <div key={cat._id} style={{ animation: 'fadeIn 0.2s ease' }}>
            <CategoryCard cat={cat} token={token} onRefresh={fetchCategories} />
          </div>
        ))
      )}
    </div>
  )
}

export default Categories