// components/Login.jsx
// TailAdmin-inspired white login page
// ✅ Clean light UI        ✅ Mobile responsive
// ✅ All logic preserved   ✅ Toast errors kept
// ✅ Loading spinner       ✅ Show/hide password

import axios from 'axios'
import React, { useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Login = ({ setToken }) => {
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [showPass,    setShowPass]    = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await axios.post(backendUrl + '/api/user/admin', { email, password })
      if (response.data.success) {
        setToken(response.data.token)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* ── Decorative blobs ── */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, #bfdbfe 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, #e0f2fe 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ── Main card ── */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 40px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}>

          {/* ── Card header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            {/* Logo mark */}
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg viewBox="0 0 24 24" fill="white" style={{width:22,height:22}}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p style={{
                color: '#fff', fontSize: 18, fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>Amulya Electronics</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>
                Admin Dashboard
              </p>
            </div>

            {/* Right: status pill */}
            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 99, padding: '4px 10px',
                fontSize: 11, fontWeight: 600, color: '#fff',
                whiteSpace: 'nowrap',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 0 2px rgba(74,222,128,0.3)',
                }} />
                Secure
              </span>
            </div>
          </div>

          {/* ── Form body ── */}
          <div style={{ padding: '32px 32px 28px' }}>

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontSize: 22, fontWeight: 700, color: '#111827',
                letterSpacing: '-0.025em', margin: 0,
              }}>Welcome back</h1>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
                Sign in to access the admin panel
              </p>
            </div>

            <form onSubmit={onSubmitHandler} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Email field */}
              <div>
                <label style={{
                  display: 'block', fontSize: 13, fontWeight: 600,
                  color: '#374151', marginBottom: 7,
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 13, top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af', display: 'flex', pointerEvents: 'none',
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                      strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      fontSize: 14, color: '#111827',
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#2563eb'
                      e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.12)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e5e7eb'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    style={{
                      fontSize: 12, color: '#2563eb', fontWeight: 500,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 13, top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af', display: 'flex', pointerEvents: 'none',
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                      strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 42px 10px 40px',
                      fontSize: 14, color: '#111827',
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#2563eb'
                      e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.12)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e5e7eb'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  {/* Show / hide toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9ca3af', display: 'flex', padding: 2,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
                    onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                        strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
                        <path d="M10.73 10.73a3 3 0 004.54 4.54"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                        strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: loading
                    ? '#93c5fd'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#fff',
                  fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(79,70,229,0.35)',
                  marginTop: 4,
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,70,229,0.45)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 14px rgba(79,70,229,0.35)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {loading ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" style={{
                      width: 16, height: 16,
                      animation: 'loginSpin 0.8s linear infinite',
                    }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4"/>
                      <path d="M4 12a8 8 0 018-8v8z" fill="white"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In to Admin Panel
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>

            </form>

            {/* ── Divider ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 0',
            }}>
              <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap' }}>
                SECURE ACCESS ONLY
              </span>
              <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
            </div>

            {/* ── Trust badges ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
              marginTop: 16,
            }}>
              {[
                { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Encrypted' },
                { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Protected' },
                { icon: 'M5 13l4 4L19 7', label: 'Verified' },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  color: '#9ca3af', fontSize: 11, fontWeight: 500,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                    strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,color:'#6b7280'}}>
                    <path d={icon}/>
                  </svg>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Card footer ── */}
          <div style={{
            padding: '14px 32px',
            borderTop: '1px solid #f3f4f6',
            background: '#fafafa',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12,
          }}>
            <p style={{ fontSize: 12, color: '#9ca3af' }}>© 2025 Amulya Electronics</p>
            <p style={{
              fontSize: 11, color: '#9ca3af',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12}}>
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Dharwad, Karnataka
            </p>
          </div>
        </div>

        {/* ── Below card tag ── */}
        <p style={{
          position: 'absolute', bottom: 16,
          fontSize: 11, color: '#cbd5e1', textAlign: 'center',
        }}>
          Amulya Electronics Admin v2.4 · All rights reserved
        </p>
      </div>

      <style>{`
        @keyframes loginSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: #9ca3af; }
        input[type="email"],
        input[type="password"],
        input[type="text"] {
          -webkit-appearance: none;
          appearance: none;
        }
        /* Mobile: tighter padding */
        @media (max-width: 480px) {
          .login-card-body { padding: 24px 20px 20px !important; }
          .login-card-footer { padding: 12px 20px !important; }
          .login-card-header { padding: 22px 20px !important; }
        }
      `}</style>
    </>
  )
}

export default Login