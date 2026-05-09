// src/components/PopularCategories.jsx
//
// ✅ Fetches from GET /api/product/categories
// Response: { success, categories: [{ name, count, image }], total }
//
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 animate-pulse">
      <div className="w-20 h-20 bg-gray-200 rounded-xl" />
      <div className="h-4 bg-gray-200 rounded-full w-28" />
      <div className="h-3 bg-gray-100 rounded-full w-16" />
    </div>
  )
}

// ── Single category card ──────────────────────────────────────────────────────
function CategoryCard({ name, count, image, onClick }) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl shadow-sm p-5 flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 cursor-pointer text-left w-full"
    >
      {/* Image */}
      <div className="w-20 h-20 flex items-center justify-center overflow-hidden rounded-xl bg-gray-50 border border-gray-100 group-hover:border-blue-100 transition-colors">
        {image && !imgError ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-3xl">📦</span>
        )}
      </div>

      {/* Name */}
      <p className="text-sm font-black text-gray-800 text-center leading-snug group-hover:text-blue-600 transition-colors">
        {name}
      </p>

      {/* Count */}
      <p className="text-xs text-gray-400 font-medium">
        {count} product{count !== 1 ? 's' : ''}
      </p>
    </button>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function PopularCategories({ limit = 12 }) {
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`${BACKEND}/api/product/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.success) {
          setCategories(data.categories ?? [])
        } else {
          setError(data.message || 'Failed to load categories.')
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load categories.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const displayed = categories.slice(0, limit)

  return (
    <section className="bg-[#f7f9fc] py-14 px-4">
      <div className="max-w-[1200px] mx-auto">

        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            Popular Categories
          </h2>
          <p className="text-gray-500 text-base">
            Browse our wide range of electronic components and modules
          </p>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-10 text-gray-400 text-sm">{error}</div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)
            : displayed.map((cat) => (
                <CategoryCard
                  key={cat.name}
                  name={cat.name}
                  count={cat.count}
                  image={cat.image}
                  onClick={() => navigate(`/collection/${encodeURIComponent(cat.name)}`)}
                />
              ))
          }
        </div>

        {/* "View all categories" link — shown when there are more than limit */}
        {!loading && categories.length > limit && (
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/collection')}
              className="inline-flex items-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold px-8 py-3 rounded-full transition-all text-sm"
            >
              View All {categories.length} Categories →
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
