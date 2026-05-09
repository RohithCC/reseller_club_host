// pages/List.jsx
// Categories & sub-categories are fetched from /api/category/tree (NOT hardcoded)
import axios from 'axios'
import React, { useEffect, useState, useCallback } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

// Icon hint options — must match Add.jsx
const ICON_OPTIONS = [
  'Default', 'IoT', 'Arduino', 'Raspberry', 'Robotics',
  'Automation', 'Learning', 'Sensor', 'Prototyping',
]

// ── Small reusable toggle ─────────────────────────────────────────────────────
const Toggle = ({ val, onToggle }) => (
  <div onClick={onToggle}
    className={`w-10 h-5 rounded-full cursor-pointer flex items-center px-0.5 transition-colors
      ${val ? 'bg-blue-600' : 'bg-gray-300'}`}>
    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform
      ${val ? 'translate-x-5' : 'translate-x-0'}`} />
  </div>
)

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ label, color }) => {
  const colors = {
    red:    'bg-red-100 text-red-700',
    green:  'bg-green-100 text-green-700',
    blue:   'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    gray:   'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors[color] || colors.gray}`}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
const List = ({ token }) => {

  // ── Product list state ────────────────────────────────────────────────────
  const [list,          setList]          = useState([])
  const [loading,       setLoading]       = useState(false)
  const [search,        setSearch]        = useState('')
  const [filterCat,     setFilterCat]     = useState('All')
  const [sortBy,        setSortBy]        = useState('date')
  const [editProduct,   setEditProduct]   = useState(null)
  const [editLoading,   setEditLoading]   = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // ── Category tree from API ────────────────────────────────────────────────
  const [categoryTree, setCategoryTree]   = useState([])
  const [catLoading,   setCatLoading]     = useState(true)

  // ── Edit form state ───────────────────────────────────────────────────────
  const [eName,       setEName]       = useState('')
  const [eDesc,       setEDesc]       = useState('')
  const [ePrice,      setEPrice]      = useState('')
  const [eOriginal,   setEOriginal]   = useState('')
  const [eCat,        setECat]        = useState('')
  const [eSub,        setESub]        = useState('')
  const [eStock,      setEStock]      = useState('')
  const [eWarranty,   setEWarranty]   = useState('')
  const [eReturn,     setEReturn]     = useState('')
  const [eBestseller, setEBestseller] = useState(false)
  const [eHot,        setEHot]        = useState(false)
  const [ePopular,    setEPopular]    = useState(false)
  const [eFeatured,   setEFeatured]   = useState(false)
  const [eInStock,    setEInStock]    = useState(true)
  const [eFeatures,   setEFeatures]   = useState([''])
  const [eSpecKey,    setESpecKey]    = useState([''])
  const [eSpecVal,    setESpecVal]    = useState([''])
  const [eTags,       setETags]       = useState([''])
  const [eImages,     setEImages]     = useState([false, false, false, false])

  // ── "What You Can Do" use-case cards in edit modal ───────────────────────
  const [eUseCases, setEUseCases] = useState([{ label: '', desc: '', icon: 'Default' }])

  // ── Derived: sub-options for selected category in edit modal ──────────────
  const editSubOptions = categoryTree.find(c => c.name === eCat)?.subCategories || []

  // ── Fetch category tree from API ──────────────────────────────────────────
  const fetchCategoryTree = useCallback(async () => {
    try {
      setCatLoading(true)
      const { data } = await axios.get(`${backendUrl}/api/category/tree?activeOnly=true`)
      if (data.success) setCategoryTree(data.tree)
      else toast.error('Could not load categories')
    } catch {
      toast.error('Failed to fetch categories')
    } finally {
      setCatLoading(false)
    }
  }, [])

  // ── Fetch product list ────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(backendUrl + '/api/product/list')
      if (res.data.success) setList(res.data.products)
      else toast.error(res.data.message)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchList()
    fetchCategoryTree()
  }, [fetchList, fetchCategoryTree])

  // ── Delete ────────────────────────────────────────────────────────────────
  const removeProduct = async (id) => {
    try {
      const res = await axios.post(
        backendUrl + '/api/product/remove',
        { id },
        { headers: { token } }
      )
      if (res.data.success) {
        toast.success(res.data.message)
        setDeleteConfirm(null)
        fetchList()
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ── Toggle stock ──────────────────────────────────────────────────────────
  const toggleStock = async (productId, currentStock) => {
    try {
      const res = await axios.post(
        backendUrl + '/api/product/toggle-stock',
        { productId, inStock: String(!currentStock) },
        { headers: { token } }
      )
      if (res.data.success) {
        toast.success('Stock updated')
        setList(prev => prev.map(p =>
          p._id === productId ? { ...p, inStock: !currentStock } : p
        ))
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (p) => {
    setEditProduct(p)
    setEName(p.name || '')
    setEDesc(p.description || '')
    setEPrice(p.price || '')
    setEOriginal(p.originalPrice || '')
    setEStock(p.stockCount || '')
    setEWarranty(p.warranty || '1 Year Warranty')
    setEReturn(p.returnPolicy || '30-Day Returns')
    setEBestseller(p.bestseller || false)
    setEHot(p.isHot || false)
    setEPopular(p.isPopular || false)
    setEFeatured(p.isFeatured || false)
    setEInStock(p.inStock !== false)
    setEFeatures(p.keyFeatures?.length ? p.keyFeatures : [''])

    const sk = p.specifications ? Object.keys(p.specifications)   : ['']
    const sv = p.specifications ? Object.values(p.specifications) : ['']
    setESpecKey(sk.length ? sk : [''])
    setESpecVal(sv.length ? sv : [''])

    setETags(p.tags?.length ? p.tags.map(t => t.replace(/^#/, '')) : [''])
    setEImages([false, false, false, false])

    // ── Restore use-case cards ──────────────────────────────────────────────
    // If the product has stored useCases use them; otherwise start with one blank card
    setEUseCases(
      p.useCases?.length
        ? p.useCases.map(uc => ({
            label: uc.label || '',
            desc:  uc.desc  || '',
            icon:  uc.icon  || 'Default',
          }))
        : [{ label: '', desc: '', icon: 'Default' }]
    )

    // ── Category ─────────────────────────────────────────────────────────────
    const matchedCat = categoryTree.find(c => c.name === p.category)
    const catName    = matchedCat ? matchedCat.name : (p.category || '')
    setECat(catName)

    const subs       = matchedCat?.subCategories || []
    const matchedSub = subs.find(s => s.name === p.subCategory)
    setESub(matchedSub ? matchedSub.name : (p.subCategory || ''))
  }

  // When eCat changes inside the edit modal, reset eSub to first available sub
  const handleEditCatChange = (newCat) => {
    setECat(newCat)
    const subs = categoryTree.find(c => c.name === newCat)?.subCategories || []
    setESub(subs[0]?.name || '')
  }

  // ── Use-case helpers (edit modal) ─────────────────────────────────────────
  const updateEUseCase = (i, field, val) =>
    setEUseCases(prev => prev.map((uc, idx) => idx === i ? { ...uc, [field]: val } : uc))
  const addEUseCase    = () =>
    setEUseCases(prev => [...prev, { label: '', desc: '', icon: 'Default' }])
  const removeEUseCase = (i) =>
    setEUseCases(prev => prev.filter((_, idx) => idx !== i))

  // ── Submit edit ───────────────────────────────────────────────────────────
  const submitEdit = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      const formData = new FormData()
      formData.append('productId',     editProduct._id)
      formData.append('name',          eName)
      formData.append('description',   eDesc)
      formData.append('price',         ePrice)
      formData.append('originalPrice', eOriginal || ePrice)
      formData.append('category',      eCat)
      formData.append('subCategory',   eSub)
      formData.append('stockCount',    eStock || '0')
      formData.append('warranty',      eWarranty)
      formData.append('returnPolicy',  eReturn)
      formData.append('bestseller',    String(eBestseller))
      formData.append('isHot',         String(eHot))
      formData.append('isPopular',     String(ePopular))
      formData.append('isFeatured',    String(eFeatured))
      formData.append('inStock',       String(eInStock))

      const specs = {}
      eSpecKey.forEach((k, i) => {
        if (k.trim() && eSpecVal[i]?.trim()) specs[k.trim()] = eSpecVal[i].trim()
      })

      // Only persist use-case cards that have a label
      const cleanUseCases = eUseCases.filter(uc => uc.label.trim())

      formData.append('keyFeatures',    JSON.stringify(eFeatures.filter(f => f.trim())))
      formData.append('tags',           JSON.stringify(eTags.filter(t => t.trim()).map(t => `#${t}`)))
      formData.append('specifications', JSON.stringify(specs))
      formData.append('useCases',       JSON.stringify(cleanUseCases))

      eImages.forEach((img, i) => { if (img) formData.append(`image${i + 1}`, img) })

      const res = await axios.post(
        backendUrl + '/api/product/update',
        formData,
        { headers: { token } }
      )
      if (res.data.success) {
        toast.success('Product updated')
        setEditProduct(null)
        fetchList()
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  // ── List helpers ──────────────────────────────────────────────────────────
  const updateList = (setter, arr, i, v) => { const n = [...arr]; n[i] = v; setter(n) }
  const addItem    = (setter, arr)        => setter([...arr, ''])
  const removeItem = (setter, arr, i)     => setter(arr.filter((_, idx) => idx !== i))

  const discount = (p) => p.originalPrice && p.price
    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0

  // ── Category filter options ───────────────────────────────────────────────
  const filterCategoryOptions = categoryTree.length > 0
    ? categoryTree.map(c => c.name)
    : [...new Set(list.map(p => p.category).filter(Boolean))]

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const displayed = list
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchCat    = filterCat === 'All' || p.category === filterCat
      return matchSearch && matchCat
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      if (sortBy === 'name')       return a.name.localeCompare(b.name)
      if (sortBy === 'rating')     return (b.averageRating || 0) - (a.averageRating || 0)
      return b.date - a.date
    })

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className='flex flex-col gap-4'>

      {/* ── Header ── */}
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h2 className='text-xl font-bold text-gray-800'>All Products</h2>
          <p className='text-sm text-gray-500'>{list.length} products total · {displayed.length} shown</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className='flex flex-wrap gap-3 items-center'>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder='Search products...'
          className='border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 w-64'
        />

        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className='border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500'>
          <option value='All'>All Categories</option>
          {catLoading
            ? <option disabled>Loading...</option>
            : filterCategoryOptions.map(c => <option key={c} value={c}>{c}</option>)
          }
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className='border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500'>
          <option value='date'>Newest First</option>
          <option value='price_asc'>Price: Low → High</option>
          <option value='price_desc'>Price: High → Low</option>
          <option value='name'>Name A–Z</option>
          <option value='rating'>Top Rated</option>
        </select>
      </div>

      {/* ── Table header ── */}
      <div className='hidden md:grid grid-cols-[80px_2fr_1fr_120px_100px_80px_110px] items-center
        px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wide'>
        <span>Image</span>
        <span>Product</span>
        <span>Category</span>
        <span>Price</span>
        <span>Stock</span>
        <span>Rating</span>
        <span className='text-center'>Actions</span>
      </div>

      {/* ── Rows ── */}
      {loading ? (
        <div className='text-center py-20 text-gray-400'>Loading...</div>
      ) : displayed.length === 0 ? (
        <div className='text-center py-20 text-gray-400'>No products found</div>
      ) : (
        displayed.map((item) => {
          const disc = discount(item)
          return (
            <div key={item._id}
              className='grid grid-cols-[80px_1fr] md:grid-cols-[80px_2fr_1fr_120px_100px_80px_110px]
                items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl
                hover:shadow-sm transition-shadow'>

              {/* Image */}
              <div className='relative'>
                <img src={item.image[0]} alt={item.name}
                  className='w-16 h-16 object-cover rounded-lg border border-gray-100' />
                {disc > 0 &&
                  <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold
                    px-1 py-0.5 rounded-full'>-{disc}%</span>}
              </div>

              {/* Name + badges */}
              <div className='min-w-0'>
                <p className='font-semibold text-gray-800 text-sm truncate'>{item.name}</p>
                <p className='text-xs text-blue-500 font-medium truncate mb-1'>
                  {item.subCategory || '—'}
                </p>
                <div className='flex flex-wrap gap-1'>
                  {item.bestseller && <Badge label='⭐ Bestseller' color='yellow' />}
                  {item.isHot      && <Badge label='🔥 HOT'        color='red'    />}
                  {item.isPopular  && <Badge label='👁 Popular'    color='blue'   />}
                  {item.isFeatured && <Badge label='📌 Featured'   color='blue'   />}
                  {item.useCases?.length > 0 && (
                    <Badge label={`💡 ${item.useCases.length} use case${item.useCases.length !== 1 ? 's' : ''}`} color='green' />
                  )}
                  {item.tags?.slice(0, 2).map(t => (
                    <span key={t} className='text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full'>{t}</span>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className='hidden md:block'>
                <p className='text-sm font-medium text-gray-700'>{item.category}</p>
                <p className='text-xs text-gray-400 mt-0.5'>{item.subCategory || '—'}</p>
              </div>

              {/* Price */}
              <div className='hidden md:block'>
                <p className='font-bold text-gray-800 text-sm'>{currency}{item.price}</p>
                {item.originalPrice > item.price &&
                  <p className='text-xs text-gray-400 line-through'>{currency}{item.originalPrice}</p>}
              </div>

              {/* Stock toggle */}
              <div className='hidden md:flex flex-col gap-1 items-start'>
                <Toggle val={item.inStock} onToggle={() => toggleStock(item._id, item.inStock)} />
                <span className={`text-[10px] font-medium ${item.inStock ? 'text-green-600' : 'text-red-500'}`}>
                  {item.inStock ? 'In Stock' : 'Out'}
                </span>
                {item.stockCount > 0 &&
                  <span className='text-[10px] text-gray-400'>{item.stockCount} units</span>}
              </div>

              {/* Rating */}
              <div className='hidden md:block'>
                {item.averageRating > 0 ? (
                  <>
                    <p className='text-sm font-semibold text-yellow-500'>★ {item.averageRating}</p>
                    <p className='text-[10px] text-gray-400'>{item.totalReviews} reviews</p>
                  </>
                ) : (
                  <p className='text-xs text-gray-300'>No reviews</p>
                )}
              </div>

              {/* Actions */}
              <div className='flex items-center gap-2 md:justify-center'>
                <button onClick={() => openEdit(item)}
                  className='p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm font-medium'>
                  ✏️ Edit
                </button>
                <button onClick={() => setDeleteConfirm(item._id)}
                  className='p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors text-sm font-medium'>
                  🗑
                </button>
              </div>

            </div>
          )
        })
      )}

      {/* ══ DELETE CONFIRM MODAL ═════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl'>
            <div className='text-4xl mb-3 text-center'>🗑️</div>
            <h3 className='text-lg font-bold text-gray-800 text-center mb-1'>Delete Product?</h3>
            <p className='text-sm text-gray-500 text-center mb-6'>This action cannot be undone.</p>
            <div className='flex gap-3'>
              <button onClick={() => setDeleteConfirm(null)}
                className='flex-1 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50'>
                Cancel
              </button>
              <button onClick={() => removeProduct(deleteConfirm)}
                className='flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium'>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT MODAL ═══════════════════════════════════════════════════════ */}
      {editProduct && (
        <div className='fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto'>
          <div className='bg-white rounded-2xl w-full max-w-3xl my-8 shadow-2xl'>

            {/* Modal header */}
            <div className='flex items-center justify-between px-6 py-4 border-b'>
              <h3 className='text-lg font-bold text-gray-800'>Edit Product</h3>
              <button onClick={() => setEditProduct(null)}
                className='text-gray-400 hover:text-gray-600 text-2xl leading-none'>×</button>
            </div>

            <form onSubmit={submitEdit} className='p-6 flex flex-col gap-5'>

              {/* Replace images */}
              <div>
                <p className='mb-1 font-semibold text-gray-700 text-sm'>Replace Images (optional)</p>
                <div className='flex gap-3'>
                  {editProduct.image.concat(['', '', '']).slice(0, 4).map((src, i) => (
                    <label key={i} htmlFor={`eimg${i}`} className='cursor-pointer'>
                      <div className='w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden
                        flex items-center justify-center bg-gray-50 hover:border-blue-400 transition relative'>
                        {eImages[i]
                          ? <img src={URL.createObjectURL(eImages[i])} className='w-full h-full object-cover' alt='' />
                          : src
                            ? <img src={src} className='w-full h-full object-cover' alt='' />
                            : <span className='text-gray-300 text-2xl'>+</span>
                        }
                        {eImages[i] &&
                          <div className='absolute inset-0 bg-blue-500/10 flex items-center justify-center'>
                            <span className='text-blue-600 text-[10px] font-bold'>NEW</span>
                          </div>}
                      </div>
                      <input type='file' id={`eimg${i}`} hidden accept='image/*'
                        onChange={e => {
                          const n = [...eImages]; n[i] = e.target.files[0]; setEImages(n)
                        }} />
                    </label>
                  ))}
                </div>
              </div>

              {/* Name + Description */}
              <div className='grid gap-3'>
                <div>
                  <p className='mb-1 text-sm font-semibold text-gray-700'>Product Name</p>
                  <input value={eName} onChange={e => setEName(e.target.value)} required className={inp} />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-gray-700'>Description</p>
                  <textarea value={eDesc} onChange={e => setEDesc(e.target.value)} rows={2}
                    className={inp + ' resize-none'} />
                </div>
              </div>

              {/* Category + Sub-category (from API) */}
              <div className='flex flex-wrap gap-3'>
                <div className='flex-1 min-w-[150px]'>
                  <p className='mb-1 text-sm font-semibold text-gray-700'>
                    Category <span className='text-red-500'>*</span>
                  </p>
                  {catLoading ? (
                    <div className='text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-2'>
                      Loading categories...
                    </div>
                  ) : categoryTree.length === 0 ? (
                    <input value={eCat} onChange={e => setECat(e.target.value)}
                      className={inp} placeholder='Enter category' />
                  ) : (
                    <select value={eCat} onChange={e => handleEditCatChange(e.target.value)} className={inp}>
                      {!categoryTree.find(c => c.name === eCat) && eCat && (
                        <option value={eCat}>{eCat} (current)</option>
                      )}
                      {categoryTree.map(c => (
                        <option key={c._id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className='flex-1 min-w-[150px]'>
                  <p className='mb-1 text-sm font-semibold text-gray-700'>
                    Sub Category <span className='text-red-500'>*</span>
                  </p>
                  {catLoading ? (
                    <div className='text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-2'>
                      Loading...
                    </div>
                  ) : editSubOptions.length === 0 ? (
                    <input value={eSub} onChange={e => setESub(e.target.value)}
                      className={inp} placeholder='Enter sub-category' />
                  ) : (
                    <select value={eSub} onChange={e => setESub(e.target.value)} className={inp}>
                      {!editSubOptions.find(s => s.name === eSub) && eSub && (
                        <option value={eSub}>{eSub} (current)</option>
                      )}
                      {editSubOptions.map(s => (
                        <option key={s._id || s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className='min-w-[110px]'>
                  <p className='mb-1 text-sm font-semibold text-gray-700'>MRP ₹</p>
                  <input value={eOriginal} onChange={e => setEOriginal(e.target.value)} type='number' className={inp} />
                </div>
                <div className='min-w-[110px]'>
                  <p className='mb-1 text-sm font-semibold text-gray-700'>Sale Price ₹</p>
                  <input value={ePrice} onChange={e => setEPrice(e.target.value)} type='number' required className={inp} />
                </div>
                <div className='min-w-[100px]'>
                  <p className='mb-1 text-sm font-semibold text-gray-700'>Stock Qty</p>
                  <input value={eStock} onChange={e => setEStock(e.target.value)} type='number' className={inp} />
                </div>
              </div>

              {/* Warranty + Return */}
              <div className='flex flex-wrap gap-3'>
                <div className='flex-1 min-w-[160px]'>
                  <p className='mb-1 text-sm font-semibold text-gray-700'>Warranty</p>
                  <select value={eWarranty} onChange={e => setEWarranty(e.target.value)} className={inp}>
                    <option>1 Year Warranty</option>
                    <option>6 Months Warranty</option>
                    <option>2 Year Warranty</option>
                    <option>No Warranty</option>
                  </select>
                </div>
                <div className='flex-1 min-w-[160px]'>
                  <p className='mb-1 text-sm font-semibold text-gray-700'>Return Policy</p>
                  <select value={eReturn} onChange={e => setEReturn(e.target.value)} className={inp}>
                    <option>30-Day Returns</option>
                    <option>7-Day Returns</option>
                    <option>No Returns</option>
                  </select>
                </div>
              </div>

              {/* Badges */}
              <div>
                <p className='mb-2 text-sm font-semibold text-gray-700'>Badges</p>
                <div className='flex flex-wrap gap-4'>
                  {[
                    { label: '⭐ Bestseller', val: eBestseller, set: setEBestseller },
                    { label: '🔥 HOT',        val: eHot,        set: setEHot        },
                    { label: '👁 Popular',    val: ePopular,    set: setEPopular    },
                    { label: '📌 Featured',   val: eFeatured,   set: setEFeatured   },
                    { label: '✅ In Stock',   val: eInStock,    set: setEInStock    },
                  ].map(({ label, val, set }) => (
                    <label key={label} className='flex items-center gap-2 cursor-pointer select-none'>
                      <Toggle val={val} onToggle={() => set(p => !p)} />
                      <span className={`text-xs font-medium ${val ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Key Features */}
              <div>
                <p className='mb-1 text-sm font-semibold text-gray-700'>Key Features</p>
                {eFeatures.map((f, i) => (
                  <div key={i} className='flex gap-2 mb-2'>
                    <input value={f} onChange={e => updateList(setEFeatures, eFeatures, i, e.target.value)}
                      className={inp} placeholder={`Feature ${i + 1}`} />
                    {eFeatures.length > 1 &&
                      <button type='button' onClick={() => removeItem(setEFeatures, eFeatures, i)}
                        className='text-red-400 px-2 text-xl'>×</button>}
                  </div>
                ))}
                <button type='button' onClick={() => addItem(setEFeatures, eFeatures)}
                  className='text-blue-600 text-sm hover:underline'>+ Add</button>
              </div>

              {/* Specifications */}
              <div>
                <p className='mb-1 text-sm font-semibold text-gray-700'>Specifications</p>
                {eSpecKey.map((k, i) => (
                  <div key={i} className='flex gap-2 mb-2'>
                    <input value={k} onChange={e => updateList(setESpecKey, eSpecKey, i, e.target.value)}
                      className='w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500'
                      placeholder='Key' />
                    <input value={eSpecVal[i] || ''} onChange={e => updateList(setESpecVal, eSpecVal, i, e.target.value)}
                      className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500'
                      placeholder='Value' />
                    {eSpecKey.length > 1 &&
                      <button type='button'
                        onClick={() => { removeItem(setESpecKey, eSpecKey, i); removeItem(setESpecVal, eSpecVal, i) }}
                        className='text-red-400 px-2 text-xl'>×</button>}
                  </div>
                ))}
                <button type='button' onClick={() => { addItem(setESpecKey, eSpecKey); addItem(setESpecVal, eSpecVal) }}
                  className='text-blue-600 text-sm hover:underline'>+ Add</button>
              </div>

              {/* ── What You Can Do (Use Cases) ──────────────────────────────── */}
              <div>
                <div className='flex items-start justify-between mb-1'>
                  <div>
                    <p className='text-sm font-semibold text-gray-700'>What You Can Do</p>
                    <p className='text-xs text-gray-400 mt-0.5'>
                      Project idea cards on the product page. Leave empty to auto-generate from Tags.
                    </p>
                  </div>
                  {eUseCases.filter(uc => uc.label.trim()).length > 0 && (
                    <span className='text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full mt-1 flex-shrink-0'>
                      {eUseCases.filter(uc => uc.label.trim()).length} card{eUseCases.filter(uc => uc.label.trim()).length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className='flex flex-col gap-3 mt-2'>
                  {eUseCases.map((uc, i) => (
                    <div key={i}
                      className='border border-gray-200 rounded-xl p-4 bg-gray-50 hover:border-blue-300 transition-colors'>

                      {/* Card header */}
                      <div className='flex items-center justify-between mb-3'>
                        <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>
                          Use Case {i + 1}
                        </span>
                        {eUseCases.length > 1 && (
                          <button type='button' onClick={() => removeEUseCase(i)}
                            className='text-red-400 hover:text-red-600 text-lg leading-none w-6 h-6
                              flex items-center justify-center rounded hover:bg-red-50 transition-colors'>
                            ×
                          </button>
                        )}
                      </div>

                      <div className='grid gap-3'>
                        {/* Label + Icon */}
                        <div className='flex gap-2'>
                          <div className='flex-1'>
                            <label className='text-xs font-semibold text-gray-500 block mb-1'>
                              Title / Label <span className='text-red-400'>*</span>
                            </label>
                            <input
                              value={uc.label}
                              onChange={e => updateEUseCase(i, 'label', e.target.value)}
                              className={inp}
                              placeholder='e.g. IoT Projects, Home Automation'
                            />
                          </div>
                          <div className='w-36'>
                            <label className='text-xs font-semibold text-gray-500 block mb-1'>Icon</label>
                            <select
                              value={uc.icon}
                              onChange={e => updateEUseCase(i, 'icon', e.target.value)}
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
                            onChange={e => updateEUseCase(i, 'desc', e.target.value)}
                            className={inp}
                            placeholder='e.g. Build smart sensors and connect devices to your IoT network'
                          />
                        </div>

                        {/* Preview pill */}
                        {uc.label.trim() && (
                          <div className='flex items-center gap-2'>
                            <span className='text-xs text-gray-400'>Preview:</span>
                            <span className='inline-flex items-center gap-1.5 bg-white border border-blue-200
                              text-blue-700 text-xs font-semibold px-3 py-1 rounded-full'>
                              💡 {uc.label.trim()}
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

                <button type='button' onClick={addEUseCase}
                  className='mt-3 flex items-center gap-2 text-blue-600 text-sm bg-blue-50
                    border border-dashed border-blue-300 rounded-xl px-4 py-2.5
                    hover:bg-blue-100 transition-colors w-full justify-center'>
                  <span className='text-base leading-none'>+</span> Add Use Case Card
                </button>
              </div>

              {/* Tags */}
              <div>
                <p className='mb-1 text-sm font-semibold text-gray-700'>Tags</p>
                <p className='text-xs text-gray-400 mb-2'>
                  Auto-generates "What You Can Do" cards if no use-case cards are set above.
                </p>
                <div className='flex flex-wrap gap-2'>
                  {eTags.map((t, i) => (
                    <div key={i} className='flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1'>
                      <span className='text-blue-400 text-sm'>#</span>
                      <input value={t.replace(/^#/, '')} onChange={e => updateList(setETags, eTags, i, e.target.value)}
                        className='w-20 bg-transparent text-sm outline-none text-blue-700' placeholder='tag' />
                      {eTags.length > 1 &&
                        <button type='button' onClick={() => removeItem(setETags, eTags, i)}
                          className='text-blue-300 hover:text-red-400 text-xs ml-1'>×</button>}
                    </div>
                  ))}
                  <button type='button' onClick={() => addItem(setETags, eTags)}
                    className='text-blue-600 text-sm bg-blue-50 border border-dashed border-blue-300 rounded-full px-3 py-1'>
                    + Tag
                  </button>
                </div>
              </div>

              {/* Modal footer */}
              <div className='flex gap-3 pt-2 border-t'>
                <button type='button' onClick={() => setEditProduct(null)}
                  className='flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50'>
                  Cancel
                </button>
                <button type='submit' disabled={editLoading}
                  className='flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                    text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2'>
                  {editLoading
                    ? <><span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Saving...</>
                    : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default List