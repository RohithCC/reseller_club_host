// pages/Add.jsx
// TailAdmin-inspired white Add Product page
// ✅ All logic preserved   ✅ Mobile responsive
// ✅ Clean white UI        ✅ Section cards layout
// ✅ Category API loading  ✅ Use cases, specs, tags all intact

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import ToggleSwitch from '../components/ToggleSwitch'

const ICON_OPTIONS = [
  'Default', 'IoT', 'Arduino', 'Raspberry', 'Robotics',
  'Automation', 'Learning', 'Sensor', 'Prototyping',
]

// ── Shared style tokens ────────────────────────────────────────────────────────
const S = {
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '22px 24px',
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
    letterSpacing: '0.01em',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    color: '#111827',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 4,
    letterSpacing: '-0.01em',
  },
  sectionSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 14,
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#2563eb',
    background: '#eff6ff',
    border: '1px dashed #c4b5fd',
    borderRadius: 8,
    padding: '7px 14px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  removeBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28,
    border: 'none', background: 'none',
    color: '#f87171', cursor: 'pointer',
    borderRadius: 6, fontSize: 18, lineHeight: 1,
    transition: 'background 0.12s',
    flexShrink: 0,
  },
}

const inputFocus = e => {
  e.target.style.borderColor = '#2563eb'
  e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
}
const inputBlur = e => {
  e.target.style.borderColor = '#e5e7eb'
  e.target.style.boxShadow = 'none'
}

// ── Section card wrapper ───────────────────────────────────────────────────────
const Section = ({ title, sub, badge, children }) => (
  <div style={S.card}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: sub || badge ? 14 : 18 }}>
      <div>
        <p style={S.sectionTitle}>{title}</p>
        {sub && <p style={S.sectionSub}>{sub}</p>}
      </div>
      {badge}
    </div>
    {children}
  </div>
)

// ── Styled input ───────────────────────────────────────────────────────────────
const Input = ({ style, ...props }) => (
  <input
    style={{ ...S.input, ...style }}
    onFocus={inputFocus}
    onBlur={inputBlur}
    {...props}
  />
)

const Select = ({ style, children, ...props }) => (
  <select
    style={{ ...S.input, ...style, cursor: 'pointer' }}
    onFocus={inputFocus}
    onBlur={inputBlur}
    {...props}
  >
    {children}
  </select>
)

const Textarea = ({ style, ...props }) => (
  <textarea
    style={{ ...S.input, resize: 'vertical', minHeight: 80, ...style }}
    onFocus={inputFocus}
    onBlur={inputBlur}
    {...props}
  />
)

// ═══════════════════════════════════════════════════════════════════════════════
const Add = ({ token }) => {

  const [categoryTree,  setCategoryTree]  = useState([])
  const [category,      setCategory]      = useState('')
  const [subCategory,   setSubCategory]   = useState('')

  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)

  const validateImage = (file) => new Promise((resolve) => {
    if (!file) return resolve(false)
    const validTypes = ['image/webp', 'image/jpeg']
    if (!validTypes.includes(file.type)) {
      toast.error('Only WebP and JPEG formats allowed')
      return resolve(false)
    }
    if (file.size > 204800) {
      toast.error('File size must be under 200 KB')
      return resolve(false)
    }
    const img = new Image()
    img.onload = () => {
      if (img.width !== 1200 || img.height !== 1200) {
        toast.error(`Image must be exactly 1200×1200px (got ${img.width}×${img.height})`)
        URL.revokeObjectURL(img.src)
        return resolve(false)
      }
      URL.revokeObjectURL(img.src)
      resolve(true)
    }
    img.onerror = () => { toast.error('Invalid image file'); resolve(false) }
    img.src = URL.createObjectURL(file)
  })

  const [name,          setName]          = useState('')
  const [description,   setDescription]   = useState('')
  const [price,         setPrice]         = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [stockCount,    setStockCount]    = useState('')
  const [warranty,      setWarranty]      = useState('1 Year Warranty')
  const [returnPolicy,  setReturnPolicy]  = useState('30-Day Returns')

  const [bestseller, setBestseller] = useState(false)
  const [isHot,      setIsHot]      = useState(false)
  const [isPopular,  setIsPopular]  = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [inStock,    setInStock]    = useState(true)

  const [keyFeatures, setKeyFeatures] = useState([''])
  const [tags,        setTags]        = useState([''])
  const [specKey,     setSpecKey]     = useState([''])
  const [specVal,     setSpecVal]     = useState([''])
  const [useCases,    setUseCases]    = useState([{ label: '', desc: '', icon: 'Default' }])
  const [loading,     setLoading]     = useState(false)

  // ── Fetch category tree ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/category/tree?activeOnly=true`)
        if (data.success && data.tree.length > 0) {
          setCategoryTree(data.tree)
          setCategory(data.tree[0].name)
          setSubCategory(data.tree[0].subCategories?.[0]?.name || '')
        }
      } catch { toast.error('Could not load categories.') }
    }
    fetchTree()
  }, [])

  const subOptions = categoryTree.find(c => c.name === category)?.subCategories || []

  const handleCategoryChange = e => {
    const cat = e.target.value
    setCategory(cat)
    const subs = categoryTree.find(c => c.name === cat)?.subCategories || []
    setSubCategory(subs[0]?.name || '')
  }

  const discount = originalPrice && price
    ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

  // ── List helpers ───────────────────────────────────────────────────────────
  const updateList = (setter, list, i, val) => { const n = [...list]; n[i] = val; setter(n) }
  const addItem    = (setter, list)          => setter([...list, ''])
  const removeItem = (setter, list, i)       => setter(list.filter((_, idx) => idx !== i))

  const updateUseCase  = (i, field, val) =>
    setUseCases(prev => prev.map((uc, idx) => idx === i ? { ...uc, [field]: val } : uc))
  const addUseCase     = () => setUseCases(prev => [...prev, { label: '', desc: '', icon: 'Default' }])
  const removeUseCase  = i  => setUseCases(prev => prev.filter((_, idx) => idx !== i))

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setName(''); setDescription(''); setPrice(''); setOriginalPrice('')
    setStockCount(''); setBestseller(false); setIsHot(false)
    setIsPopular(false); setIsFeatured(false); setInStock(true)
    setImage1(false); setImage2(false); setImage3(false); setImage4(false)
    setKeyFeatures(['']); setTags(['']); setSpecKey(['']); setSpecVal([''])
    setUseCases([{ label: '', desc: '', icon: 'Default' }])
    setWarranty('1 Year Warranty'); setReturnPolicy('30-Day Returns')
    if (categoryTree.length > 0) {
      setCategory(categoryTree[0].name)
      setSubCategory(categoryTree[0].subCategories?.[0]?.name || '')
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmitHandler = async e => {
    e.preventDefault()
    if (!token) { toast.error('Not authenticated. Please login again.'); return }
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('name',          name.trim())
      formData.append('description',   description.trim())
      formData.append('price',         price)
      formData.append('originalPrice', originalPrice || price)
      formData.append('category',      category)
      formData.append('subCategory',   subCategory)
      formData.append('stockCount',    stockCount || '0')
      formData.append('warranty',      warranty)
      formData.append('returnPolicy',  returnPolicy)
      formData.append('bestseller',    String(bestseller))
      formData.append('isHot',         String(isHot))
      formData.append('isPopular',     String(isPopular))
      formData.append('isFeatured',    String(isFeatured))
      formData.append('inStock',       String(inStock))

      const cleanFeatures = keyFeatures.filter(f => f.trim())
      const cleanTags     = tags.filter(t => t.trim()).map(t => t.startsWith('#') ? t : `#${t}`)
      const specs = {}
      specKey.forEach((k, i) => {
        if (k.trim() && specVal[i]?.trim()) specs[k.trim()] = specVal[i].trim()
      })
      const cleanUseCases = useCases.filter(uc => uc.label.trim())

      formData.append('keyFeatures',    JSON.stringify(cleanFeatures))
      formData.append('tags',           JSON.stringify(cleanTags))
      formData.append('specifications', JSON.stringify(specs))
      formData.append('useCases',       JSON.stringify(cleanUseCases))

      if (image1) formData.append('image1', image1)
      if (image2) formData.append('image2', image2)
      if (image3) formData.append('image3', image3)
      if (image4) formData.append('image4', image4)

      const response = await axios.post(backendUrl + '/api/product/add', formData, { headers: { token } })
      if (response.data.success) { toast.success(response.data.message); resetForm() }
      else toast.error(response.data.message)
    } catch (error) {
      toast.error(error.message)
    } finally { setLoading(false) }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <form onSubmit={onSubmitHandler} style={{ maxWidth: 860, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
              Add New Product
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Fill in the details below to list a new product
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 10,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(79,70,229,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? <><span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'addSpin 0.8s linear infinite' }} /> Publishing…</>
              : <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Add Product
                </>
            }
          </button>
        </div>

        {/* ── 1. Images ── */}
        <Section title="Product Images" sub="First image will be used as the listing thumbnail. Recommended: 1200×1200px square, WebP format, &lt;200KB">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { img: image1, set: setImage1, id: 'image1', label: 'Main' },
              { img: image2, set: setImage2, id: 'image2', label: '2nd'  },
              { img: image3, set: setImage3, id: 'image3', label: '3rd'  },
              { img: image4, set: setImage4, id: 'image4', label: '4th'  },
            ].map(({ img, set, id, label }) => (
              <label key={id} htmlFor={id} style={{ cursor: 'pointer' }}>
                <div style={{
                  width: 96, height: 96, borderRadius: 12,
                  border: `2px dashed ${img ? '#2563eb' : '#d1d5db'}`,
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: img ? '#fff' : '#f9fafb',
                  transition: 'border-color 0.15s',
                  position: 'relative',
                }}>
                  {img ? (
                    <img src={URL.createObjectURL(img)} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="" />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24,margin:'0 auto 4px'}}>
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <span style={{ fontSize: 11 }}>{label}</span>
                    </div>
                  )}
                </div>
                <input onChange={async e => { const f = e.target.files[0]; if (f) { const ok = await validateImage(f); if (ok) set(f); else e.target.value = '' } }} type="file" id={id} hidden accept="image/webp,image/jpeg" />
              </label>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 12, color: '#0369a1' }}>
            <strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image Requirements</strong>
            <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 12px', fontSize: 11 }}>
              <span style={{ fontWeight: 600 }}>Format</span><span>WebP or JPEG</span>
              <span style={{ fontWeight: 600 }}>Dimensions</span><span>1200 × 1200px (square)</span>
              <span style={{ fontWeight: 600 }}>File size</span><span>≤ 200 KB</span>
              <span style={{ fontWeight: 600 }}>Quality</span><span>80% WebP (visually lossless)</span>
            </div>
          </div>
        </Section>

        {/* ── 2. Basic Info ── */}
        <Section title="Basic Information">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={S.label}>Product Name <span style={{color:'#ef4444'}}>*</span></label>
              <Input value={name} onChange={e => setName(e.target.value)} required
                placeholder="e.g. 10K Thermistor Temperature Sensor Module" />
            </div>
            <div>
              <label style={S.label}>Description <span style={{color:'#ef4444'}}>*</span></label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} required
                placeholder="Detailed product description..." />
            </div>
          </div>
        </Section>

        {/* ── 3. Category + Pricing ── */}
        <Section title="Category & Pricing">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>

            {/* Category */}
            <div>
              <label style={S.label}>Category <span style={{color:'#ef4444'}}>*</span></label>
              {categoryTree.length === 0 ? (
                <div style={{ ...S.input, color: '#9ca3af', background: '#f9fafb', border: '1px dashed #e5e7eb' }}>
                  Loading…
                </div>
              ) : (
                <Select value={category} onChange={handleCategoryChange}>
                  {categoryTree.map(c => (
                    <option key={c._id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </Select>
              )}
            </div>

            {/* Sub-category */}
            <div>
              <label style={S.label}>Sub Category <span style={{color:'#ef4444'}}>*</span></label>
              {subOptions.length === 0 ? (
                <div style={{ ...S.input, color: '#d97706', background: '#fffbeb', border: '1px dashed #fcd34d', fontSize: 12 }}>
                  No sub-categories yet
                </div>
              ) : (
                <Select value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                  {subOptions.map(s => (
                    <option key={s._id || s.name} value={s.name}>{s.name}</option>
                  ))}
                </Select>
              )}
            </div>

            {/* MRP */}
            <div>
              <label style={S.label}>MRP ₹</label>
              <Input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)}
                type="number" min="0" placeholder="50" />
            </div>

            {/* Sale price */}
            <div>
              <label style={S.label}>Sale Price ₹ <span style={{color:'#ef4444'}}>*</span></label>
              <Input value={price} onChange={e => setPrice(e.target.value)}
                type="number" min="0" required placeholder="35" />
            </div>

            {/* Stock */}
            <div>
              <label style={S.label}>Stock Qty</label>
              <Input value={stockCount} onChange={e => setStockCount(e.target.value)}
                type="number" min="0" placeholder="100" />
            </div>
          </div>

          {/* Discount pill */}
          {discount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <span style={{
                background: '#dcfce7', color: '#15803d',
                fontSize: 12, fontWeight: 700,
                padding: '3px 10px', borderRadius: 99,
              }}>{discount}% OFF</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>Discount badge shown on product card</span>
            </div>
          )}
        </Section>

        {/* ── 4. Warranty & Returns ── */}
        <Section title="Policy">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={S.label}>Warranty</label>
              <Select value={warranty} onChange={e => setWarranty(e.target.value)}>
                <option>1 Year Warranty</option>
                <option>6 Months Warranty</option>
                <option>2 Year Warranty</option>
                <option>No Warranty</option>
              </Select>
            </div>
            <div>
              <label style={S.label}>Return Policy</label>
              <Select value={returnPolicy} onChange={e => setReturnPolicy(e.target.value)}>
                <option>30-Day Returns</option>
                <option>7-Day Returns</option>
                <option>No Returns</option>
              </Select>
            </div>
          </div>
        </Section>

        {/* ── 5. Badges ── */}
        <Section title="Product Badges" sub="Control visibility labels shown on the product card">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
<ToggleSwitch val={bestseller} onToggle={() => setBestseller(p => !p)} label="⭐ Bestseller" />
                  <ToggleSwitch val={isHot} onToggle={() => setIsHot(p => !p)} label="🔥 HOT" />
                  <ToggleSwitch val={isPopular} onToggle={() => setIsPopular(p => !p)} label="👁 Popular" />
                  <ToggleSwitch val={isFeatured} onToggle={() => setIsFeatured(p => !p)} label="📌 Featured" />
                  <ToggleSwitch val={inStock} onToggle={() => setInStock(p => !p)} label="✅ In Stock" />
          </div>
        </Section>

        {/* ── 6. Key Features ── */}
        <Section title="Key Features" sub="Bullet points shown on the product page">
          {keyFeatures.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#2563eb', flexShrink: 0, marginTop: 2,
              }} />
              <Input value={f} onChange={e => updateList(setKeyFeatures, keyFeatures, i, e.target.value)}
                placeholder={`Feature ${i + 1} — e.g. Working voltage: 3.3V to 5V DC`}
                style={{ flex: 1 }} />
              {keyFeatures.length > 1 && (
                <button type="button" style={S.removeBtn}
                  onClick={() => removeItem(setKeyFeatures, keyFeatures, i)}
                  onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>×</button>
              )}
            </div>
          ))}
          <button type="button" style={S.addBtn}
            onClick={() => addItem(setKeyFeatures, keyFeatures)}
            onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
            + Add Feature
          </button>
        </Section>

        {/* ── 7. Specifications ── */}
        <Section title="Specifications" sub="Key-value pairs shown in the Specifications tab">
          {specKey.map((k, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Input value={k} onChange={e => updateList(setSpecKey, specKey, i, e.target.value)}
                placeholder="e.g. Supply Voltage" style={{ width: 170, flex: '0 0 170px' }} />
              <Input value={specVal[i] || ''} onChange={e => updateList(setSpecVal, specVal, i, e.target.value)}
                placeholder="e.g. 3.3V – 5V DC" style={{ flex: 1, minWidth: 120 }} />
              {specKey.length > 1 && (
                <button type="button" style={S.removeBtn}
                  onClick={() => { removeItem(setSpecKey, specKey, i); removeItem(setSpecVal, specVal, i) }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>×</button>
              )}
            </div>
          ))}
          <button type="button" style={S.addBtn}
            onClick={() => { addItem(setSpecKey, specKey); addItem(setSpecVal, specVal) }}
            onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
            + Add Specification
          </button>
        </Section>

        {/* ── 8. What You Can Do (Use Cases) ── */}
        <Section
          title="What You Can Do"
          sub="Project idea cards shown in the 'What You Can Do' tab. Leave empty to auto-generate from Tags."
          badge={
            useCases.filter(uc => uc.label.trim()).length > 0 ? (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: '#dbeafe', color: '#2563eb',
                padding: '3px 10px', borderRadius: 99,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {useCases.filter(uc => uc.label.trim()).length} card{useCases.filter(uc => uc.label.trim()).length !== 1 ? 's' : ''}
              </span>
            ) : null
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {useCases.map((uc, i) => (
              <div key={i} style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12, padding: '16px',
                background: '#fafafa',
                transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Use Case {i + 1}
                  </span>
                  {useCases.length > 1 && (
                    <button type="button" style={S.removeBtn}
                      onClick={() => removeUseCase(i)}
                      onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>×</button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={S.label}>Title / Label <span style={{color:'#ef4444'}}>*</span></label>
                    <Input value={uc.label}
                      onChange={e => updateUseCase(i, 'label', e.target.value)}
                      placeholder="e.g. IoT Projects, Home Automation" />
                  </div>
                  <div style={{ width: 150, flexShrink: 0 }}>
                    <label style={S.label}>Icon</label>
                    <Select value={uc.icon} onChange={e => updateUseCase(i, 'icon', e.target.value)}>
                      {ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={S.label}>Short Description</label>
                  <Input value={uc.desc}
                    onChange={e => updateUseCase(i, 'desc', e.target.value)}
                    placeholder="e.g. Build smart sensors and connect devices to your IoT network" />
                </div>

                {/* Preview */}
                {uc.label.trim() && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>Preview:</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#dbeafe', border: '1px solid #c7d2fe',
                      color: '#2563eb', fontSize: 12, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 99,
                    }}>💡 {uc.label.trim()}</span>
                    {uc.desc.trim() && (
                      <span style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                        {uc.desc}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button type="button"
            onClick={addUseCase}
            style={{
              ...S.addBtn,
              width: '100%', justifyContent: 'center',
              borderRadius: 10, padding: '10px 16px', marginTop: 12,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
            + Add Use Case Card
          </button>
        </Section>

        {/* ── 9. Tags ── */}
        <Section title="Tags" sub="Shown as #NTC #Arduino etc. Also used to auto-generate 'What You Can Do' cards.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {tags.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#dbeafe', border: '1px solid #c7d2fe',
                borderRadius: 99, padding: '5px 12px',
              }}>
                <span style={{ color: '#6366f1', fontSize: 13, fontWeight: 700 }}>#</span>
                <input
                  value={t.replace(/^#/, '')}
                  onChange={e => updateList(setTags, tags, i, e.target.value)}
                  style={{
                    width: 70, background: 'transparent', border: 'none',
                    outline: 'none', fontSize: 13, color: '#2563eb', fontWeight: 500,
                  }}
                  placeholder="Arduino"
                />
                {tags.length > 1 && (
                  <button type="button"
                    onClick={() => removeItem(setTags, tags, i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 15, lineHeight: 1, padding: '0 0 0 2px' }}>
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button"
              onClick={() => addItem(setTags, tags)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#eff6ff', border: '1px dashed #c4b5fd',
                borderRadius: 99, padding: '5px 12px',
                fontSize: 13, fontWeight: 600, color: '#2563eb',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
              onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
              + Tag
            </button>
          </div>
        </Section>

        {/* ── Submit row ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 32 }}>
          <button type="button" onClick={resetForm}
            style={{
              padding: '10px 20px', borderRadius: 10,
              border: '1px solid #e5e7eb', background: '#fff',
              fontSize: 14, fontWeight: 600, color: '#374151',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            Reset
          </button>

          <button type="submit" disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 28px', borderRadius: 10,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(79,70,229,0.3)',
              transition: 'all 0.2s',
            }}>
            {loading
              ? <><span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'addSpin 0.8s linear infinite' }} /> Publishing…</>
              : 'Add Product'
            }
          </button>
        </div>

      </form>

      <style>{`
        @keyframes addSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        input::placeholder,
        textarea::placeholder { color: #9ca3af; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px !important; }
        @media (max-width: 600px) {
          form > div:first-child { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </>
  )
}

export default Add