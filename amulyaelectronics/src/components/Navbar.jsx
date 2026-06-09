// src/components/Navbar.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  FiSearch, FiShoppingCart, FiMenu, FiX,
  FiUser, FiHeart, FiChevronDown, FiChevronRight,
  FiLogOut, FiPackage, FiSettings,
  FiHome, FiGrid, FiPhone,
} from 'react-icons/fi'
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser, fetchUserProfile } from '../app/authSlice'
import { loadCart, syncGuestCartToServer, clearAll } from '../app/cartSlice'
import logo from '../assets/CONNECT-WITH-ELECTRONICS-1.webp'
import { openSearch, selectSearchOpen } from '../app/searchSlice'
import SearchModal from './SearchModal'

const backendUrl = import.meta.env.VITE_BACKEND_URL || ''

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ count }) {
  if (!count || count < 1) return null
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full font-black leading-none shadow-sm pointer-events-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, avatar, size = 'sm' }) {
  const [imgError, setImgError] = useState(false)
  const letter  = name ? name.charAt(0).toUpperCase() : '?'
  const sizecls = size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm'
  if (avatar && !imgError) {
    return (
      <img src={avatar} alt={name || 'User'} onError={() => setImgError(true)}
        className={`${sizecls} rounded-full object-cover border-2 border-blue-100 select-none`} />
    )
  }
  return (
    <span className={`${sizecls} rounded-full bg-blue-600 text-white font-black flex items-center justify-center select-none`}>
      {letter}
    </span>
  )
}

// ─── Category skeleton ────────────────────────────────────────────────────────
function CategorySkeleton({ count = 6 }) {
  return (
    <div className="px-4 py-3 space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-100 rounded-lg animate-pulse"
          style={{ width: `${55 + (i % 3) * 15}%` }} />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP MEGA MENU
// ALWAYS navigate with cat.name / sub.name — same as what categorySlice stores.
// ─────────────────────────────────────────────────────────────────────────────
function DesktopMegaMenu({
  categories, catFetchState,
  onSelectCategory, onSelectSubcategory,
  onClose, onMouseEnter, onMouseLeave,
  setCatFetchState, fetchCategories,
}) {
  const [hoveredCat, setHoveredCat] = useState(null)

  useEffect(() => {
    if (categories.length > 0 && hoveredCat === null) {
      const first = categories.find(c =>
        c.subCategories?.filter(s => s.isActive !== false).length > 0
      )
      setHoveredCat(first?._id || categories[0]?._id || null)
    }
  }, [categories, hoveredCat])

  const activeCat  = categories.find(c => c._id === hoveredCat)
  const activeSubs = activeCat?.subCategories?.filter(s => s.isActive !== false) || []

  return (
    <div
      className="absolute top-[calc(100%+8px)] left-0 z-[100] flex shadow-2xl rounded-2xl border border-gray-100 bg-white overflow-hidden"
      style={{ minWidth: 520, maxHeight: 'calc(100vh - 80px)' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* LEFT PANEL */}
      <div className="w-56 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col overflow-hidden">
        {catFetchState === 'loading' && <CategorySkeleton />}
        {catFetchState === 'error' && (
          <p className="text-xs text-red-400 px-4 py-3 font-medium">
            Failed to load.{' '}
            <button onClick={() => { setCatFetchState('idle'); fetchCategories() }}
              className="underline text-blue-500">Retry</button>
          </p>
        )}
        {catFetchState === 'done' && categories.length === 0 && (
          <p className="text-xs text-gray-400 px-4 py-3">No categories found.</p>
        )}
        {catFetchState === 'done' && categories.length > 0 && (
          <div className="overflow-y-auto flex-1 py-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {categories.map((cat) => {
              const subs      = cat.subCategories?.filter(s => s.isActive !== false) || []
              const isHovered = hoveredCat === cat._id
              return (
                <button
                  key={cat._id}
                  onMouseEnter={() => setHoveredCat(cat._id)}
                  // ✅ Navigate with cat.name — matches categorySlice
                  onMouseDown={() => { onSelectCategory(cat.name); onClose() }}
                  className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-all duration-150 group ${
                    isHovered ? 'bg-blue-50 text-blue-700' : 'text-gray-800 hover:bg-gray-50 hover:text-blue-700'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${isHovered ? 'bg-blue-600' : 'bg-gray-300 group-hover:bg-blue-400'}`} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {subs.length > 0 && (
                    <FiChevronRight size={13} className={`flex-shrink-0 ml-1 transition-colors ${isHovered ? 'text-blue-600' : 'text-gray-400'}`} />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-w-[220px]">
        {activeSubs.length === 0 ? (
          <div className="flex flex-col items-start px-5 py-4 gap-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{activeCat?.name}</p>
            <button
              // ✅ cat.name
              onMouseDown={() => { if (activeCat) onSelectCategory(activeCat.name); onClose() }}
              className="text-sm text-blue-600 font-bold hover:text-blue-800 transition-colors flex items-center gap-1"
            >
              Browse all <FiChevronRight size={13} />
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 flex-shrink-0 bg-gray-50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{activeCat?.name}</p>
              <button
                // ✅ cat.name
                onMouseDown={() => { if (activeCat) onSelectCategory(activeCat.name); onClose() }}
                className="text-[10px] text-blue-500 font-bold hover:text-blue-700 transition-colors ml-2 flex-shrink-0"
              >View all →</button>
            </div>
            <div className="overflow-y-auto flex-1 py-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {activeSubs.map((sub) => (
                <button
                  key={sub._id || sub.name}
                  // ✅ cat.name + sub.name
                  onMouseDown={() => { onSelectSubcategory(activeCat.name, sub.name); onClose() }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all font-medium group"
                >
                  <FiChevronRight size={12} className="text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                  <span className="truncate">{sub.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE CATEGORY ACCORDION ITEM — always cat.name / sub.name
// ─────────────────────────────────────────────────────────────────────────────
function MobileCategoryItem({ cat, onSelectCategory, onSelectSubcategory }) {
  const [subOpen, setSubOpen]   = useState(false)
  const subs                    = cat.subCategories?.filter(s => s.isActive !== false) || []
  const hasSubcategories        = subs.length > 0

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-center">
        <button
          // ✅ cat.name
          onClick={() => hasSubcategories ? setSubOpen(p => !p) : onSelectCategory(cat.name)}
          className="flex-1 text-left flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors font-semibold"
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${subOpen ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <span className="flex-1 text-left truncate">{cat.name}</span>
          {hasSubcategories && (
            <span className="text-[10px] bg-gray-100 text-gray-500 font-black px-1.5 py-0.5 rounded-full mr-1 flex-shrink-0">
              {subs.length}
            </span>
          )}
          {hasSubcategories && (
            <FiChevronDown size={14}
              className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${subOpen ? 'rotate-180 text-blue-500' : ''}`} />
          )}
        </button>
        {/* "All" shortcut — ✅ cat.name */}
        {hasSubcategories && (
          <button
            onClick={() => onSelectCategory(cat.name)}
            className="px-3 py-3 text-xs text-blue-500 hover:text-blue-700 font-black border-l border-gray-100 hover:bg-blue-50 transition-colors flex-shrink-0"
            title={`Browse all ${cat.name}`}
          >All</button>
        )}
      </div>

      {hasSubcategories && subOpen && (
        <div className="bg-blue-50/50 border-t border-blue-100/60">
          {subs.map((sub) => (
            <button
              key={sub._id || sub.name}
              // ✅ cat.name + sub.name
              onClick={() => onSelectSubcategory(cat.name, sub.name)}
              className="w-full text-left flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-100/50 transition-colors font-medium"
            >
              <FiChevronRight size={12} className="text-blue-300 flex-shrink-0" />
              <span className="truncate">{sub.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const { user, isLoggedIn, token } = useSelector((s) => s.auth)
  const isSearchOpen = useSelector(selectSearchOpen)

  const cartCount = useSelector((s) => {
    const items = s.cart?.items
    if (!Array.isArray(items)) return 0
    return items.reduce((sum, i) => sum + (i.quantity ?? 1), 0)
  })
  const wishlistCount = useSelector((s) => s.wishlist?.items?.length ?? 0)

  const [categories,    setCategories]    = useState([])
  const [catFetchState, setCatFetchState] = useState('idle')

  const fetchCategories = useCallback(async () => {
    if (catFetchState === 'loading' || catFetchState === 'done') return
    setCatFetchState('loading')
    try {
      const res  = await fetch(`${backendUrl}/api/category/list?activeOnly=true`)
      const data = await res.json()
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories.filter(c => c.isActive !== false))
        setCatFetchState('done')
      } else {
        setCatFetchState('error')
      }
    } catch {
      setCatFetchState('error')
    }
  }, [catFetchState])

  const [desktopCatOpen, setDesktopCatOpen] = useState(false)
  const [userMenuOpen,   setUserMenuOpen]   = useState(false)
  const catCloseTimer   = useRef(null)

  const openDesktopCat  = () => { clearTimeout(catCloseTimer.current); setDesktopCatOpen(true); fetchCategories() }
  const closeDesktopCat = () => { catCloseTimer.current = setTimeout(() => setDesktopCatOpen(false), 180) }

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileCatOpen,    setMobileCatOpen]    = useState(false)

  const userMenuRef     = useRef(null)
  const prevLoggedInRef = useRef(isLoggedIn)

  useEffect(() => { if (token && !user) dispatch(fetchUserProfile()) }, [token, user, dispatch])
  useEffect(() => { dispatch(loadCart()) }, [])                        // eslint-disable-line
  useEffect(() => { const t = setTimeout(fetchCategories, 500); return () => clearTimeout(t) }, []) // eslint-disable-line

  useEffect(() => {
    const wasLoggedIn = prevLoggedInRef.current
    prevLoggedInRef.current = isLoggedIn
    if (!wasLoggedIn && isLoggedIn)  dispatch(syncGuestCartToServer()).then(() => dispatch(loadCart()))
    if (wasLoggedIn  && !isLoggedIn) dispatch(clearAll())
  }, [isLoggedIn, dispatch])

  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileDrawerOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = (mobileDrawerOpen || isSearchOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileDrawerOpen, isSearchOpen])

  useEffect(() => { setMobileDrawerOpen(false); setMobileCatOpen(false) }, [location.pathname])

  const handleLogout = () => {
    dispatch(logoutUser()); dispatch(clearAll())
    setUserMenuOpen(false); setMobileDrawerOpen(false)
    navigate('/')
  }

  // ✅ SINGLE SOURCE OF TRUTH: always encode cat.name (not slug)
  // Collection.jsx reads :category from URL and matches it against categoryNames (which are .name values)
  const handleSelectCategory = (name) => {
    setDesktopCatOpen(false)
    navigate(`/collection/${encodeURIComponent(name)}`)
  }
  const handleSelectSubcategory = (catName, subName) => {
    setDesktopCatOpen(false)
    navigate(`/collection/${encodeURIComponent(catName)}/${encodeURIComponent(subName)}`)
  }
  const handleMobileSelectCategory = (name) => {
    navigate(`/collection/${encodeURIComponent(name)}`)
    closeDrawer()
  }
  const handleMobileSelectSubcategory = (catName, subName) => {
    navigate(`/collection/${encodeURIComponent(catName)}/${encodeURIComponent(subName)}`)
    closeDrawer()
  }

  const handleMobileCatToggle = () => { if (!mobileCatOpen) fetchCategories(); setMobileCatOpen(p => !p) }
  const closeDrawer           = () => { setMobileDrawerOpen(false); setMobileCatOpen(false) }

  const navClass = ({ isActive }) =>
    isActive
      ? 'bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-bold text-sm'
      : 'px-3 py-1.5 hover:text-blue-700 text-gray-800 transition-colors duration-200 font-semibold text-sm'

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <>
      {isSearchOpen && <SearchModal />}

      <header className="w-full shadow-sm bg-white sticky top-0 z-50">

        {/* ANNOUNCEMENT BAR */}
        <div className="bg-blue-900 text-white text-center text-xs sm:text-sm py-1.5 tracking-wide font-semibold">
          🎉 Back2School Sale is Live! Free delivery on orders above ₹999
        </div>

        {/* MAIN HEADER */}
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between py-3 gap-3">

          <div className="flex items-center gap-3">
            <img src={logo} onClick={() => navigate('/')}
              className="h-8 sm:h-12 md:h-8 lg:h-14 xl:h-14 w-auto cursor-pointer flex-shrink-0 hover:opacity-90 transition-opacity object-contain"
              alt="Amulya Electronics" />

            {/* Desktop mega menu trigger */}
            <div className="relative hidden md:block" onMouseEnter={openDesktopCat} onMouseLeave={closeDesktopCat}>
              <button
                onClick={() => { setDesktopCatOpen(v => !v); fetchCategories() }}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full cursor-pointer transition-colors text-sm font-bold text-gray-800"
              >
                <FiMenu size={15} />
                <span>All Categories</span>
                <FiChevronDown size={13} className={`transition-transform duration-200 ${desktopCatOpen ? 'rotate-180' : ''}`} />
              </button>
              {desktopCatOpen && (
                <DesktopMegaMenu
                  categories={categories}
                  catFetchState={catFetchState}
                  onSelectCategory={handleSelectCategory}
                  onSelectSubcategory={handleSelectSubcategory}
                  onClose={() => setDesktopCatOpen(false)}
                  onMouseEnter={openDesktopCat}
                  onMouseLeave={closeDesktopCat}
                  setCatFetchState={setCatFetchState}
                  fetchCategories={fetchCategories}
                />
              )}
            </div>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1 text-gray-800">
              <NavLink to="/"        className={navClass} end>Home</NavLink>
              <NavLink to="/about"   className={navClass}>About</NavLink>
              <NavLink to="/contact" className={navClass}>Contact</NavLink>
               <NavLink to="/blog" className={navClass}>Blog</NavLink>
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button onClick={() => dispatch(openSearch())}
              className="p-2.5 rounded-full hover:bg-gray-100 transition-colors group" aria-label="Search">
              <FiSearch className="text-[22px] text-gray-700 group-hover:text-blue-700 transition-colors" />
            </button>

            {isLoggedIn ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-1 rounded-full hover:ring-2 hover:ring-blue-200 transition-all" aria-label="Account">
                  <Avatar name={user?.name} avatar={user?.avatar} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-white shadow-xl rounded-2xl py-2 border border-gray-100 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 mb-1 flex items-center gap-3">
                      <Avatar name={user?.name} avatar={user?.avatar} />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email || ''}</p>
                      </div>
                    </div>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-800 hover:text-blue-700 transition-colors font-semibold">
                      <FiSettings size={15} /> My Profile
                    </Link>
                    <Link to="/orders" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-800 hover:text-blue-700 transition-colors font-semibold">
                      <FiPackage size={15} /> My Orders
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 hover:text-red-700 transition-colors font-semibold">
                      <FiLogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => navigate('/login')}
                className="hidden md:flex p-2.5 rounded-full hover:bg-gray-100 transition-colors group" aria-label="Login">
                <FiUser className="text-[22px] text-gray-700 group-hover:text-blue-700 transition-colors" />
              </button>
            )}

            <button onClick={() => navigate('/wishlist')}
              className="relative hidden md:flex p-2.5 rounded-full hover:bg-gray-100 transition-colors group" aria-label="Wishlist">
              <FiHeart className="text-[22px] text-gray-700 group-hover:text-red-500 transition-colors" />
              <Badge count={wishlistCount} />
            </button>

            <button onClick={() => navigate('/cart')}
              className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors group" aria-label="Cart">
              <FiShoppingCart className="text-[22px] text-gray-700 group-hover:text-blue-700 transition-colors" />
              <Badge count={cartCount} />
            </button>

            <button className="md:hidden p-2.5 rounded-full hover:bg-gray-100 text-gray-800 transition-colors"
              onClick={() => setMobileDrawerOpen(p => !p)} aria-label="Menu">
              {mobileDrawerOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* MOBILE SIDE DRAWER */}
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={closeDrawer} />
        )}
        <div className={`md:hidden fixed top-0 right-0 h-full w-[300px] max-w-[88vw] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${mobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>

          {/* Fixed header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
            <img src={logo} alt="Amulya Electronics" className="h-8 object-contain" />
            <button onClick={closeDrawer} className="p-2 rounded-full hover:bg-gray-100"><FiX size={20} /></button>
          </div>

          {/* Scrollable body — pb-20 clears the bottom nav bar */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-1 pb-20">

            {isLoggedIn ? (
              <div className="flex items-center gap-3 px-3 py-3 bg-blue-50 rounded-xl mb-3">
                <Avatar name={user?.name} avatar={user?.avatar} />
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
            ) : (
              <button onClick={() => { navigate('/login'); closeDrawer() }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-bold text-sm transition-colors shadow-md shadow-blue-100 mb-3">
                Login / Sign Up
              </button>
            )}

            <button onClick={() => { dispatch(openSearch()); closeDrawer() }}
              className="w-full flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-500 text-sm font-medium hover:border-blue-300 hover:bg-blue-50 transition-all mb-2">
              <FiSearch size={16} className="text-gray-400" />
              <span className="text-gray-400">Search products, kits, sensors…</span>
            </button>

            {[
              { label: 'Home',            to: '/',           icon: <FiHome size={16} /> },
              { label: 'Product Catalog', to: '/collection', icon: <FiGrid size={16} /> },
              { label: 'About',           to: '/about',      icon: <FiUser size={16} /> },
              { label: 'Contact',         to: '/contact',    icon: <FiPhone size={16} /> },
            ].map((item) => (
              <Link key={item.label} to={item.to} onClick={closeDrawer}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-800 font-semibold text-sm transition-colors">
                <span className="text-blue-500">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* All Categories accordion */}
            <div className="rounded-xl overflow-hidden border border-gray-100 mt-1">
              <button onClick={handleMobileCatToggle}
                className="w-full flex items-center justify-between px-3 py-3 text-gray-800 font-bold text-sm hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2">
                  <FiMenu size={15} className="text-blue-500" />
                  All Categories
                </span>
                <div className="flex items-center gap-1.5">
                  {catFetchState === 'loading' && (
                    <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {categories.length > 0 && catFetchState === 'done' && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 font-black px-1.5 py-0.5 rounded-full">{categories.length}</span>
                  )}
                  <FiChevronDown size={15} className={`transition-transform duration-200 ${mobileCatOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {mobileCatOpen && (
                <div className="border-t border-gray-100">
                  {catFetchState === 'loading' && <CategorySkeleton count={8} />}
                  {catFetchState === 'error' && (
                    <p className="text-xs text-red-400 px-4 py-3 font-medium">
                      Failed to load.{' '}
                      <button onClick={() => { setCatFetchState('idle'); fetchCategories() }}
                        className="underline text-blue-500">Retry</button>
                    </p>
                  )}
                  {catFetchState === 'done' && categories.length === 0 && (
                    <p className="text-xs text-gray-400 px-4 py-3">No categories found.</p>
                  )}
                  {catFetchState === 'done' && categories.map((cat) => (
                    <MobileCategoryItem
                      key={cat._id}
                      cat={cat}
                      onSelectCategory={handleMobileSelectCategory}
                      onSelectSubcategory={handleMobileSelectSubcategory}
                    />
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn && (
              <div className="pt-2 border-t border-gray-100 mt-2 space-y-1">
                <Link to="/profile" onClick={closeDrawer}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-800 font-semibold text-sm transition-colors">
                  <FiSettings size={15} className="text-gray-500" /> My Profile
                </Link>
                <Link to="/orders" onClick={closeDrawer}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-800 font-semibold text-sm transition-colors">
                  <FiPackage size={15} className="text-gray-500" /> My Orders
                </Link>
                <Link to="/wishlist" onClick={closeDrawer}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-800 font-semibold text-sm transition-colors">
                  <FiHeart size={15} className="text-red-400" />
                  My Wishlist
                  {wishlistCount > 0 && (
                    <span className="ml-auto text-xs bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full">{wishlistCount}</span>
                  )}
                </Link>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-red-50 text-red-600 font-semibold text-sm transition-colors">
                  <FiLogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-2 py-1.5 pb-safe">
          <button onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive('/') ? 'text-blue-600' : 'text-gray-500'}`}>
            <FiHome size={22} strokeWidth={isActive('/') ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          <button
            onClick={() => { fetchCategories(); setMobileDrawerOpen(true); setTimeout(() => setMobileCatOpen(true), 80) }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive('/collection') ? 'text-blue-600' : 'text-gray-500'}`}>
            <FiGrid size={22} strokeWidth={isActive('/collection') ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold">Categories</span>
          </button>

          <button onClick={() => dispatch(openSearch())}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-gray-500">
            <div className="bg-blue-600 rounded-full p-2.5 -mt-5 shadow-lg shadow-blue-200">
              <FiSearch size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold mt-0.5">Search</span>
          </button>

          <button onClick={() => navigate('/wishlist')}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive('/wishlist') ? 'text-red-500' : 'text-gray-500'}`}>
            <FiHeart size={22} strokeWidth={isActive('/wishlist') ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center px-0.5 rounded-full font-black leading-none">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </button>

          <button
            onClick={() => isLoggedIn ? setMobileDrawerOpen(true) : navigate('/login')}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive('/profile') || isActive('/orders') ? 'text-blue-600' : 'text-gray-500'}`}>
            {isLoggedIn ? <Avatar name={user?.name} avatar={user?.avatar} size="sm" /> : <FiUser size={22} strokeWidth={1.8} />}
            <span className="text-[10px] font-bold">{isLoggedIn ? 'Account' : 'Login'}</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default Navbar