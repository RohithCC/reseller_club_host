import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiMail, FiAlertCircle, FiCheck, FiArrowRight, FiArrowLeft,
} from 'react-icons/fi'
import axios from 'axios'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// ─── FORGOT PASSWORD PAGE ─────────────────────────────────────────────────────
export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    // ── Client-side validation ──────────────────────────────────────────────
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      // ✅ POST { email } → backend generates userId + rawToken,
      //    hashes token → saves to DB, emails link:
      //    /reset-password?userId=<_id>&token=<rawToken>
      const { data } = await axios.post(
        `${API_BASE}/api/user/forgot-password`,
        { email: trimmed }
      )

      if (data.success) {
        setSuccess(data.message || 'Reset link sent! Check your inbox.')
        setSent(true)
      } else {
        // Show backend message (e.g. "No account found with this email")
        setError(data.message || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      // Network / server errors
      const msg = err.response?.data?.message || err.message
      setError(msg || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Try again handler ─────────────────────────────────────────────────────
  const handleTryAgain = () => {
    setSent(false)
    setSuccess('')
    setError('')
    setEmail('')
  }

  const inputCls = `w-full border-2 rounded-xl py-3 px-4 text-sm outline-none transition-all duration-200 border-gray-200 focus:border-blue-500 hover:border-gray-300 bg-white`

  return (
    <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-8 pt-8 pb-6 text-center">
          <img
            src="https://amulyaelectronics.com/wp-content/uploads/2026/01/CONNECT-WITH-ELECTRONICS-1.png"
            alt="Amulya Electronics"
            className="h-9 mx-auto mb-4 brightness-0 invert opacity-90"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <h1 className="text-2xl font-black text-white mb-1">
            {sent ? 'Check Your Inbox' : 'Forgot Password?'}
          </h1>
          <p className="text-blue-200 text-sm">
            {sent
              ? 'A reset link has been sent to your email'
              : "Enter your registered email and we'll send you a reset link"
            }
          </p>
        </div>

        <div className="px-8 py-6">

          {/* ── Back to Login ── */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 font-semibold mb-5 transition-colors"
          >
            <FiArrowLeft size={13} /> Back to Login
          </Link>

          {/* ── Error banner ── */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={15} />
              <p className="text-xs text-red-700 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* ── Success banner ── */}
          {success && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <FiCheck className="text-green-500 flex-shrink-0 mt-0.5" size={15} />
              <p className="text-xs text-green-700 font-medium leading-relaxed">{success}</p>
            </div>
          )}

          {/* ── Sent confirmation state ── */}
          {sent ? (
            <div className="text-center py-2">
              <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMail className="text-blue-500" size={26} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-1">
                We sent a password reset link to
              </p>
              <p className="text-sm font-black text-gray-800 mb-4">{email}</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Click the link in the email to reset your password.
                If you don't see it, check your spam folder.
              </p>

              {/* Resend option */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-400 mb-2">Didn't receive the email?</p>
                <button
                  onClick={handleTryAgain}
                  className="text-xs text-blue-600 font-black hover:underline"
                >
                  Try a different email address
                </button>
              </div>
            </div>

          ) : (
            /* ── Email form ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                    size={15}
                  />
                  <input
                    type="email"
                    placeholder="rohith@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    className={`${inputCls} pl-9`}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-black text-sm shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>Send Reset Link <FiArrowRight size={15} /></>
                )}
              </button>
            </form>
          )}

          {/* ── Footer ── */}
          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Remembered your password?{' '}
              <Link to="/login" className="text-blue-600 font-black hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
