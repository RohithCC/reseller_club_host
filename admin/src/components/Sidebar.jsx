// components/Sidebar.jsx
import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

// ─── Products Nav ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    to: '/add',
    label: 'Add Items',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    to: '/list',
    label: 'List Items',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/categories',
    label: 'Categories',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    to: '/orders',
    label: 'Orders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
]

// ─── Blog Nav ─────────────────────────────────────────────────────────────────
const BLOG_ITEMS = [
  {
    to: '/blog/frontend',
    label: 'Blog_Frontend',   // ✅ Fixed: was showing raw route '/blog_frontend'
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
   {
    to: '/blog/projects',
    label: 'add projects',   // ✅ Fixed: was showing raw route '/blog_frontend'
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
    {
    to: '/banner_footer',
    label: 'banner_footer',   // ✅ Fixed: was showing raw route '/blog_frontend'
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/blog/add',
    label: 'Add Blog',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    to: '/blog/list',
    label: 'Blog Posts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
]

// ─── CRM / Settings Nav ───────────────────────────────────────────────────────
const CRM_ITEMS = [
  {
    to: '/contacts',
    label: 'Contacts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/footer-settings',
    label: 'Footer Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M4 16h16M9 12h6M11 8h2M12 4v4" />
      </svg>
    ),
  },
  {
    to: '/hero-banner',
    label: 'Hero Banner',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
]

// ─── Reusable NavLink ─────────────────────────────────────────────────────────
const SideNavLink = ({ to, label, icon, collapsed, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden"
    style={({ isActive }) => ({
      background:  isActive ? 'linear-gradient(90deg,#00c2ff22,#00c2ff11)' : 'transparent',
      color:       isActive ? '#00c2ff' : '#94a3b8',
      borderLeft:  isActive ? '3px solid #00c2ff' : '3px solid transparent',
    })}
  >
    {({ isActive }) => (
      <>
        <span
          style={{ color: isActive ? '#00c2ff' : '#64748b' }}
          className="transition-colors duration-200 group-hover:text-cyan-400"
        >
          {icon}
        </span>
        {!collapsed && (
          <span
            className="text-sm font-semibold tracking-wide whitespace-nowrap"
            style={{ color: isActive ? '#00c2ff' : '#94a3b8' }}
          >
            {label}
          </span>
        )}
        {/* Hover glow overlay */}
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-lg"
          style={{ background: '#00c2ff0a' }}
        />
      </>
    )}
  </NavLink>
)

// ─── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ label, collapsed }) =>
  !collapsed ? (
    <div className="px-3 pt-5 pb-1">
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#1e3a5f',
        fontFamily: "'Courier New', monospace",
      }}>
        {label}
      </span>
    </div>
  ) : (
    <div style={{ height: 1, background: '#00c2ff11', margin: '10px 8px' }} />
  )

// ─── Accordion group (section label + collapsible items) ──────────────────────
// ✅ Fixed: removed duplicate accordion toggle — section label IS the header now.
//    Accordion only collapses the item list; the label stays visible always.
const AccordionSection = ({ label, icon, items, open, onToggle, collapsed, onNavClick }) => (
  <>
    <SectionLabel label={label} collapsed={collapsed} />

    {/* Only show toggle chevron when sidebar is expanded */}
    {!collapsed && (
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200"
        style={{ color: '#475569', background: 'transparent', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.background = '#00c2ff08'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: '#334155' }}>{icon}</span>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: '#475569',
            fontFamily: "'Courier New', monospace",
          }}>
            {open ? 'Collapse' : 'Expand'}
          </span>
        </div>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="w-3.5 h-3.5"
          style={{
            color: '#334155',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )}

    {/* Items — always show when collapsed (icon-only mode), animate when expanded */}
    {collapsed ? (
      items.map(item => (
        <SideNavLink key={item.to} {...item} collapsed={true} onClick={onNavClick} />
      ))
    ) : (
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? `${items.length * 52}px` : '0px' }}
      >
        {items.map(item => (
          <SideNavLink key={item.to} {...item} collapsed={false} onClick={onNavClick} />
        ))}
      </div>
    )}
  </>
)

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const [collapsed,  setCollapsed]  = useState(false)
  const [blogOpen,   setBlogOpen]   = useState(true)
  const [crmOpen,    setCrmOpen]    = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = () => setDrawerOpen(false)

  // ── Inner content (shared by desktop + mobile drawer) ──
  const SidebarContent = ({ forcedExpanded = false }) => {
    const isExpanded = forcedExpanded || !collapsed

    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'Courier New',monospace" }}>

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: '1px solid #00c2ff22' }}
        >
          {isExpanded && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00c2ff' }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#00c2ff' }}>
                Dashboard
              </span>
            </div>
          )}
          {/* Collapse toggle — only on desktop sidebar, not inside mobile drawer */}
          {!forcedExpanded && (
            <button
              onClick={() => setCollapsed(c => !c)}
              className="hidden md:flex items-center justify-center w-7 h-7 rounded"
              style={{ background: '#00c2ff11', color: '#00c2ff' }}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="w-4 h-4"
                style={{
                  transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2 pt-2 flex-1 overflow-y-auto pb-6">

          {/* ── PRODUCTS ── */}
          <SectionLabel label="Products" collapsed={!isExpanded} />
          {NAV_ITEMS.map(item => (
            <SideNavLink
              key={item.to}
              {...item}
              collapsed={!isExpanded}
              onClick={closeDrawer}
            />
          ))}

          {/* ── BLOG ── */}
          <AccordionSection
            label="Blog"
            open={blogOpen}
            onToggle={() => setBlogOpen(o => !o)}
            items={BLOG_ITEMS}
            collapsed={!isExpanded}
            onNavClick={closeDrawer}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            }
          />

          {/* ── CRM & SETTINGS ── */}
          <AccordionSection
            label="CRM & Settings"
            open={crmOpen}
            onToggle={() => setCrmOpen(o => !o)}
            items={CRM_ITEMS}
            collapsed={!isExpanded}
            onNavClick={closeDrawer}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </nav>

        {/* Footer */}
        {isExpanded && (
          <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid #00c2ff11' }}>
            <p className="text-xs" style={{ color: '#334155' }}>© Amulya Electronics</p>
            <p className="text-xs mt-0.5" style={{ color: '#1e3a5f' }}>Dharwad, Karnataka</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col min-h-screen sticky top-0 transition-all duration-300"
        style={{
          width:       collapsed ? '64px' : '220px',
          background:  'linear-gradient(180deg,#0a0f1e 0%,#0d1a2e 100%)',
          borderRight: '1px solid #00c2ff22',
          boxShadow:   '2px 0 20px #00000044',
          flexShrink:  0,
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile FAB ── */}
      <button
        className="md:hidden fixed bottom-5 left-5 z-50 w-12 h-12 rounded-full flex items-center justify-center"
        onClick={() => setDrawerOpen(o => !o)}
        style={{
          background: 'linear-gradient(135deg,#00c2ff,#0077b6)',
          boxShadow:  '0 0 20px #00c2ff66',
        }}
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
          {drawerOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* ── Mobile backdrop ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: '#00000066', backdropFilter: 'blur(2px)' }}
          onClick={closeDrawer}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className="md:hidden fixed top-0 left-0 h-full z-50 flex flex-col"
        style={{
          width:       '240px',
          background:  'linear-gradient(180deg,#0a0f1e 0%,#0d1a2e 100%)',
          borderRight: '1px solid #00c2ff22',
          transform:   drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition:  'transform 0.3s ease',
          boxShadow:   drawerOpen ? '4px 0 30px #00000088' : 'none',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: '1px solid #00c2ff22' }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00c2ff' }} />
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: '#00c2ff', fontFamily: "'Courier New',monospace" }}
            >
              Menu
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="w-7 h-7 flex items-center justify-center rounded"
            style={{ color: '#64748b' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SidebarContent forcedExpanded={true} />
        </div>
      </aside>
    </>
  )
}

export default Sidebar