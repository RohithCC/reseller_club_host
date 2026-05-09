// src/components/SearchModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full-featured search modal:
//   ✅ Live typeahead suggestions (debounced 300ms) from API
//   ✅ Category filter pills (fetched from API on first open)
//   ✅ Full product results grid with images + prices
//   ✅ Pagination
//   ✅ Keyboard: Escape closes, Enter submits, ↑↓ navigates suggestions
//   ✅ Mobile responsive
//   ✅ Redux-connected via searchSlice
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate }       from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiSearch, FiX, FiArrowRight, FiChevronLeft,
  FiChevronRight, FiTrendingUp, FiGrid, FiAlertCircle,
} from 'react-icons/fi'
import {
  closeSearch,
  setQuery,
  setActiveCategory,
  setPage,
  clearResults,
  fetchSuggestions,
  searchProducts,
  fetchCategories,
  selectSearchQuery,
  selectActiveCategory,
  selectSuggestions,
  selectSuggestLoading,
  selectSearchResults,
  selectSearchTotal,
  selectSearchPage,
  selectSearchTotalPages,
  selectResultsLoading,
  selectResultsError,
  selectCategories,
} from '../app/searchSlice'

const QUICK_SEARCHES = [
  'Arduino Kit', 'Sensors', 'Voltmeter', 'Soldering Iron',
  'Battery', 'Motor Driver', 'Servo Motor', 'Relay Module',
]

const fmtPrice = (n) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

// ─── Product result card ──────────────────────────────────────────────────────
function ResultCard({ product, onClose }) {
  const navigate = useNavigate()
  const price    = product.salePrice ?? product.price ?? 0
  const mrp      = product.mrp ?? price
  const disc     = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  const handleClick = () => {
    navigate(`/product/${product._id}`)
    onClose()
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all duration-200 text-left group w-full"
    >
      <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img
          src={product.image || 'https://placehold.co/56x56?text=📦'}
          alt={product.name}
          className="max-w-full max-h-full object-contain p-1"
          onError={(e) => { e.target.src = 'https://placehold.co/56x56?text=📦' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
          {product.name}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{product.category}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-black text-blue-700">{fmtPrice(price)}</span>
          {disc > 0 && (
            <>
              <span className="text-[10px] text-gray-400 line-through">{fmtPrice(mrp)}</span>
              <span className="text-[9px] bg-green-100 text-green-700 font-black px-1.5 py-0.5 rounded-full">
                {disc}% off
              </span>
            </>
          )}
        </div>
      </div>
      <FiArrowRight className="text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" size={14} />
    </button>
  )
}

// ─── Suggestion item ─────────────────────────────────────────────────────────
function SuggestionItem({ item, onSelect, isActive }) {
  return (
    <button
      onClick={() => onSelect(item.name)}
      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
        isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img
          src={item.image || 'https://placehold.co/32x32?text=📦'}
          alt={item.name}
          className="max-w-full max-h-full object-contain"
          onError={(e) => { e.target.src = 'https://placehold.co/32x32?text=📦' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{item.name}</p>
        <p className="text-[10px] text-gray-400">{item.category}</p>
      </div>
      <span className="text-xs font-bold text-blue-600 flex-shrink-0">{fmtPrice(item.price)}</span>
    </button>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <FiChevronLeft size={14} />
      </button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
        return (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
              p === page
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
            }`}>
            {p}
          </button>
        )
      })}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <FiChevronRight size={14} />
      </button>
    </div>
  )
}

// ─── MAIN SEARCH MODAL ───────────────────────────────────────────────────────
export default function SearchModal() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()

  const query          = useSelector(selectSearchQuery)
  const activeCategory = useSelector(selectActiveCategory)
  const suggestions    = useSelector(selectSuggestions)
  const suggestLoading = useSelector(selectSuggestLoading)
  const results        = useSelector(selectSearchResults)
  const total          = useSelector(selectSearchTotal)
  const page           = useSelector(selectSearchPage)
  const totalPages     = useSelector(selectSearchTotalPages)
  const resultsLoading = useSelector(selectResultsLoading)
  const resultsError   = useSelector(selectResultsError)
  const categories     = useSelector(selectCategories)

  const inputRef       = useRef(null)
  const debounceRef    = useRef(null)
  const [activeSuggest, setActiveSuggest] = useState(-1)
  const [showSuggest,   setShowSuggest]   = useState(false)

  // ── Focus input + fetch categories on mount ───────────────────────────────
  useEffect(() => {
    inputRef.current?.focus()
    if (categories.length === 0) dispatch(fetchCategories())
  }, [])

  // ── Close on Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') dispatch(closeSearch()) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dispatch])

  // ── Debounced suggestion fetch ────────────────────────────────────────────
  const handleQueryChange = useCallback((val) => {
    dispatch(setQuery(val))
    setActiveSuggest(-1)

    clearTimeout(debounceRef.current)
    if (val.trim().length >= 2) {
      setShowSuggest(true)
      debounceRef.current = setTimeout(() => {
        dispatch(fetchSuggestions(val))
      }, 300)
    } else {
      setShowSuggest(false)
      dispatch(clearResults())
    }
  }, [dispatch])

  // ── Run full search ───────────────────────────────────────────────────────
  const runSearch = useCallback((q = query, cat = activeCategory, pg = 1) => {
    if (!q.trim() && !cat) return
    setShowSuggest(false)
    dispatch(searchProducts({ q, category: cat, page: pg }))
  }, [query, activeCategory, dispatch])

  // ── Re-search when category or page changes ───────────────────────────────
  useEffect(() => {
    if (query.trim() || activeCategory) {
      runSearch(query, activeCategory, page)
    }
  }, [activeCategory, page])  // eslint-disable-line

  // ── Keyboard navigation in suggestions ───────────────────────────────────
  const handleKeyDown = (e) => {
    if (!showSuggest || suggestions.length === 0) {
      if (e.key === 'Enter') { e.preventDefault(); runSearch(); }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggest((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggest((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeSuggest >= 0) {
        handleSuggestionSelect(suggestions[activeSuggest].name)
      } else {
        runSearch()
      }
    }
  }

  const handleSuggestionSelect = (name) => {
    dispatch(setQuery(name))
    setShowSuggest(false)
    setActiveSuggest(-1)
    runSearch(name, activeCategory, 1)
  }

  const handleCategoryPill = (cat) => {
    const next = cat === activeCategory ? '' : cat
    dispatch(setActiveCategory(next))
    dispatch(setPage(1))
    // runSearch fires from the useEffect above
  }

  const handlePageChange = (p) => {
    dispatch(setPage(p))
    // runSearch fires from the useEffect above
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    runSearch()
  }

  const handleFullResultsPage = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}${activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : ''}`)
      dispatch(closeSearch())
    }
  }

  const hasResults  = results.length > 0
  const hasSearched = !!(query.trim() || activeCategory)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-4 sm:pt-16 px-3 sm:px-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={() => dispatch(closeSearch())}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Search Input ─────────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 focus-within:bg-white rounded-2xl px-4 py-3 transition-all duration-200">
              <FiSearch className="text-gray-400 flex-shrink-0 text-lg" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (query.trim().length >= 2 && suggestions.length > 0) setShowSuggest(true) }}
                placeholder="Search products, categories, kits…"
                className="flex-1 outline-none text-gray-800 bg-transparent text-sm sm:text-base placeholder-gray-400 font-medium"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { handleQueryChange(''); dispatch(clearResults()) }}
                  className="text-gray-400 hover:text-gray-700 flex-shrink-0 transition-colors"
                >
                  <FiX size={16} />
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-bold text-sm transition-colors flex-shrink-0 shadow-sm shadow-blue-200"
              >
                Search
              </button>
            </div>
          </form>

          {/* ── Live suggestions dropdown ─────────────────────────────────── */}
          {showSuggest && suggestions.length > 0 && (
            <div className="mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
              {suggestions.map((s, i) => (
                <SuggestionItem
                  key={s._id}
                  item={s}
                  isActive={i === activeSuggest}
                  onSelect={handleSuggestionSelect}
                />
              ))}
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-blue-50 text-xs font-bold text-gray-500 hover:text-blue-600 border-t border-gray-100 transition-colors"
              >
                <FiSearch size={11} />
                See all results for "<span className="text-blue-600">{query}</span>"
              </button>
            </div>
          )}
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">

          {/* ── Category filter pills ───────────────────────────────────── */}
          {categories.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2.5">
                <FiGrid className="text-gray-400" size={13} />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categories</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* "All" pill */}
                <button
                  onClick={() => handleCategoryPill('')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                    activeCategory === ''
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  All
                </button>
                {categories.slice(0, 18).map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryPill(cat.name)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                      activeCategory === cat.name
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {cat.name}
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      activeCategory === cat.name
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Quick searches (shown when nothing typed) ─────────────────── */}
          {!hasSearched && !resultsLoading && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <FiTrendingUp className="text-gray-400" size={13} />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Popular Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { dispatch(setQuery(s)); runSearch(s, activeCategory, 1) }}
                    className="text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-full transition-all font-semibold"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Loading state ─────────────────────────────────────────────── */}
          {resultsLoading && (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Searching…</p>
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────────── */}
          {resultsError && !resultsLoading && (
            <div className="py-8 flex flex-col items-center gap-2">
              <FiAlertCircle className="text-red-400" size={24} />
              <p className="text-sm text-red-500 font-medium">{resultsError}</p>
            </div>
          )}

          {/* ── Results ──────────────────────────────────────────────────── */}
          {!resultsLoading && !resultsError && hasResults && (
            <>
              {/* Result count + "view all" */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-500">
                  <span className="text-blue-600 font-black">{total}</span> result{total !== 1 ? 's' : ''}
                  {query && <> for "<span className="text-gray-700">{query}</span>"</>}
                  {activeCategory && <> in <span className="text-blue-600">{activeCategory}</span></>}
                </p>
                {total > 12 && (
                  <button
                    onClick={handleFullResultsPage}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                  >
                    View all <FiArrowRight size={11} />
                  </button>
                )}
              </div>

              {/* Product grid */}
              <div className="space-y-1">
                {results.map((product) => (
                  <ResultCard
                    key={product._id}
                    product={product}
                    onClose={() => dispatch(closeSearch())}
                  />
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
            </>
          )}

          {/* ── No results ───────────────────────────────────────────────── */}
          {!resultsLoading && !resultsError && hasSearched && !hasResults && (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-700 font-bold text-sm">No products found</p>
              <p className="text-gray-400 text-xs mt-1 mb-4">
                Try different keywords or browse by category
              </p>
              <button
                onClick={() => { dispatch(clearResults()); dispatch(setQuery('')); dispatch(setActiveCategory('')) }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}