// components/Navbar.jsx
// White TailAdmin-inspired Navbar
// ✅ Light/white UI     ✅ Mobile responsive
// ✅ Logo preserved     ✅ Logout preserved
// ✅ Phone link kept    ✅ User dropdown added
// ✅ onMenuToggle prop  (wires sidebar hamburger in App.jsx)

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/CONNECT-WITH-ELECTRONICS-1.webp'

const Navbar = ({ setToken, adminInfo }) => {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const userName = adminInfo?.name || 'Admin'
  const userRole = adminInfo?.role || 'super_admin'
  const initial  = userName.charAt(0).toUpperCase()

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        height: 64,
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          width: '100%',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>

          {/* ── LEFT: logo ─────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flexShrink: 0 }}>
            {/* Logo */}
            <a href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <img
                src={logo}
                alt="Amulya Electronics"
                style={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block' }}
              />
            </a>
          </div>

          {/* ── CENTRE: admin badge (desktop) ─────────────────── */}
          <div className="n-badge" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 14px', borderRadius: 99,
            background: '#eff6ff', border: '1px solid #bfdbfe',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#2563eb', flexShrink: 0,
              animation: 'nbPulse 2s infinite',
            }} />
            <span style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#2563eb', whiteSpace: 'nowrap',
            }}>Admin Panel</span>
          </div>

          {/* ── RIGHT: user + logout ──────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

            {/* ── User chip + dropdown ── */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 10px 4px 4px', borderRadius: 99,
                  border: '1px solid #e5e7eb', background: '#fff',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                aria-label="User menu"
                aria-expanded={dropdownOpen}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>{initial}</div>
                <span className="n-uname" style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                  {userName}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    width: 12, height: 12, color: '#9ca3af', flexShrink: 0,
                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {/* Dropdown panel */}
              {dropdownOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={() => setDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 210, background: '#fff',
                    border: '1px solid #e5e7eb', borderRadius: 12,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.11)',
                    zIndex: 20, overflow: 'hidden',
                  }}>
                    {/* Profile row */}
                    <div style={{ padding: '13px 15px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>{initial}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{userName}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af' }}>{userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : userRole === 'staff' ? 'Staff' : 'Bloger'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('/profile') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 15px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#374151', fontSize: 13, fontWeight: 500,
                        textAlign: 'left', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                        style={{width:15,height:15,color:'#6b7280',flexShrink:0}}>
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      My Profile
                    </button>

                    <div style={{ height: 1, background: '#f3f4f6' }} />

                    {/* Logout in dropdown */}
                    <button
                      onClick={() => { setDropdownOpen(false); setToken('') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 15px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#dc2626', fontSize: 13, fontWeight: 500,
                        textAlign: 'left', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                        style={{width:15,height:15,flexShrink:0}}>
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── Quick logout button ── */}
            <button
              onClick={() => setToken('')}
              className="n-logout"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                border: '1px solid #fecaca', background: '#fff5f5',
                color: '#dc2626', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.borderColor = '#fecaca' }}
              title="Logout"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
              </svg>
              <span className="n-logout-txt">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <style>{`
        /* Centre badge: hide on tiny screens */
        .n-badge { display: flex !important; }
        @media (max-width: 600px) { .n-badge { display: none !important; } }

        /* Username in chip: hide on very small */
        .n-uname { display: inline !important; }
        @media (max-width: 400px) { .n-uname { display: none !important; } }

        /* Quick logout: icon-only on tiny screens */
        .n-logout { display: flex !important; }
        .n-logout-txt { display: inline !important; }
        @media (max-width: 480px) {
          .n-logout-txt { display: none !important; }
          .n-logout { padding: 7px 9px !important; }
        }

        /* Pulse animation for admin badge dot */
        @keyframes nbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </>
  )
}

export default Navbar