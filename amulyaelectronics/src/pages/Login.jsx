import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiUser,
  FiAlertCircle, FiCheck, FiArrowRight,
} from 'react-icons/fi'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { loginSuccess, fetchUserProfile } from '../app/authSlice'   // ← adjust path if needed

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const dispatch  = useDispatch()

  const redirectTo = location.state?.from || '/'

  const [tab, setTab]         = useState('login')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm,   setRegForm]   = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })

  // ── Shared: store token in Redux + fetch profile ──────────────────────────
  const handleAuthSuccess = async (token) => {
    // 1. Save token to Redux state + localStorage
    dispatch(loginSuccess({ token }))
    // 2. Immediately fetch user profile so Navbar shows the name/avatar
    await dispatch(fetchUserProfile())
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!loginForm.email || !loginForm.password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/user/login`, {
        email:    loginForm.email,
        password: loginForm.password,
      })

      if (data.success) {
        setSuccess('Login successful! Redirecting...')
        await handleAuthSuccess(data.token)
        setTimeout(() => navigate(redirectTo, { replace: true }), 800)
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── REGISTER ──────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!regForm.name || !regForm.email || !regForm.password) {
      setError('Please fill all required fields.')
      return
    }
    if (regForm.password !== regForm.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (regForm.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/user/register`, {
        name:     regForm.name,
        email:    regForm.email,
        phone:    regForm.phone,
        password: regForm.password,
      })

      if (data.success) {
        setSuccess('Account created! Redirecting...')
        await handleAuthSuccess(data.token)
        setTimeout(() => navigate(redirectTo, { replace: true }), 800)
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (err) =>
    `w-full border-2 rounded-xl py-3 px-4 text-sm outline-none transition-all duration-200 ${
      err
        ? 'border-red-300 bg-red-50 focus:border-red-400'
        : 'border-gray-200 focus:border-blue-500 hover:border-gray-300 bg-white'
    }`

  return (
    <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-8 pt-8 pb-6 text-center">
          <img
            src="https://amulyaelectronics.com/wp-content/uploads/2026/01/CONNECT-WITH-ELECTRONICS-1.png"
            alt="Amulya Electronics"
            className="h-9 mx-auto mb-4 brightness-0 invert opacity-90"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <h1 className="text-2xl font-black text-white mb-1">
            {tab === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p className="text-blue-200 text-sm">
            {tab === 'login'
              ? 'Login to access your orders and checkout faster'
              : 'Join Amulya Electronics for exclusive deals'
            }
          </p>
          {redirectTo !== '/' && (
            <div className="mt-3 bg-white/10 rounded-xl px-3 py-2 text-xs text-blue-100 font-medium">
              🔒 Login required to complete your checkout
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {['login', 'register'].map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
              className={`flex-1 py-3.5 text-sm font-black transition-all capitalize ${
                tab === t
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}>
              {t === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <div className="px-8 py-6">
          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <FiAlertCircle className="text-red-500 flex-shrink-0" size={15} />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <FiCheck className="text-green-500 flex-shrink-0" size={15} />
              <p className="text-xs text-green-700 font-medium">{success}</p>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input type="email" placeholder="rohith@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                    className={`${inputCls(false)} pl-9`} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                    className={`${inputCls(false)} pl-9 pr-10`}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded accent-blue-600" />
                  <span className="text-xs text-gray-500">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-600 font-semibold hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-black text-sm shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Logging in...</>
                ) : (
                  <>Login <FiArrowRight size={15} /></>
                )}
              </button>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input type="text" placeholder="Rohith Kumar"
                    value={regForm.name}
                    onChange={(e) => setRegForm((p) => ({ ...p, name: e.target.value }))}
                    className={`${inputCls(false)} pl-9`} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input type="email" placeholder="rohith@example.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                    className={`${inputCls(false)} pl-9`} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <input type="tel" placeholder="9876543210"
                  value={regForm.phone}
                  onChange={(e) => setRegForm((p) => ({ ...p, phone: e.target.value }))}
                  className={inputCls(false)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={regForm.password}
                    onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
                    className={`${inputCls(false)} pl-9 pr-10`}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className={`${inputCls(
                      regForm.confirmPassword && regForm.confirmPassword !== regForm.password
                    )} pl-9`}
                  />
                </div>
                {regForm.confirmPassword && regForm.confirmPassword !== regForm.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <FiAlertCircle size={11} /> Passwords do not match
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-black text-sm shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating account...</>
                ) : (
                  <>Create Account <FiArrowRight size={15} /></>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                By registering, you agree to our{' '}
                <Link to="/terms-conditions" className="text-blue-500 hover:underline">Terms & Conditions</Link>
              </p>
            </form>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              {tab === 'login' ? (
                <>Don't have an account?{' '}
                  <button onClick={() => { setTab('register'); setError('') }}
                    className="text-blue-600 font-black hover:underline">Sign Up</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => { setTab('login'); setError('') }}
                    className="text-blue-600 font-black hover:underline">Login</button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
