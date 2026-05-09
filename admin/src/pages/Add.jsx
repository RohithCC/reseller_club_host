// pages/Add.jsx  ─── categories loaded from /api/category/tree
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

// Icon hint options for "What You Can Do" cards
const ICON_OPTIONS = [
  'Default', 'IoT', 'Arduino', 'Raspberry', 'Robotics',
  'Automation', 'Learning', 'Sensor', 'Prototyping',
]

const Add = ({ token }) => {

  // ── Category/sub state (from API) ──────────────────────────────────────────
  const [categoryTree,  setCategoryTree]  = useState([])
  const [category,      setCategory]      = useState('')
  const [subCategory,   setSubCategory]   = useState('')

  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)

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

  // ── "What You Can Do" use-case cards ──────────────────────────────────────
  // Each card: { label, desc, icon }
  const [useCases, setUseCases] = useState([
    { label: '', desc: '', icon: 'Default' }
  ])

  const [loading, setLoading] = useState(false)

  // ── Fetch category tree on mount ───────────────────────────────────────────
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/category/tree?activeOnly=true`)
        if (data.success && data.tree.length > 0) {
          setCategoryTree(data.tree)
          setCategory(data.tree[0].name)
          setSubCategory(data.tree[0].subCategories?.[0]?.name || '')
        }
      } catch {
        toast.error('Could not load categories.')
      }
    }
    fetchTree()
  }, [])

  const subOptions = categoryTree.find(c => c.name === category)?.subCategories || []

  const handleCategoryChange = (e) => {
    const cat = e.target.value
    setCategory(cat)
    const subs = categoryTree.find(c => c.name === cat)?.subCategories || []
    setSubCategory(subs[0]?.name || '')
  }

  const discount = originalPrice && price
    ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

  // ── Generic list helpers ───────────────────────────────────────────────────
  const updateList = (setter, list, i, val) => { const n = [...list]; n[i] = val; setter(n) }
  const addItem    = (setter, list)         => setter([...list, ''])
  const removeItem = (setter, list, i)      => setter(list.filter((_, idx) => idx !== i))

  // ── Use-case helpers ───────────────────────────────────────────────────────
  const updateUseCase = (i, field, val) => {
    setUseCases(prev => prev.map((uc, idx) => idx === i ? { ...uc, [field]: val } : uc))
  }
  const addUseCase = () =>
    setUseCases(prev => [...prev, { label: '', desc: '', icon: 'Default' }])
  const removeUseCase = (i) =>
    setUseCases(prev => prev.filter((_, idx) => idx !== i))

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
  const onSubmitHandler = async (e) => {
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

      // Only send use-cases that have at least a label
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
      console.log(error); toast.error(error.message)
    } finally { setLoading(false) }
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white'

  return (
    <form onSubmit={onSubmitHandler}
      className='flex flex-col w-full items-start gap-6 p-6 bg-white rounded-xl shadow-sm max-w-4xl'>

      <h2 className='text-xl font-bold text-gray-800'>Add New Product</h2>

      {/* ── Images ── */}
      <div>
        <p className='mb-1 font-semibold text-gray-700'>Product Images</p>
        <p className='text-xs text-gray-400 mb-3'>First image will be the thumbnail shown on listings</p>
        <div className='flex gap-3 flex-wrap'>
          {[
            { img: image1, set: setImage1, id: 'image1', label: 'Main' },
            { img: image2, set: setImage2, id: 'image2', label: '2nd'  },
            { img: image3, set: setImage3, id: 'image3', label: '3rd'  },
            { img: image4, set: setImage4, id: 'image4', label: '4th'  },
          ].map(({ img, set, id, label }) => (
            <label key={id} htmlFor={id} className='cursor-pointer group'>
              <div className={`w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center
                border-2 border-dashed transition-all
                ${img ? 'border-blue-400' : 'border-gray-300 group-hover:border-blue-400 bg-gray-50'}`}>
                {img
                  ? <img src={URL.createObjectURL(img)} className='w-full h-full object-cover' alt='' />
                  : <div className='text-center text-gray-400 text-xs p-2'>
                      <div className='text-2xl mb-1'>+</div><span>{label}</span>
                    </div>}
              </div>
              <input onChange={e => set(e.target.files[0])} type='file' id={id} hidden accept='image/*' />
            </label>
          ))}
        </div>
      </div>

      {/* ── Name & Description ── */}
      <div className='w-full grid gap-4'>
        <div>
          <p className='mb-1 font-semibold text-gray-700'>Product Name <span className='text-red-500'>*</span></p>
          <input value={name} onChange={e => setName(e.target.value)} required
            className={inp} placeholder='e.g. 10K Thermistor Temperature Sensor Module' />
        </div>
        <div>
          <p className='mb-1 font-semibold text-gray-700'>Description <span className='text-red-500'>*</span></p>
          <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3}
            className={inp + ' resize-none'} placeholder='Detailed product description...' />
        </div>
      </div>

      {/* ── Category + Price ── */}
      <div className='flex flex-wrap gap-4 w-full'>

        {/* Category — from API */}
        <div className='flex-1 min-w-[170px]'>
          <p className='mb-1 font-semibold text-gray-700'>Category <span className='text-red-500'>*</span></p>
          {categoryTree.length === 0
            ? <div className='text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-2'>
                Loading categories...
              </div>
            : <select value={category} onChange={handleCategoryChange} className={inp}>
                {categoryTree.map(c => (
                  <option key={c._id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
          }
        </div>

        {/* Sub-Category — from API */}
        <div className='flex-1 min-w-[170px]'>
          <p className='mb-1 font-semibold text-gray-700'>Sub Category <span className='text-red-500'>*</span></p>
          {subOptions.length === 0
            ? <div className='text-xs text-amber-500 border border-dashed border-amber-300 rounded-lg px-3 py-2'>
                No sub-categories — add them in the Categories page
              </div>
            : <select value={subCategory} onChange={e => setSubCategory(e.target.value)} className={inp}>
                {subOptions.map(s => (
                  <option key={s._id || s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
          }
        </div>

        <div className='min-w-[130px]'>
          <p className='mb-1 font-semibold text-gray-700'>MRP ₹</p>
          <input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)}
            type='number' min='0' className={inp} placeholder='50' />
        </div>
        <div className='min-w-[130px]'>
          <p className='mb-1 font-semibold text-gray-700'>Sale Price ₹ <span className='text-red-500'>*</span></p>
          <input value={price} onChange={e => setPrice(e.target.value)}
            type='number' min='0' required className={inp} placeholder='35' />
        </div>
        <div className='min-w-[110px]'>
          <p className='mb-1 font-semibold text-gray-700'>Stock Qty</p>
          <input value={stockCount} onChange={e => setStockCount(e.target.value)}
            type='number' min='0' className={inp} placeholder='100' />
        </div>
      </div>

      {discount > 0 && (
        <div className='flex items-center gap-2 -mt-2'>
          <span className='bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full'>
            {discount}% OFF
          </span>
          <span className='text-xs text-gray-500'>Discount badge shown on product card</span>
        </div>
      )}

      {/* ── Warranty & Returns ── */}
      <div className='flex flex-wrap gap-4'>
        <div className='min-w-[190px]'>
          <p className='mb-1 font-semibold text-gray-700'>Warranty</p>
          <select value={warranty} onChange={e => setWarranty(e.target.value)} className={inp}>
            <option>1 Year Warranty</option>
            <option>6 Months Warranty</option>
            <option>2 Year Warranty</option>
            <option>No Warranty</option>
          </select>
        </div>
        <div className='min-w-[190px]'>
          <p className='mb-1 font-semibold text-gray-700'>Return Policy</p>
          <select value={returnPolicy} onChange={e => setReturnPolicy(e.target.value)} className={inp}>
            <option>30-Day Returns</option>
            <option>7-Day Returns</option>
            <option>No Returns</option>
          </select>
        </div>
      </div>

      {/* ── Badges ── */}
      <div>
        <p className='mb-2 font-semibold text-gray-700'>Product Badges</p>
        <div className='flex flex-wrap gap-4'>
          {[
            { label: '⭐ Bestseller', val: bestseller, set: setBestseller },
            { label: '🔥 HOT',        val: isHot,      set: setIsHot      },
            { label: '👁 Popular',    val: isPopular,  set: setIsPopular  },
            { label: '📌 Featured',   val: isFeatured, set: setIsFeatured },
            { label: '✅ In Stock',   val: inStock,    set: setInStock    },
          ].map(({ label, val, set }) => (
            <label key={label} className='flex items-center gap-2 cursor-pointer select-none'>
              <div onClick={() => set(p => !p)}
                className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-1
                  ${val ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                  ${val ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className={`text-sm font-medium ${val ? 'text-blue-600' : 'text-gray-500'}`}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Key Features ── */}
      <div className='w-full'>
        <p className='mb-1 font-semibold text-gray-700'>Key Features</p>
        <p className='text-xs text-gray-400 mb-2'>Bullet points shown on the product page</p>
        {keyFeatures.map((f, i) => (
          <div key={i} className='flex gap-2 mb-2'>
            <input value={f} onChange={e => updateList(setKeyFeatures, keyFeatures, i, e.target.value)}
              className={inp} placeholder={`Feature ${i+1} — e.g. Working voltage: 3.3V to 5V DC`} />
            {keyFeatures.length > 1 &&
              <button type='button' onClick={() => removeItem(setKeyFeatures, keyFeatures, i)}
                className='text-red-400 hover:text-red-600 px-2 text-xl leading-none'>×</button>}
          </div>
        ))}
        <button type='button' onClick={() => addItem(setKeyFeatures, keyFeatures)}
          className='text-blue-600 text-sm hover:underline'>+ Add Feature</button>
      </div>

      {/* ── Specifications ── */}
      <div className='w-full'>
        <p className='mb-1 font-semibold text-gray-700'>Specifications</p>
        <p className='text-xs text-gray-400 mb-2'>Key-value pairs shown in the Specifications tab</p>
        {specKey.map((k, i) => (
          <div key={i} className='flex gap-2 mb-2'>
            <input value={k} onChange={e => updateList(setSpecKey, specKey, i, e.target.value)}
              className='w-44 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500'
              placeholder='e.g. Supply Voltage' />
            <input value={specVal[i] || ''} onChange={e => updateList(setSpecVal, specVal, i, e.target.value)}
              className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500'
              placeholder='e.g. 3.3V - 5V DC' />
            {specKey.length > 1 &&
              <button type='button'
                onClick={() => { removeItem(setSpecKey, specKey, i); removeItem(setSpecVal, specVal, i) }}
                className='text-red-400 hover:text-red-600 px-2 text-xl leading-none'>×</button>}
          </div>
        ))}
        <button type='button' onClick={() => { addItem(setSpecKey, specKey); addItem(setSpecVal, specVal) }}
          className='text-blue-600 text-sm hover:underline'>+ Add Specification</button>
      </div>

      {/* ── What You Can Do (Use Cases) ────────────────────────────────────── */}
      <div className='w-full'>
        <div className='flex items-start justify-between mb-1'>
          <div>
            <p className='font-semibold text-gray-700'>What You Can Do</p>
            <p className='text-xs text-gray-400 mt-0.5'>
              Project idea cards shown in the "What You Can Do" tab on the product page.
              Leave empty to auto-generate from Tags.
            </p>
          </div>
          {/* Live count badge */}
          {useCases.filter(uc => uc.label.trim()).length > 0 && (
            <span className='text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full mt-1'>
              {useCases.filter(uc => uc.label.trim()).length} card{useCases.filter(uc => uc.label.trim()).length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className='flex flex-col gap-3 mt-3'>
          {useCases.map((uc, i) => (
            <div key={i}
              className='relative border border-gray-200 rounded-xl p-4 bg-gray-50 hover:border-blue-300 transition-colors'>

              {/* Card header */}
              <div className='flex items-center justify-between mb-3'>
                <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>
                  Use Case {i + 1}
                </span>
                {useCases.length > 1 && (
                  <button type='button' onClick={() => removeUseCase(i)}
                    className='text-red-400 hover:text-red-600 text-lg leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 transition-colors'>
                    ×
                  </button>
                )}
              </div>

              <div className='grid grid-cols-1 gap-3'>

                {/* Label + Icon row */}
                <div className='flex gap-2'>
                  <div className='flex-1'>
                    <label className='text-xs font-semibold text-gray-500 block mb-1'>
                      Title / Label <span className='text-red-400'>*</span>
                    </label>
                    <input
                      value={uc.label}
                      onChange={e => updateUseCase(i, 'label', e.target.value)}
                      className={inp}
                      placeholder='e.g. IoT Projects, Home Automation, Arduino'
                    />
                  </div>
                  <div className='w-40'>
                    <label className='text-xs font-semibold text-gray-500 block mb-1'>Icon</label>
                    <select
                      value={uc.icon}
                      onChange={e => updateUseCase(i, 'icon', e.target.value)}
                      className={inp}>
                      {ICON_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className='text-xs font-semibold text-gray-500 block mb-1'>
                    Short Description
                  </label>
                  <input
                    value={uc.desc}
                    onChange={e => updateUseCase(i, 'desc', e.target.value)}
                    className={inp}
                    placeholder='e.g. Build smart sensors and connect devices to your IoT network'
                  />
                </div>

                {/* Preview pill */}
                {uc.label.trim() && (
                  <div className='flex items-center gap-2 mt-1'>
                    <span className='text-xs text-gray-400'>Preview:</span>
                    <span className='inline-flex items-center gap-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full'>
                      <span>💡</span> {uc.label.trim()}
                    </span>
                    {uc.desc.trim() && (
                      <span className='text-xs text-gray-500 truncate max-w-xs'>{uc.desc}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button type='button' onClick={addUseCase}
          className='mt-3 flex items-center gap-2 text-blue-600 text-sm bg-blue-50
            border border-dashed border-blue-300 rounded-xl px-4 py-2.5
            hover:bg-blue-100 transition-colors w-full justify-center'>
          <span className='text-base leading-none'>+</span> Add Use Case Card
        </button>
      </div>

      {/* ── Tags ── */}
      <div className='w-full'>
        <p className='mb-1 font-semibold text-gray-700'>Tags</p>
        <p className='text-xs text-gray-400 mb-2'>
          Shown as #NTC #Arduino etc. on the product page.
          Also used to auto-generate "What You Can Do" cards if none are added above.
        </p>
        <div className='flex flex-wrap gap-2'>
          {tags.map((t, i) => (
            <div key={i} className='flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1'>
              <span className='text-blue-500 text-sm'>#</span>
              <input value={t.replace(/^#/, '')} onChange={e => updateList(setTags, tags, i, e.target.value)}
                className='w-20 bg-transparent text-sm outline-none text-blue-700' placeholder='Arduino' />
              {tags.length > 1 &&
                <button type='button' onClick={() => removeItem(setTags, tags, i)}
                  className='text-blue-300 hover:text-red-500 ml-1 text-xs'>×</button>}
            </div>
          ))}
          <button type='button' onClick={() => addItem(setTags, tags)}
            className='text-blue-600 text-sm bg-blue-50 border border-dashed border-blue-300 rounded-full px-3 py-1 hover:bg-blue-100'>
            + Tag
          </button>
        </div>
      </div>

      {/* ── Submit ── */}
      <button type='submit' disabled={loading}
        className='px-10 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
          disabled:bg-blue-300 disabled:cursor-not-allowed
          text-white font-semibold rounded-xl transition-colors flex items-center gap-2'>
        {loading
          ? <><span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Adding...</>
          : 'Add Product'}
      </button>

    </form>
  )
}

export default Add