import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  FiLock, FiEye, FiEyeOff,
  FiAlertCircle, FiCheck, FiArrowRight, FiArrowLeft,
} from 'react-icons/fi'
import axios from 'axios'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// Password strength helper
const getStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 8)           score++
  if (/[A-Z]/.test(pwd))         score++
  if (/[0-9]/.test(pwd))         score++
  if (/[^A-Za-z0-9]/.test(pwd))  score++
  const map = [
    { label: '',       color: '' },
    { label: 'Weak',   color: 'bg-red-400' },
    { label: 'Fair',   color: 'bg-amber-400' },
    { label: 'Good',   color: 'bg-blue-400' },
    { label: 'Strong', color: 'bg-green-500' },
  ]
  return { score, ...map[score] }
}

// ─── RESET PASSWORD PAGE ──────────────────────────────────────────────────────
export default function ResetPassword() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()

  // ✅ URL format: /reset-password?token=<rawToken>&id=<userId>
  const token  = searchParams.get('token') || ''
  const userId = searchParams.get('id')    || ''   // backend sends "id", not "userId"

  const [form,    setForm]    = useState({ password: '', confirmPassword: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [done,    setDone]    = useState(false)

  const strength = getStrength(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!form.password || !form.confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      // ✅ Backend expects: { userId, token, newPassword }
      const { data } = await axios.post(`${API_BASE}/api/user/reset-password`, {
        userId,            // from URL param "id"
        token,             // from URL param "token"
        newPassword: form.password,
      })

      if (data.success) {
        setSuccess(data.message || 'Password reset successfully! Redirecting to login...')
        setDone(true)
        setTimeout(() => navigate('/login', { replace: true }), 2000)
      } else {
        setError(data.message || 'Reset failed. Please try again.')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (hasErr) =>
    `w-full border-2 rounded-xl py-3 px-4 text-sm outline-none transition-all duration-200 ${
      hasErr
        ? 'border-red-300 bg-red-50 focus:border-red-400'
        : 'border-gray-200 focus:border-blue-500 hover:border-gray-300 bg-white'
    }`

  // ── Invalid link state — token or id missing from URL ─────────────────────
  if (!token || !userId) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-8 pt-8 pb-6 text-center">
            <img
              src="https://amulyaelectronics.com/wp-content/uploads/2026/01/CONNECT-WITH-ELECTRONICS-1.png"
              alt="Amulya Electronics"
              className="h-9 mx-auto mb-4 brightness-0 invert opacity-90"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <h1 className="text-2xl font-black text-white mb-1">Reset Password</h1>
          </div>
          <div className="px-8 py-8 text-center">
            <div className="w-14 h-14 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="text-red-500" size={24} />
            </div>
            <h2 className="text-base font-black text-gray-800 mb-2">Invalid Reset Link</h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-blue-100 transition-all"
            >
              Request New Link <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Main reset form ───────────────────────────────────────────────────────
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
            {done ? 'Password Reset!' : 'Set New Password'}
          </h1>
          <p className="text-blue-200 text-sm">
            {done
              ? 'Your password has been updated successfully'
              : 'Choose a strong password for your account'
            }
          </p>
        </div>

        <div className="px-8 py-6">

          {/* Back to Login */}
          {!done && (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 font-semibold mb-5 transition-colors"
            >
              <FiArrowLeft size={13} /> Back to Login
            </Link>
          )}

          {/* Error / Success banners */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={15} />
              <p className="text-xs text-red-700 font-medium leading-relaxed">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <FiCheck className="text-green-500 flex-shrink-0 mt-0.5" size={15} />
              <p className="text-xs text-green-700 font-medium leading-relaxed">{success}</p>
            </div>
          )}

          {/* ── Success / done state ── */}
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="text-green-500" size={24} />
              </div>
              <h2 className="text-base font-black text-gray-800 mb-1">All done!</h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-5">
                Redirecting you to login...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-blue-100 transition-all"
              >
                Go to Login <FiArrowRight size={14} />
              </Link>
            </div>

          ) : (
            /* ── Reset form ── */
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className={`${inputCls(false)} pl-9 pr-10`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>

                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : 'bg-gray-100'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      Strength:{' '}
                      <span className={`font-semibold ${
                        strength.score <= 1 ? 'text-red-500'
                          : strength.score === 2 ? 'text-amber-500'
                          : strength.score === 3 ? 'text-blue-500'
                          : 'text-green-600'
                      }`}>
                        {strength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className={`${inputCls(
                      form.confirmPassword && form.confirmPassword !== form.password
                    )} pl-9`}
                  />
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <FiAlertCircle size={11} /> Passwords do not match
                  </p>
                )}
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1 font-medium">
                    <FiCheck size={11} /> Passwords match
                  </p>
                )}
              </div>

              {/* Password rules checklist */}
              <ul className="text-xs space-y-1 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                {[
                  ['At least 8 characters',          form.password.length >= 8],
                  ['One uppercase letter',            /[A-Z]/.test(form.password)],
                  ['One number',                      /[0-9]/.test(form.password)],
                  ['One special character (!@#$...)', /[^A-Za-z0-9]/.test(form.password)],
                ].map(([rule, met]) => (
                  <li
                    key={rule}
                    className={`flex items-center gap-1.5 transition-colors ${
                      met ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <FiCheck size={10} className={met ? 'opacity-100' : 'opacity-20'} />
                    {rule}
                  </li>
                ))}
              </ul>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-black text-sm shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>Reset Password <FiArrowRight size={15} /></>
                )}
              </button>
            </form>
          )}

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
