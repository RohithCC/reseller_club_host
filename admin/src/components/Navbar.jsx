import React, { useState } from 'react'
import logo from '../assets/CONNECT-WITH-ELECTRONICS-1.webp'

// ---------------------------------------------------------------------------
// Amulya Electronics – Admin Navbar
// Responsive, themed to match https://amulyaelectronics.com/
// Replace `assets.logo` import with the live logo URL used below, or keep
// your local assets import and swap the src back to `assets.logo`.
// ---------------------------------------------------------------------------

const LOGO_URL =
  'https://amulyaelectronics.com/wp-content/uploads/2026/01/CONNECT-WITH-ELECTRONICS-1.png'

const Navbar = ({ setToken }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* ── Topbar ── */}
      <nav
        style={{
          background: 'linear-gradient(90deg, #0a0f1e 0%, #0d1a2e 60%, #0f2240 100%)',
          borderBottom: '2px solid #00c2ff33',
          boxShadow: '0 2px 20px #00c2ff22',
        }}
        className="w-full sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* ── Logo ── */}
            <a href="/" className="flex items-center gap-3 shrink-0">
              <img
                src={logo}
                alt="Amulya Electronics"
                className="h-10 md:h-14 w-auto object-contain"
                style={{ filter: 'brightness(1.05) drop-shadow(0 0 6px #00c2ff66)' }}
              />
            </a>

            {/* ── Centre badge (desktop) ── */}
            <div className="hidden md:flex items-center gap-2 px-4 py-1 rounded-full"
              style={{
                background: '#00c2ff11',
                border: '1px solid #00c2ff44',
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#00c2ff' }}
              />
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: '#00c2ff', fontFamily: "'Courier New', monospace" }}
              >
                Admin Panel
              </span>
            </div>

            {/* ── Right controls ── */}
            <div className="flex items-center gap-3">

              {/* Phone (desktop only) */}
              <a
                href="tel:8310787546"
                className="hidden lg:flex items-center gap-2 text-xs"
                style={{ color: '#94a3b8' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                
              </a>

              {/* Logout button */}
              <button
                onClick={() => setToken('')}
                className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #00c2ff 0%, #0077b6 100%)',
                  color: '#fff',
                  boxShadow: '0 0 12px #00c2ff55',
                  letterSpacing: '0.04em',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 0 22px #00c2ffaa'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 0 12px #00c2ff55'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Hamburger (mobile) */}
              <button
                className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Toggle menu"
              >
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="block w-5 h-0.5 rounded-full transition-all duration-300"
                    style={{
                      background: '#00c2ff',
                      opacity: menuOpen && i === 1 ? 0 : 1,
                      transform:
                        menuOpen
                          ? i === 0
                            ? 'rotate(45deg) translateY(6px)'
                            : i === 2
                            ? 'rotate(-45deg) translateY(-6px)'
                            : 'none'
                          : 'none',
                    }}
                  />
                ))}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile dropdown ── */}
        <div
          className="md:hidden overflow-hidden transition-all duration-300"
          style={{
            maxHeight: menuOpen ? '200px' : '0',
            background: '#0a0f1e',
            borderTop: menuOpen ? '1px solid #00c2ff22' : 'none',
          }}
        >
          <div className="px-6 py-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#00c2ff' }}
              />
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: '#00c2ff', fontFamily: "'Courier New', monospace" }}
              >
                Admin Panel
              </span>
            </div>
            <a
              href="tel:8310787546"
              className="text-sm flex items-center gap-2"
              style={{ color: '#94a3b8' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            
            </a>
          </div>
        </div>

        {/* ── Glowing bottom line ── */}
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #00c2ff, transparent)',
            opacity: 0.5,
          }}
        />
      </nav>
    </>
  )
}

export default Navbar
