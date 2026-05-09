// src/components/Navbar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ✅ Search now uses Redux searchSlice (openSearch/closeSearch actions)
//    and renders <SearchModal /> instead of inline JSX
// ✅ All original functionality preserved
// ✅ Mobile: Top bar (logo + icons) + Bottom Navigation Bar
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef }   from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  FiSearch, FiShoppingCart, FiMenu, FiX,
  FiUser, FiHeart, FiChevronDown,
  FiLogOut, FiPackage, FiSettings,
  FiHome, FiGrid, FiPhone,
} from 'react-icons/fi'
import { useSelector, useDispatch }  from 'react-redux'
import { logoutUser, fetchUserProfile } from '../app/authSlice'
import { loadCart, syncGuestCartToServer, clearAll } from '../app/cartSlice'
import logo from '../assets/CONNECT-WITH-ELECTRONICS-1.webp'

// ✅ Redux search actions
import { openSearch, selectSearchOpen } from '../app/searchSlice'

// ✅ SearchModal rendered at top level — keeps Navbar clean
import SearchModal from './SearchModal'

const ALL_CATEGORIES = [
  'VOLTMETER', 'Sensors & Modules', 'SOLDERING', 'Battery',
  'Battery Holders', 'Motor', 'Motor Driver', 'Wireless Modules',
  'Audio Related', 'Basic Tools', 'Micro Controller', 'Capacitors',
  'Components', 'Display', 'ICS', 'Jumper Wires & Cables', 'Kits',
  'LEDs', 'Medical', 'Other Modules', 'Power Boards', 'Relay Modules',
  'Resistors', 'Robotics', 'Wheels',
]

const PRODUCT_LINKS = [
  { label: 'Kits',        path: '/collection/Kits' },
  { label: 'Sensors',     path: '/collection/Sensors%20%26%20Modules' },
  { label: 'Accessories', path: '/collection/Basic%20Tools' },
  { label: 'Robotics',    path: '/collection/Robotics' },
]

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

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const location   = useLocation()

  const { user, isLoggedIn, token } = useSelector((s) => s.auth)
  const isSearchOpen = useSelector(selectSearchOpen)

  const cartCount = useSelector((s) => {
    const items = s.cart?.items
    if (!Array.isArray(items)) return 0
    return items.reduce((sum, i) => sum + (i.quantity ?? 1), 0)
  })
  const wishlistCount = useSelector((s) => s.wishlist?.items?.length ?? 0)

  // ── Desktop dropdown state ─────────────────────────────────────────────────
  const [desktopCatOpen,     setDesktopCatOpen]     = useState(false)
  const [desktopProductOpen, setDesktopProductOpen] = useState(false)
  const [userMenuOpen,       setUserMenuOpen]        = useState(false)

  const catCloseTimer     = useRef(null)
  const productCloseTimer = useRef(null)

  const openDesktopCat      = () => { clearTimeout(catCloseTimer.current);     setDesktopCatOpen(true)  }
  const closeDesktopCat     = () => { catCloseTimer.current     = setTimeout(() => setDesktopCatOpen(false),     150) }
  const openDesktopProduct  = () => { clearTimeout(productCloseTimer.current); setDesktopProductOpen(true)  }
  const closeDesktopProduct = () => { productCloseTimer.current = setTimeout(() => setDesktopProductOpen(false), 150) }

  // ── Mobile drawer state ────────────────────────────────────────────────────
  const [mobileDrawerOpen,  setMobileDrawerOpen]  = useState(false)
  const [mobileCatOpen,     setMobileCatOpen]      = useState(false)
  const [mobileProductOpen, setMobileProductOpen]  = useState(false)

  const userMenuRef     = useRef(null)
  const prevLoggedInRef = useRef(isLoggedIn)

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (token && !user) dispatch(fetchUserProfile())
  }, [token, user, dispatch])

  // ── One-time cart load ─────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(loadCart())
  }, []) // eslint-disable-line

  // ── Login/logout transitions ───────────────────────────────────────────────
  useEffect(() => {
    const wasLoggedIn = prevLoggedInRef.current
    prevLoggedInRef.current = isLoggedIn
    if (!wasLoggedIn && isLoggedIn) {
      dispatch(syncGuestCartToServer()).then(() => dispatch(loadCart()))
    }
    if (wasLoggedIn && !isLoggedIn) {
      dispatch(clearAll())
    }
  }, [isLoggedIn, dispatch])

  // ── Close user menu on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Close mobile drawer on resize ─────────────────────────────────────────
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileDrawerOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // ── Body scroll lock ───────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = (mobileDrawerOpen || isSearchOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileDrawerOpen, isSearchOpen])

  // ── Close drawer on route change ──────────────────────────────────────────
  useEffect(() => {
    setMobileDrawerOpen(false)
    setMobileCatOpen(false)
    setMobileProductOpen(false)
  }, [location.pathname])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    dispatch(logoutUser())
    dispatch(clearAll())
    setUserMenuOpen(false)
    setMobileDrawerOpen(false)
    navigate('/')
  }

  const handleDesktopCategoryClick = (cat) => {
    clearTimeout(catCloseTimer.current)
    setDesktopCatOpen(false)
    navigate(`/collection/${encodeURIComponent(cat)}`)
  }

  const handleMobileCategoryClick = (cat) => {
    navigate(`/collection/${encodeURIComponent(cat)}`)
    setMobileDrawerOpen(false)
    setMobileCatOpen(false)
  }

  const closeDrawer = () => {
    setMobileDrawerOpen(false)
    setMobileCatOpen(false)
    setMobileProductOpen(false)
  }

  const navClass = ({ isActive }) =>
    isActive
      ? 'bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-bold text-sm'
      : 'px-3 py-1.5 hover:text-blue-700 text-gray-800 transition-colors duration-200 font-semibold text-sm'

  // ── Bottom nav active helper ───────────────────────────────────────────────
  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <>
      {/* ✅ Search modal */}
      {isSearchOpen && <SearchModal />}

      <header className="w-full shadow-sm bg-white sticky top-0 z-50">

        {/* ANNOUNCEMENT BAR */}
        <div className="bg-blue-900 text-white text-center text-xs sm:text-sm py-1.5 tracking-wide font-semibold">
          🎉 Back2School Sale is Live! Free delivery on orders above ₹499
        </div>

        {/* MAIN HEADER */}
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between py-3 gap-3">

          {/* ── LEFT ─────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
              <img
                src={logo}
                onClick={() => navigate('/')}
                className="h-10 cursor-pointer flex-shrink-0 hover:opacity-90 transition-opacity"
                alt="Amulya Electronics"
              />

            {/* ── DESKTOP: All Categories ─── */}
            <div
              className="relative hidden md:block"
              onMouseEnter={openDesktopCat}
              onMouseLeave={closeDesktopCat}
            >
              <button
                onClick={() => setDesktopCatOpen(!desktopCatOpen)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full cursor-pointer transition-colors text-sm font-bold text-gray-800"
              >
                <FiMenu size={15} />
                <span>All Categories</span>
                <FiChevronDown size={13} className={`transition-transform duration-200 ${desktopCatOpen ? 'rotate-180' : ''}`} />
              </button>
              {desktopCatOpen && (
                <div
                  className="absolute top-12 left-0 w-64 bg-white shadow-2xl rounded-2xl py-2 z-50 border border-gray-100 max-h-96 overflow-y-auto"
                  onMouseEnter={openDesktopCat}
                  onMouseLeave={closeDesktopCat}
                >
                  {ALL_CATEGORIES.map((item) => (
                    <button
                      key={item}
                      onMouseDown={() => handleDesktopCategoryClick(item)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 text-sm text-gray-800 transition-colors font-semibold"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── DESKTOP: Nav links ─── */}
            <nav className="hidden md:flex items-center gap-1 text-gray-800">
              <NavLink to="/" className={navClass} end>Home</NavLink>
              <NavLink to="/about"      className={navClass}>About</NavLink>
              <NavLink to="/contact"    className={navClass}>Contact</NavLink>
            </nav>
          </div>

          {/* ── RIGHT ACTIONS ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-0.5 sm:gap-1">

            {/* Search */}
            <button
              onClick={() => dispatch(openSearch())}
              className="p-2.5 rounded-full hover:bg-gray-100 transition-colors group"
              aria-label="Search"
            >
              <FiSearch className="text-[22px] text-gray-700 group-hover:text-blue-700 transition-colors" />
            </button>

            {/* USER dropdown — desktop */}
            {isLoggedIn ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-1 rounded-full hover:ring-2 hover:ring-blue-200 transition-all"
                  aria-label="Account"
                >
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

            {/* Wishlist — desktop only */}
            <button onClick={() => navigate('/wishlist')}
              className="relative hidden md:flex p-2.5 rounded-full hover:bg-gray-100 transition-colors group" aria-label="Wishlist">
              <FiHeart className="text-[22px] text-gray-700 group-hover:text-red-500 transition-colors" />
              <Badge count={wishlistCount} />
            </button>

            {/* Cart — always visible */}
            <button onClick={() => navigate('/cart')}
              className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors group" aria-label="Cart">
              <FiShoppingCart className="text-[22px] text-gray-700 group-hover:text-blue-700 transition-colors" />
              <Badge count={cartCount} />
            </button>

            {/* Hamburger — mobile only (opens side drawer) */}
            <button
              className="md:hidden p-2.5 rounded-full hover:bg-gray-100 text-gray-800 transition-colors"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              aria-label="Menu"
            >
              {mobileDrawerOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* ── MOBILE SIDE DRAWER ────────────────────────────────────────────── */}
        {/* Backdrop */}
        {mobileDrawerOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={closeDrawer}
          />
        )}

        {/* Drawer panel */}
        <div className={`md:hidden fixed top-0 right-0 h-full w-[300px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${mobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>

          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <img
              src="https://amulyaelectronics.com/wp-content/uploads/2026/01/CONNECT-WITH-ELECTRONICS-1.png"
              alt="Amulya Electronics" className="h-8"
            />
            <button onClick={closeDrawer} className="p-2 rounded-full hover:bg-gray-100">
              <FiX size={20} />
            </button>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">

            {/* User info or login */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3 px-3 py-3 bg-blue-50 rounded-xl mb-3">
                <Avatar name={user?.name} avatar={user?.avatar} />
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { navigate('/login'); closeDrawer() }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-bold text-sm transition-colors shadow-md shadow-blue-100 mb-3"
              >
                Login / Sign Up
              </button>
            )}

            {/* Search */}
            <button
              onClick={() => { dispatch(openSearch()); closeDrawer() }}
              className="w-full flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-500 text-sm font-medium hover:border-blue-300 hover:bg-blue-50 transition-all mb-2"
            >
              <FiSearch size={16} className="text-gray-400" />
              <span className="text-gray-400">Search products, kits, sensors…</span>
            </button>

            {/* Nav links */}
            {[
              { label: 'Home',            to: '/',          icon: <FiHome size={16} /> },
              { label: 'Product Catalog', to: '/collection',icon: <FiGrid size={16} /> },
              { label: 'About',           to: '/about',     icon: <FiUser size={16} /> },
              { label: 'Contact',         to: '/contact',   icon: <FiPhone size={16} /> },
            ].map((item) => (
              <Link key={item.label} to={item.to} onClick={closeDrawer}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-800 font-semibold text-sm transition-colors">
                <span className="text-blue-500">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* All Categories */}
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <button
                onClick={() => setMobileCatOpen(!mobileCatOpen)}
                className="w-full flex items-center justify-between px-3 py-3 text-gray-800 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FiMenu size={15} className="text-blue-500" /> All Categories
                </span>
                <FiChevronDown size={15} className={`transition-transform duration-200 ${mobileCatOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileCatOpen && (
                <div className="bg-gray-50 border-t border-gray-100 max-h-60 overflow-y-auto">
                  {ALL_CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => handleMobileCategoryClick(cat)}
                      className="w-full text-left flex items-center gap-2 px-5 py-2.5 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account links when logged in */}
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
                    <span className="ml-auto text-xs bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
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

      {/* ── MOBILE BOTTOM NAVIGATION BAR ─────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-2 py-1.5 pb-safe">

          {/* Home */}
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive('/') ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <FiHome size={22} strokeWidth={isActive('/') ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* Categories */}
          <button
            onClick={() => { setMobileDrawerOpen(true); setTimeout(() => setMobileCatOpen(true), 100) }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive('/collection') ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <FiGrid size={22} strokeWidth={isActive('/collection') ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold">Categories</span>
          </button>

          {/* Search */}
          <button
            onClick={() => dispatch(openSearch())}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-gray-500"
          >
            <div className="bg-blue-600 rounded-full p-2.5 -mt-5 shadow-lg shadow-blue-200">
              <FiSearch size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold mt-0.5">Search</span>
          </button>

          {/* Wishlist */}
          <button
            onClick={() => navigate('/wishlist')}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive('/wishlist') ? 'text-red-500' : 'text-gray-500'}`}
          >
            <FiHeart size={22} strokeWidth={isActive('/wishlist') ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center px-0.5 rounded-full font-black leading-none">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </button>

          {/* Account */}
          <button
            onClick={() => isLoggedIn ? setMobileDrawerOpen(true) : navigate('/login')}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive('/profile') || isActive('/orders') ? 'text-blue-600' : 'text-gray-500'}`}
          >
            {isLoggedIn
              ? <Avatar name={user?.name} avatar={user?.avatar} size="sm" />
              : <FiUser size={22} strokeWidth={1.8} />
            }
            <span className="text-[10px] font-bold">{isLoggedIn ? 'Account' : 'Login'}</span>
          </button>

        </div>
      </nav>

      {/* Push page content up from bottom nav on mobile */}
      <div className="md:hidden h-[64px]" />
    </>
  )
}

export default Navbar