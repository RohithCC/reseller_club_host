import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// ── Redux actions ──────────────────────────────────────────────────────────────
import { fetchFooterSettings } from './app/footerSlice'
import { fetchUserProfile }    from './app/authSlice'

// ── Pages ──────────────────────────────────────────────────────────────────────
import Home           from './pages/Home'
import Collection     from './pages/Collection'
import About          from './pages/About'
import Contact        from './pages/Contact'
import Product        from './pages/Product'
import Cart           from './pages/Cart'
import Checkout       from './pages/Checkout'
import Login          from './pages/Login'
import PlaceOrder     from './pages/PlaceOrder'
import Orders         from './pages/Orders'
import Verify         from './pages/Verify'
import SearchBar      from './pages/SearchBar'
import BlogPost       from './components/BlogPost'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'
import OrderDetails from './pages/OrderDetails'
import MyOrders from './pages/MyOrders'
import PrivacyPolicy from './pages/PrivacyPolicy'
import RefundPolicy from './pages/RefundPolicy'
import TermsAndConditions from './pages/TermsAndConditions'

import Wishlist from './pages/Wishlist'

// ── Layout ─────────────────────────────────────────────────────────────────────
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Profile from './pages/Profile'

const App = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // ✅ Fetch footer settings once globally — Footer reads from Redux state
    dispatch(fetchFooterSettings())

    // ✅ Restore user session on page refresh if token exists in localStorage
    const token = localStorage.getItem('token')
    if (token) dispatch(fetchUserProfile())
  }, [dispatch])

  return (
    <div className="min-h-screen flex flex-col">

      <ToastContainer position="top-right" autoClose={2000} />

      {/* Navbar reads cartCount + wishlistCount + user from Redux */}
      <Navbar />

      {/* Optional search bar */}
      <div className="w-full border-b">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </div>

      {/* Main routes */}
      <main className="flex-grow w-full">
        <Routes>
          <Route path="/"                     element={<Home />} />
          <Route path="/collection"           element={<Collection />} />
          <Route path="/collection/:category" element={<Collection />} />
          <Route path="/about"                element={<About />} />
          <Route path="/profile"                element={<Profile />} />
          <Route path="/contact"              element={<Contact />} />
          <Route path="/product/:productId"   element={<Product />} />
          <Route path="/cart"                 element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout"             element={<Checkout />} />
          <Route path="/login"                element={<Login />} />
          <Route path="/place-order"          element={<PlaceOrder />} />
        

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />



          <Route path="/verify"               element={<Verify />} />
          <Route path="/blog"                 element={<BlogPost />} />
          <Route path="/blog/:id"             element={<BlogPost />} />
          <Route path="/forgot-password"      element={<ForgotPassword />} />
          <Route path="/reset-password"       element={<ResetPassword />} />
          <Route path="/orders"             element={<MyOrders />} />
        <Route path="/orders/:orderNumber" element={<OrderDetails />} />
        </Routes>
      </main>

      {/* Footer reads live settings from Redux state.footer.settings */}
      <Footer />

    </div>
  )
}

export default App
