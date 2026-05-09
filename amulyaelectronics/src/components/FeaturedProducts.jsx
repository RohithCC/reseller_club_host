// src/components/FeaturedProducts.jsx
//
// ✅ Fetches from GET /api/product/featured?limit=8
// Response: { success, products: [...], total }
//
import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart }      from '../app/cartSlice'
import { toggleWishlist } from '../app/wishlistSlice'
import { FiShoppingCart, FiHeart } from 'react-icons/fi'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtPrice   = (n)   => `₹${Number(n ?? 0).toLocaleString('en-IN')}`
const discPct    = (p,m) => (m > p ? Math.round(((m - p) / m) * 100) : 0)
const resolveImg = (img) => Array.isArray(img) ? (img[0] || '') : (img || '')

// ── Star rating — matches screenshot (filled amber, empty gray) ───────────────
function Stars({ rating = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => {
        const filled = rating >= s
        const half   = !filled && rating > s - 1
        return (
          <svg key={s} width={14} height={14} viewBox="0 0 20 20">
            {half && (
              <defs>
                <linearGradient id={`hg-${s}`}>
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#e5e7eb" />
                </linearGradient>
              </defs>
            )}
            <path
              d="M10 1l2.39 4.84L18 6.79l-4 3.9.94 5.5L10 13.77l-4.94 2.42.94-5.5-4-3.9 5.61-.95z"
              fill={filled ? '#f59e0b' : half ? `url(#hg-${s})` : '#e5e7eb'}
              stroke={filled || half ? '#f59e0b' : '#d1d5db'}
              strokeWidth="0.5"
            />
          </svg>
        )
      })}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse shadow-sm">
      <div className="bg-gray-100 h-52" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded-full w-20" />
        <div className="h-5 bg-gray-200 rounded-full w-full" />
        <div className="h-3 bg-gray-200 rounded-full w-24" />
        <div className="h-5 bg-gray-200 rounded-full w-32" />
        <div className="h-10 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}

// ── Product Card — pixel-matched to screenshot ────────────────────────────────
function ProductCard({ product }) {
  const dispatch      = useDispatch()
  const navigate      = useNavigate()
  const cartItems     = useSelector((s) => s.cart.items)
  const wishlistItems = useSelector((s) => s.wishlist.items)

  const [flash,    setFlash]    = useState(false)
  const [imgError, setImgError] = useState(false)

  const pid    = product._id
  const image  = resolveImg(product.image)
  const price  = product.price ?? 0
  const mrp    = product.mrp   ?? price
  const disc   = discPct(price, mrp)
  const rating = product.averageRating ?? 0
  const inCart = cartItems.some((i) => i.id === pid)
  const wished = wishlistItems.some((i) => i.id === pid)

  const cartProduct = {
    id:       pid,
    name:     product.name,
    price,
    mrp,
    image,                        // ✅ always string — no Mongoose cast error
    category: product.category,
    subcat:   product.subcat ?? '',
    inStock:  product.inStock ?? true,
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (!product.inStock) return
    dispatch(addToCart(cartProduct))
    setFlash(true)
    setTimeout(() => setFlash(false), 1800)
  }

  const handleWishlist = (e) => {
    e.stopPropagation()
    dispatch(toggleWishlist(cartProduct))
  }

  // ── Badge logic — matches screenshot pill labels exactly ──────────────────
  // Screenshot shows: HOT (red), TOP (purple), -14% (green)
  const badge = (() => {
    if (product.isHot)      return { label: 'HOT',        cls: 'bg-red-500 text-white'    }
    if (product.bestseller) return { label: 'TOP',        cls: 'bg-purple-600 text-white' }
    if (disc > 0)           return { label: `-${disc}%`,  cls: 'bg-green-500 text-white'  }
    if (product.isFeatured) return { label: 'FEATURED',   cls: 'bg-blue-600 text-white'   }
    return null
  })()

  return (
    <div
      onClick={() => navigate(`/product/${pid}`)}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-xl shadow-sm overflow-hidden transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* ── IMAGE AREA ── */}
      <div className="relative bg-white flex items-center justify-center" style={{ height: 220 }}>

        {/* Badge pill — top left, exactly as in screenshot */}
        {badge && (
          <span className={`absolute top-3 left-3 z-10 text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        {/* Wishlist heart — top right, light gray, fills red when active */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            wished ? 'text-red-500' : 'text-gray-300 hover:text-red-400'
          }`}
        >
          <FiHeart size={16} fill={wished ? 'currentColor' : 'none'} />
        </button>

        {/* Product image */}
        {image && !imgError ? (
          <img
            src={image}
            alt={product.name}
            className="object-contain p-5 group-hover:scale-105 transition-transform duration-500 w-full h-full"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-6xl">📦</span>
        )}
      </div>

      {/* thin separator */}
      <div className="h-px bg-gray-100" />

      {/* ── INFO AREA ── */}
      <div className="p-4 flex flex-col gap-2 flex-1">

        {/* Category — tiny blue caps, matches screenshot */}
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest truncate">
          {product.category}
        </p>

        {/* Product name — bold dark, 2 lines max */}
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors flex-1">
          {product.name}
        </h3>

        {/* Stars + review count — matches screenshot spacing */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <Stars rating={rating} />
          {(product.totalReviews ?? 0) > 0 && (
            <span className="text-xs text-gray-400">({product.totalReviews})</span>
          )}
        </div>

        {/* Price row — ₹95  ₹145  34% off — exactly as screenshot */}
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-xl font-black text-gray-900">{fmtPrice(price)}</span>
          {mrp > price && (
            <>
              <span className="text-sm text-gray-400 line-through">{fmtPrice(mrp)}</span>
              <span className="text-xs font-bold text-orange-500">{disc}% off</span>
            </>
          )}
        </div>

        {/* Add to Cart — full-width blue, exactly as screenshot */}
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all mt-2 ${
            flash
              ? 'bg-green-500 text-white'
              : inCart
                ? 'bg-green-600 text-white'
                : product.inStock
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <FiShoppingCart size={15} />
          {flash ? 'Added!' : inCart ? '✓ In Cart' : product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  )
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function FeaturedProducts({ limit = 4 }) {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`${BACKEND}/api/product/featured?limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.success) setProducts(data.products ?? [])
        else              setError(data.message || 'Failed to load.')
      })
      .catch(() => { if (!cancelled) setError('Failed to load featured products.') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [limit])

  if (!loading && products.length === 0 && !error) return null

  return (
    <section className="bg-white py-14 px-4">
      <div className="max-w-[1200px] mx-auto">

        {/* ── Centered header — matches screenshot ── */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            Featured Products
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Trending components loved by engineers &amp; hobbyists across India
          </p>
        </div>

        {error && !loading && (
          <p className="text-center text-gray-400 text-sm py-8">{error}</p>
        )}

        {/* ── 4-col grid (2 on mobile) — matches screenshot ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p) => <ProductCard key={p._id} product={p} />)
          }
        </div>

        {!loading && products.length > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/collection')}
              className="inline-flex items-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold px-10 py-3 rounded-full transition-all text-sm"
            >
              <FiShoppingCart size={14} /> View All Products
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
