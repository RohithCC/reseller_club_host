// components/Sidebar.jsx
// White TailAdmin-inspired sidebar
// ✅ Clean light UI  ✅ Unique icons per item  ✅ Flat section layout
// ✅ Mobile drawer   ✅ Desktop collapse toggle  ✅ All routes intact

import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

// ─── Unique SVG icons per route ───────────────────────────────────────────────
const IC = {
  // Products section
  AddItem: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M12 8v8M8 12h8"/>
    </svg>
  ),
  ListItems: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
    </svg>
  ),
  Categories: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>
    </svg>
  ),
  Orders: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <path d="M3 6h18M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
  // Blog section
  Frontend: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="m8 21 4-4 4 4M12 17v4"/>
    </svg>
  ),
  Projects: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M2 7a2 2 0 012-2h4l2 3h10a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2z"/>
    </svg>
  ),
  BannerFooter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <rect x="2" y="4" width="20" height="5" rx="1"/>
      <rect x="2" y="15" width="20" height="5" rx="1"/>
      <path d="M6 11h12"/>
    </svg>
  ),
  AddBlog: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  BlogPosts: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </svg>
  ),
  // CRM section
  Contacts: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  // Sales Analytics icon
  Analytics: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/>
    </svg>
  ),
  // Customers icon (people with shopping bag)
  Customers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <circle cx="19" cy="7" r="3"/>
      <path d="M22 14v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3"/>
    </svg>
  ),
  FooterSettings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <rect x="2" y="2" width="20" height="20" rx="2"/>
      <path d="M2 17h20M7 21V17M12 21V17M17 21V17"/>
    </svg>
  ),
  HeroBanner: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
  // YouTube icon
  YouTube: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor"/>
    </svg>
  ),

  // Coupon icon
  Coupon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  // Admin section
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  // Dashboard icon
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,flexShrink:0}}>
      <rect x="3" y="3" width="4" height="4" rx="1"/>
      <rect x="17" y="3" width="4" height="4" rx="1"/>
      <rect x="3" y="17" width="4" height="4" rx="1"/>
      <rect x="17" y="17" width="4" height="4" rx="1"/>
      <rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  ),
  // UI controls
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,flexShrink:0}}>
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  Hamburger: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
      <path d="M3 12h18M3 6h18M3 18h18"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  // Section header icons
  Package: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    </svg>
  ),
  Book: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93A10 10 0 004.93 19.07M4.93 4.93A10 10 0 0119.07 19.07"/>
    </svg>
  ),
  Logo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
}

// ─── Section definitions ──────────────────────────────────────────────────────
const SECTIONS = [
  {
    label: 'Main',
    SIcon: IC.Logo,
    items: [
      { to: '/dashboard', label: 'Dashboard',   Icon: IC.Dashboard, roles: ['super_admin','admin','staff'] },
    ],
  },
  {
    label: 'Products',
    SIcon: IC.Package,
    items: [
      { to: '/add',        label: 'Add Items',   Icon: IC.AddItem,   roles: ['super_admin','admin','staff'] },
      { to: '/list',       label: 'Items List',  Icon: IC.ListItems, roles: ['super_admin','admin','staff'] },
      { to: '/categories', label: 'Categories',  Icon: IC.Categories, roles: ['super_admin','admin','staff'] },
      { to: '/orders',     label: 'Order',       Icon: IC.Orders,   roles: ['super_admin','admin','staff'] },
      { to: '/coupons',    label: 'Coupons',     Icon: IC.Coupon,   roles: ['super_admin','admin'] },
      { to: '/payment-controller', label: 'Payment Controller', Icon: IC.Settings, roles: ['super_admin','admin'] },
      { to: '/sales-analytics', label: 'Sales Analytics', Icon: IC.Analytics, roles: ['super_admin','admin','staff'] },
    ],
  },
  {
    label: 'Content',
    SIcon: IC.Book,
    items: [
      { to: '/blog',         label: 'Blog Manager',    Icon: IC.BlogPosts, roles: ['super_admin','admin','staff','bloger'] },
    ],
  },
  {
    label: 'Website Setting',
    SIcon: IC.Settings,
    items: [
      { to: '/hero-banner', label: 'Hero Banner',       Icon: IC.HeroBanner,  roles: ['super_admin','admin'] },
      { to: '/youtube-reels', label: 'YouTube Reels', Icon: IC.YouTube, roles: ['super_admin','admin'] },
      { to: '/cta-banners',  label: 'CTA Banners', Icon: IC.BannerFooter, roles: ['super_admin','admin'] },
      { to: '/footer-settings',label: 'Footer Setting',    Icon: IC.FooterSettings, roles: ['super_admin','admin'] },
      { to: '/contacts',    label: 'Contacts',          Icon: IC.Contacts,    roles: ['super_admin','admin','staff'] },
      { to: '/customers',   label: 'Customers',         Icon: IC.Customers,   roles: ['super_admin','admin','staff'] },
    ],
  },
  {
    label: 'Users',
    SIcon: IC.Users,
    items: [
      { to: '/users',       label: 'Add Users',        Icon: IC.Users,      roles: ['super_admin'] },
    ],
  },
]

// ─── Filter nav items by role ────────────────────────────────────────────────
const filterByRole = (items, role) =>
  items.filter(item => !item.roles || item.roles.includes(role))

// ─── Reusable NavLink ─────────────────────────────────────────────────────────
const SideNavLink = ({ to, label, Icon, collapsed, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: collapsed ? '9px 0' : '8px 11px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: 8,
      textDecoration: 'none',
      fontSize: 13,
      fontWeight: isActive ? 600 : 500,
      color: isActive ? '#2563eb' : '#374151',
      background: isActive ? '#dbeafe' : 'transparent',
      marginBottom: 2,
      position: 'relative',
      transition: 'all 0.15s ease',
    })}
    onMouseEnter={e => {
      if (e.currentTarget.style.background !== 'rgb(238, 242, 255)') {
        e.currentTarget.style.background = '#f3f4f6'
        e.currentTarget.style.color = '#111827'
      }
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = ''
      e.currentTarget.style.color = ''
    }}
  >
    {({ isActive }) => (
      <>
        {/* Active indicator */}
        {isActive && !collapsed && (
          <span style={{
            position: 'absolute', left: 0, top: 6, bottom: 6,
            width: 3, background: '#2563eb', borderRadius: '0 3px 3px 0',
          }} />
        )}
        <span style={{ color: isActive ? '#2563eb' : '#6b7280', display: 'flex', flexShrink: 0 }}>
          <Icon />
        </span>
        {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
      </>
    )}
  </NavLink>
)

// ─── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ label, SIcon, collapsed }) =>
  collapsed ? (
    <div style={{ height: 1, background: '#f3f4f6', margin: '8px 6px' }} />
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 11px 5px' }}>
      <span style={{ color: '#9ca3af' }}><SIcon /></span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>
        {label}
      </span>
    </div>
  )

// ─── Logo mark ────────────────────────────────────────────────────────────────
const LogoMark = ({ size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.27),
    background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}>
    <IC.Logo />
  </div>
)

// ─── Sidebar inner content ────────────────────────────────────────────────────
const SidebarContent = ({
  collapsed, onCollapse, showCollapseBtn,
  onNavClick, role = 'super_admin',
}) => {
  return (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'space-between',
      padding: collapsed ? '16px 0' : '16px 16px',
      borderBottom: '1px solid #f3f4f6', flexShrink: 0, gap: 8,
    }}>
      {!collapsed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <LogoMark size={32} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              AdminPanel
            </p>
            <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>Management Suite</p>
          </div>
        </div>
      )}
      {collapsed && <LogoMark size={32} />}
      {showCollapseBtn && (
        <button
          onClick={onCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 26, height: 26, borderRadius: 6,
            border: '1px solid #e5e7eb', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6b7280',
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#d1d5db' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb' }}
        >
          <span style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', display: 'flex' }}>
            <IC.ChevronLeft />
          </span>
        </button>
      )}
    </div>

    {/* Nav */}
    <nav style={{
      flex: 1, overflowY: 'auto', overflowX: 'hidden',
      padding: collapsed ? '10px 8px' : '10px 10px',
    }}>
      {SECTIONS.map(section => {
        const visible = filterByRole(section.items, role)
        if (visible.length === 0) return null
        return (
          <div key={section.label}>
            <SectionLabel label={section.label} SIcon={section.SIcon} collapsed={collapsed} />
            {visible.map(item => (
              <SideNavLink key={item.to} {...item} collapsed={collapsed} onClick={onNavClick} />
            ))}
          </div>
        )
      })}
    </nav>

    {/* User footer */}
    {!collapsed && (
      <div style={{
        padding: '12px 16px', borderTop: '1px solid #f3f4f6',
        background: '#fafafa', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>A</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Admin User
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af' }}>{role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : role === 'staff' ? 'Staff' : 'Bloger'}</p>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600,
            background: '#ecfdf5', color: '#059669',
            padding: '3px 8px', borderRadius: 99, flexShrink: 0,
          }}>● Online</span>
        </div>
      </div>
    )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const Sidebar = ({ role = 'super_admin' }) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className="s-desktop" style={{
      width: collapsed ? 64 : 240,
      minHeight: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <SidebarContent
        collapsed={collapsed}
        onCollapse={() => setCollapsed(c => !c)}
        showCollapseBtn={true}
        onNavClick={undefined}
        role={role}
      />
    </aside>
  )
}

export default Sidebar
