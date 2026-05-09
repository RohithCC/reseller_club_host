// src/pages/Wishlist.jsx
//
// ✅ Redux integration:
//   wishlistSlice → state.wishlist.items  [{ id, name, price, mrp, image, category, inStock }]
//   cartSlice     → state.cart.items      [{ id, quantity, ... }]
//
//   Actions used:
//     toggleWishlist({ id, name, price, mrp, image, category, inStock }) → add / remove
//     clearWishlist()                                                     → remove all
//     addToCart({ id, name, price, mrp, image, category, inStock })       → add to cart
//
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiHeart, FiShoppingCart, FiTrash2, FiArrowLeft,
  FiPackage, FiStar, FiShare2, FiCheck,
  FiGrid, FiList, FiAlertCircle, FiX,
} from 'react-icons/fi'
import { toggleWishlist, clearWishlist } from '../app/wishlistSlice'
import { addToCart } from '../app/cartSlice'

// ─── Selectors ────────────────────────────────────────────────────────────────
const selectWishlistItems = (s) => s.wishlist.items
const selectCartItems     = (s) => s.cart.items

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice   = (n)   => `₹${Number(n ?? 0).toLocaleString('en-IN')}`
const discount   = (p,m) => (m > p ? Math.round(((m - p) / m) * 100) : 0)
const resolveImg = (img) => (Array.isArray(img) ? img[0] : img) || ''

// ─── Confirm Clear Modal ──────────────────────────────────────────────────────
function ConfirmClearModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiTrash2 className="text-red-500 text-3xl" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Clear Wishlist?</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          This will remove all items from your wishlist. This action cannot be undone.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-black text-sm transition-colors"
          >
            Yes, Clear Wishlist
          </button>
          <button
            onClick={onCancel}
            className="w-full border-2 border-gray-200 text-gray-600 hover:border-gray-300 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold transition-all
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <FiX size={14} />
      </button>
    </div>
  )
}

// ─── Wishlist Item Card (Grid View) ──────────────────────────────────────────
function WishlistCardGrid({ item, inCart, onRemove, onAddToCart, onShare }) {
  const [flash, setFlash] = useState(false)
  const disc  = discount(item.price, item.mrp)
  const image = resolveImg(item.image)

  const handleAdd = () => {
    onAddToCart(item)
    setFlash(true)
    setTimeout(() => setFlash(false), 1500)
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group relative flex flex-col">

      {/* Remove button */}
      <button
        onClick={() => onRemove(item)}
        className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-sm"
        title="Remove from wishlist"
      >
        <FiX size={14} />
      </button>

      {/* Discount badge */}
      {disc > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-green-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
          {disc}% OFF
        </div>
      )}

      {/* Image */}
      <Link to={`/product/${item.id}`} className="block">
        <div className="bg-gray-50 aspect-square flex items-center justify-center p-6 overflow-hidden">
          <img
            src={image}
            alt={item.name}
            className="max-h-36 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = 'https://placehold.co/200x200?text=📦' }}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">{item.category}</p>
          <Link to={`/product/${item.id}`}>
            <h3 className="text-sm font-black text-gray-900 leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
              {item.name}
            </h3>
          </Link>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.inStock ? 'bg-green-500' : 'bg-red-400'}`} />
          <span className={`text-xs font-bold ${item.inStock ? 'text-green-600' : 'text-red-500'}`}>
            {item.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xl font-black text-gray-900">{fmtPrice(item.price)}</span>
          {item.mrp > item.price && (
            <span className="text-xs text-gray-400 line-through">{fmtPrice(item.mrp)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleAdd}
            disabled={!item.inStock}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all
              ${flash || inCart
                ? 'bg-green-500 text-white'
                : item.inStock
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            {flash || inCart ? <FiCheck size={13} /> : <FiShoppingCart size={13} />}
            {flash ? 'Added!' : inCart ? 'In Cart' : item.inStock ? 'Add to Cart' : 'Unavailable'}
          </button>
          <button
            onClick={() => onShare(item)}
            className="w-9 h-9 flex items-center justify-center border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600 rounded-xl text-gray-400 transition-all flex-shrink-0"
            title="Share product"
          >
            <FiShare2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Wishlist Item Row (List View) ────────────────────────────────────────────
function WishlistRowList({ item, inCart, onRemove, onAddToCart, onShare }) {
  const [flash, setFlash] = useState(false)
  const disc  = discount(item.price, item.mrp)
  const image = resolveImg(item.image)

  const handleAdd = () => {
    onAddToCart(item)
    setFlash(true)
    setTimeout(() => setFlash(false), 1500)
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 p-4">

      {/* Image */}
      <Link to={`/product/${item.id}`} className="flex-shrink-0">
        <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden p-2">
          <img
            src={image}
            alt={item.name}
            className="max-h-full max-w-full object-contain"
            onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=📦' }}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">{item.category}</p>
        <Link to={`/product/${item.id}`}>
          <h3 className="text-sm font-black text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors">{item.name}</h3>
        </Link>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-base font-black text-gray-900">{fmtPrice(item.price)}</span>
          {item.mrp > item.price && (
            <>
              <span className="text-xs text-gray-400 line-through">{fmtPrice(item.mrp)}</span>
              <span className="text-[11px] bg-green-50 text-green-600 font-black px-1.5 py-0.5 rounded-full border border-green-100">
                {disc}% off
              </span>
            </>
          )}
          <span className={`flex items-center gap-1 text-xs font-bold ${item.inStock ? 'text-green-600' : 'text-red-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${item.inStock ? 'bg-green-500' : 'bg-red-400'}`} />
            {item.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleAdd}
          disabled={!item.inStock}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap
            ${flash || inCart
              ? 'bg-green-500 text-white'
              : item.inStock
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          {flash || inCart ? <FiCheck size={12} /> : <FiShoppingCart size={12} />}
          {flash ? 'Added!' : inCart ? 'In Cart' : 'Add to Cart'}
        </button>
        <button
          onClick={() => onShare(item)}
          className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:border-blue-300 hover:text-blue-600 rounded-lg text-gray-400 transition-all"
        >
          <FiShare2 size={13} />
        </button>
        <button
          onClick={() => onRemove(item)}
          className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:border-red-300 hover:text-red-500 rounded-lg text-gray-400 transition-all"
        >
          <FiTrash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Empty Wishlist State ─────────────────────────────────────────────────────
function EmptyWishlist() {
  return (
    <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-12 text-center shadow-sm max-w-sm w-full border-2 border-gray-100">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiHeart className="text-red-400 text-5xl" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Your Wishlist is Empty</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Save items you love by clicking the ❤️ heart icon on any product. They'll appear here for easy access later.
        </p>
        <Link
          to="/collection/Voltmeter"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-sm transition-colors shadow-lg shadow-blue-100 hover:shadow-blue-200"
        >
          <FiPackage size={15} /> Browse Products
        </Link>
      </div>
    </div>
  )
}

// ─── MAIN WISHLIST PAGE ───────────────────────────────────────────────────────
export default function Wishlist() {
  const dispatch      = useDispatch()
  const navigate      = useNavigate()
  const wishlistItems = useSelector(selectWishlistItems)
  const cartItems     = useSelector(selectCartItems)

  // ── UI state ─────────────────────────────────────────────────────
  const [viewMode,      setViewMode]      = useState('grid')   // 'grid' | 'list'
  const [showClearModal, setShowClearModal] = useState(false)
  const [toast,         setToast]         = useState(null)     // { message, type }
  const [sortBy,        setSortBy]        = useState('default') // 'default' | 'price-asc' | 'price-desc' | 'discount'

  // ── Toast helper ──────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Handlers ─────────────────────────────────────────────────────
  const handleRemove = (item) => {
    dispatch(toggleWishlist(item))
    showToast(`"${item.name}" removed from wishlist`, 'success')
  }

  const handleAddToCart = (item) => {
    if (!item.inStock) return
    dispatch(addToCart({
      id:       item.id,
      name:     item.name,
      price:    item.price,
      mrp:      item.mrp,
      image:    resolveImg(item.image),  // ✅ always a string — prevents Mongoose cast error
      category: item.category,
      subcat:   item.subcat ?? '',
      inStock:  item.inStock,
    }))
    showToast(`"${item.name}" added to cart! 🛒`)
  }

  const handleAddAllToCart = () => {
    const inStockItems = wishlistItems.filter((i) => i.inStock)
    if (!inStockItems.length) {
      showToast('No in-stock items to add', 'error')
      return
    }
    inStockItems.forEach((item) => {
      dispatch(addToCart({
        id:       item.id,
        name:     item.name,
        price:    item.price,
        mrp:      item.mrp,
        image:    resolveImg(item.image),
        category: item.category,
        subcat:   item.subcat ?? '',
        inStock:  item.inStock,
      }))
    })
    showToast(`${inStockItems.length} item${inStockItems.length > 1 ? 's' : ''} added to cart! 🛒`)
  }

  const handleClearConfirm = () => {
    dispatch(clearWishlist())
    setShowClearModal(false)
    showToast('Wishlist cleared')
  }

  const handleShare = (item) => {
    const url = `${window.location.origin}/product/${item.id}`
    navigator.clipboard?.writeText(url).then(() => showToast('Product link copied! 🔗'))
  }

  // ── Sort items ────────────────────────────────────────────────────
  const sortedItems = [...wishlistItems].sort((a, b) => {
    if (sortBy === 'price-asc')  return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    if (sortBy === 'discount')   return discount(b.price, b.mrp) - discount(a.price, a.mrp)
    return 0 // default: original order
  })

  const inStockCount  = wishlistItems.filter((i) => i.inStock).length
  const totalSavings  = wishlistItems.reduce((acc, i) => acc + ((i.mrp ?? i.price) - i.price) * (i.inStock ? 1 : 1), 0)

  // ── Empty state ───────────────────────────────────────────────────
  if (wishlistItems.length === 0) return <EmptyWishlist />

  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Clear confirmation modal */}
      {showClearModal && (
        <ConfirmClearModal
          onConfirm={handleClearConfirm}
          onCancel={() => setShowClearModal(false)}
        />
      )}

      <div className="bg-gray-50 min-h-screen">

        {/* ── BREADCRUMB ── */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-[1200px] mx-auto flex items-center gap-1.5 text-sm text-gray-400">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-700 font-semibold">Wishlist</span>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-6">

          {/* ── HEADER ── */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-blue-600"
              >
                <FiArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
                  <FiHeart className="text-red-500" />
                  My Wishlist
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved
                  {totalSavings > 0 && (
                    <span className="ml-2 text-green-600 font-bold">
                      · You save {fmtPrice(totalSavings)}!
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-2 rounded-xl transition-all bg-white"
              >
                <FiTrash2 size={13} /> Clear All
              </button>
              {inStockCount > 0 && (
                <button
                  onClick={handleAddAllToCart}
                  className="flex items-center gap-1.5 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-100"
                >
                  <FiShoppingCart size={13} />
                  Add All to Cart ({inStockCount})
                </button>
              )}
            </div>
          </div>

          {/* ── STATS BAR ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Items',    value: wishlistItems.length,          color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200'   },
              { label: 'In Stock',       value: inStockCount,                  color: 'text-green-600', bg: 'bg-green-50 border-green-200'  },
              { label: 'Out of Stock',   value: wishlistItems.length - inStockCount, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
              { label: 'Total Savings',  value: fmtPrice(totalSavings),        color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} border-2 rounded-2xl px-4 py-3 text-center`}>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── TOOLBAR ── */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 whitespace-nowrap">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-blue-400 transition-colors cursor-pointer"
              >
                <option value="default">Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Biggest Discount</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-white border-2 border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Grid view"
              >
                <FiGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="List view"
              >
                <FiList size={15} />
              </button>
            </div>
          </div>

          {/* ── OUT OF STOCK NOTICE ── */}
          {wishlistItems.length > inStockCount && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <FiAlertCircle className="text-amber-500 flex-shrink-0" size={16} />
              <p className="text-xs text-amber-700 font-medium">
                <span className="font-black">{wishlistItems.length - inStockCount} item{wishlistItems.length - inStockCount > 1 ? 's' : ''}</span> in your wishlist {wishlistItems.length - inStockCount > 1 ? 'are' : 'is'} currently out of stock.
                We'll hold them here — they may be restocked soon.
              </p>
            </div>
          )}

          {/* ── ITEMS GRID / LIST ── */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedItems.map((item) => (
                <WishlistCardGrid
                  key={item.id}
                  item={item}
                  inCart={cartItems.some((c) => c.id === item.id)}
                  onRemove={handleRemove}
                  onAddToCart={handleAddToCart}
                  onShare={handleShare}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedItems.map((item) => (
                <WishlistRowList
                  key={item.id}
                  item={item}
                  inCart={cartItems.some((c) => c.id === item.id)}
                  onRemove={handleRemove}
                  onAddToCart={handleAddToCart}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}

          {/* ── BOTTOM CTA ── */}
          <div className="mt-10 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 rounded-3xl p-7 sm:p-10 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[100px] flex items-center justify-center font-black">
              💙
            </div>
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl font-black mb-2">Keep Exploring!</h2>
              <p className="text-blue-100 text-sm mb-5 max-w-md mx-auto leading-relaxed">
                Discover more electronics, modules, and components — all from trusted brands at the best prices.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  to="/collection/Voltmeter"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-black px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 text-sm"
                >
                  <FiPackage size={15} /> Browse Products
                </Link>
                {inStockCount > 0 && (
                  <button
                    onClick={() => { handleAddAllToCart(); navigate('/cart') }}
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-black px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 text-sm"
                  >
                    <FiShoppingCart size={15} /> Go to Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
