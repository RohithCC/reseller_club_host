// App.jsx
import React, { useState, useEffect, useMemo } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route, Navigate } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import BlogManager from './pages/BlogManager'
import Login from './components/Login'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import FooterEditor     from './pages/FooterEditor'
import ContactsList     from './pages/ContactsList'
import HeroBannerAdmin  from './pages/HeroBannerAdmin'
import Categories       from './pages/Categories'
import ShowcaseBanners from './pages/ShowcaseBanners'
import Users from './pages/Users'
import Customers from './pages/Customers'
import SalesAnalytics from './pages/SalesAnalytics'
import CouponManagement from './pages/CouponManagement'
import PaymentController from './pages/PaymentController'
import Profile from './pages/Profile'
import NewOrderAlert from './components/NewOrderAlert'
import YouTubeManager from './pages/YouTubeManager'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '\u20b9'

import Dashboard from './pages/Dashboard'

// ── Decode JWT payload (no verify needed for role display) ───────────────────
const decodeToken = (token) => {
  if (!token) return { role: null }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { role: payload.role || (payload.isAdmin ? 'super_admin' : null), email: payload.email || '', name: payload.name || '' }
  } catch { return { role: null } }
}

const RoleGuard = ({ role, allowed, children }) => {
  if (!allowed.includes(role)) return <Navigate to="/dashboard" replace />
  return children
}

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '')

  useEffect(() => { localStorage.setItem('token', token) }, [token])

  // ── Derive admin role from JWT ──────────────────────────────────────────────
  const adminInfo = useMemo(() => decodeToken(token), [token])

  return (
    <div className="a-root" style={{ minHeight: '100vh', background: '#0a0f1e', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <ToastContainer
        position="top-right" autoClose={3000} theme="dark"
        toastStyle={{ background: '#0d1a2e', border: '1px solid #0a0f1e', color: '#0a0f1e' }}
      />

      {/* ── New order alerts (background poller) ── */}
      <NewOrderAlert />

      {token === '' ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar setToken={setToken} adminInfo={adminInfo} />
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #0a0f1e, transparent)' }} />

          <div className="a-layout">
            <Sidebar role={adminInfo.role} />
            <main className="a-main">
              <Routes>
                <Route path="/"              element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard"    element={<Dashboard  token={token} />} />
                <Route path="/add"           element={<Add           token={token} />} />
                <Route path="/list"          element={<List          token={token} />} />
                <Route path="/orders"        element={<Orders        token={token} />} />
                <Route path="/categories"    element={<Categories    token={token} />} />
                <Route path="/users"          element={<RoleGuard role={adminInfo.role} allowed={['super_admin']}><Users token={token} /></RoleGuard>} />
                <Route path="/hero-banner"   element={<RoleGuard role={adminInfo.role} allowed={['super_admin','admin']}><HeroBannerAdmin token={token} /></RoleGuard>} />
                <Route path="/footer-settings" element={<RoleGuard role={adminInfo.role} allowed={['super_admin','admin']}><FooterEditor  token={token} /></RoleGuard>} />
                <Route path="/cta-banners" element={<RoleGuard role={adminInfo.role} allowed={['super_admin','admin']}><ShowcaseBanners token={token} /></RoleGuard>} />
                <Route path="/contacts"      element={<ContactsList  token={token} />} />
                <Route path="/customers"     element={<Customers    token={token} />} />
                <Route path="/coupons"       element={<RoleGuard role={adminInfo.role} allowed={['super_admin','admin']}><CouponManagement token={token} /></RoleGuard>} />
                <Route path="/payment-controller" element={<RoleGuard role={adminInfo.role} allowed={['super_admin','admin']}><PaymentController token={token} /></RoleGuard>} />
                <Route path="/sales-analytics" element={<SalesAnalytics token={token} />} />
                <Route path="/blog"          element={<BlogManager   token={token} />} />

                <Route path="/youtube-reels" element={<RoleGuard role={adminInfo.role} allowed={['super_admin','admin']}><YouTubeManager token={token} /></RoleGuard>} />
                <Route path="/profile"     element={<Profile       token={token} />} />
                <Route path="*"              element={<Navigate to="/list" replace />} />
              </Routes>
            </main>
          </div>
        </>
      )}

      <style>{`
        .a-root {
          -webkit-tap-highlight-color: transparent;
        }
        .a-layout {
          display: flex;
          width: 100%;
        }
        .a-main {
          flex: 1;
          min-height: 100vh;
          background: #e4e7ec;
          padding: 32px clamp(16px, 4vw, 40px);
          overflow-x: hidden;
          min-width: 0;
        }
        @media (max-width: 640px) {
          .a-main {
            padding: 20px 14px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default App
