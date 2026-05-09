import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  FiPhone, FiMail, FiMapPin, FiClock,
  FiArrowRight, FiChevronDown,
} from 'react-icons/fi'
import {
  FaWhatsapp, FaInstagram, FaFacebookF, FaYoutube, FaTwitter,
} from 'react-icons/fa'

// ── Static data (not in DB) ───────────────────────────────────────────────────
const categories = [
  'Sensors & Modules', 'Motors', 'Motor Drivers', 'Voltmeter',
  'Soldering Iron', 'Battery', 'Battery Holders', 'Micro Controller',
  'Wireless Modules', 'LEDs', 'Resistors', 'Capacitors',
  'Display', 'Robotics', 'Kits',
]
const quickLinks = [
  { label: 'Home',         to: '/' },
  { label: 'About Us',     to: '/about' },
  { label: 'Our Products', to: '/collection' },
  { label: 'Blog',         to: '/blog' },
  { label: 'Our Contacts', to: '/contact' },
  { label: 'Stores',       to: '/stores' },
  { label: 'Promotions',   to: '/promotions' },
  { label: 'Wishlist',     to: '/wishlist' },
]
const policies = [
  { label: 'Privacy Policy',               to: '/privacy-policy' },
  { label: 'Refund & Cancellation Policy', to: '/refund-policy' },
  { label: 'Terms & Conditions',           to: '/terms' },
  { label: 'Payment & Security',           to: '/payment-security' },
  { label: 'Delivery & Return',            to: '/delivery-return' },
]

// ── Hardcoded fallbacks (shown while loading or if API fails) ─────────────────
const DEFAULTS = {
  phones:             ['+91 83107 87546', '+91 82173 17884'],
  email:              'amulyaelectronics1@gmail.com',
  address:            'Shree Banashankari Avenue, Opp. NTTF College, Ramanagar, Dharwad – 580001',
  hours:              'Mon – Sun | 9:00 AM – 8:00 PM',
  whatsapp:           'https://wa.me/918310787546',
  instagram:          'https://instagram.com',
  facebook:           'https://facebook.com',
  youtube:            'https://youtube.com',
  twitter:            'https://twitter.com',
  newsletterTitle:    '📬 Subscribe & Get 15% Off Your First Order!',
  newsletterSubtitle: 'Deals, new arrivals, and electronics tips — delivered to your inbox.',
  playStoreLink:      '#',
  appStoreLink:       '#',
  copyrightText:      'Designed by Team Up Box © 2026 Amulya Electronics. All rights reserved.',
  trustBadges: [
    { emoji: '🚚', text: 'Free Shipping above ₹999' },
    { emoji: '🔒', text: 'Secure Payments' },
    { emoji: '↩️', text: 'Easy Returns' },
    { emoji: '🎧', text: 'Mon–Sun Support' },
    { emoji: '⚡', text: 'Fast Dispatch' },
  ],
}

// ── Mobile accordion ──────────────────────────────────────────────────────────
function FooterAccordion({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-white font-bold text-sm"
      >
        {title}
        <FiChevronDown className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
export default function Footer() {
  const navigate = useNavigate()
  const [email,      setEmail]      = useState('')
  const [subscribed, setSubscribed] = useState(false)

  // ── Read from Redux (fetched once in App.jsx on mount) ────────────────────
  const { settings } = useSelector((state) => state.footer)

  // Merge API settings over defaults — so any missing field falls back safely
  const s = { ...DEFAULTS, ...(settings || {}) }

  // Build socials array from Redux data
  const socials = [
    { icon: <FaWhatsapp />,  href: s.whatsapp,  label: 'WhatsApp', color: 'hover:bg-green-500' },
    { icon: <FaInstagram />, href: s.instagram, label: 'Instagram',color: 'hover:bg-pink-600'  },
    { icon: <FaFacebookF />, href: s.facebook,  label: 'Facebook', color: 'hover:bg-blue-600'  },
    { icon: <FaYoutube />,   href: s.youtube,   label: 'YouTube',  color: 'hover:bg-red-600'   },
    { icon: <FaTwitter />,   href: s.twitter,   label: 'Twitter',  color: 'hover:bg-sky-500'   },
  ]

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email.trim()) { setSubscribed(true); setEmail('') }
  }

  return (
    <footer className="bg-gray-900 text-gray-400">

      {/* ── TRUST BADGES ── */}
      <div className="bg-blue-700 py-4 px-4">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-center gap-6 text-white text-sm font-semibold">
          {s.trustBadges.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span>{b.emoji}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── NEWSLETTER ── */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 py-8 px-4">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="text-white font-black text-xl md:text-2xl">{s.newsletterTitle}</h3>
            <p className="text-orange-100 text-sm mt-1">{s.newsletterSubtitle}</p>
          </div>
          {subscribed ? (
            <div className="bg-white/20 text-white font-bold px-6 py-3 rounded-full">
              ✅ Subscribed! Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full max-w-sm">
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                className="flex-1 rounded-full px-5 py-3 text-sm outline-none bg-white/90 text-gray-800 min-w-0"
              />
              <button type="submit"
                className="bg-white text-orange-600 font-black px-5 py-3 rounded-full hover:bg-orange-50 transition-all whitespace-nowrap flex-shrink-0">
                <FiArrowRight className="text-lg" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── MAIN FOOTER ── */}
      <div className="max-w-[1400px] mx-auto px-4 py-12">

        {/* ── DESKTOP GRID ── */}
        <div className="hidden md:grid grid-cols-12 gap-8">

          {/* Brand + Contact */}
          <div className="col-span-12 lg:col-span-4">
            <img
              src="https://amulyaelectronics.com/wp-content/uploads/2026/01/CONNECT-WITH-ELECTRONICS-1.png"
              alt="Amulya Electronics"
              onClick={() => navigate('/')}
              className="h-12 cursor-pointer mb-4 brightness-200"
            />
            <p className="text-sm leading-relaxed mb-5 max-w-sm">
              <strong className="text-white">Amulya Electronics</strong> is your trusted destination for
              high-quality electronic components, modules, sensors, motors, relays, and DIY electronics.
            </p>

            <div className="space-y-3 text-sm mb-6">
              {/* Phones from Redux */}
              {s.phones.map((ph, i) => (
                <a key={i} href={`tel:${ph.replace(/\D/g, '')}`}
                  className="flex items-center gap-3 hover:text-white transition-colors group">
                  <span className="w-8 h-8 bg-blue-600 group-hover:bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                    <FiPhone className="text-white text-xs" />
                  </span>
                  {ph}
                </a>
              ))}
              {/* Email */}
              <a href={`mailto:${s.email}`}
                className="flex items-center gap-3 hover:text-white transition-colors group">
                <span className="w-8 h-8 bg-orange-500 group-hover:bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                  <FiMail className="text-white text-xs" />
                </span>
                {s.email}
              </a>
              {/* Address */}
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiMapPin className="text-white text-xs" />
                </span>
                <span className="text-sm leading-relaxed">{s.address}</span>
              </div>
              {/* Hours */}
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiClock className="text-white text-xs" />
                </span>
                {s.hours}
              </div>
            </div>

            {/* Social icons */}
            <div className="flex gap-2">
              {socials.map((sc) => (
                <a key={sc.label} href={sc.href} target="_blank" rel="noopener noreferrer"
                  aria-label={sc.label}
                  className={`w-9 h-9 bg-gray-700 ${sc.color} text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110`}>
                  {sc.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="col-span-6 lg:col-span-3">
            <h4 className="text-white font-black text-base mb-5 border-l-4 border-blue-500 pl-3">Categories</h4>
            <ul className="space-y-2">
              {categories.slice(0, 10).map((cat) => (
                <li key={cat}>
                  <Link to={`/collection?cat=${encodeURIComponent(cat)}`}
                    className="text-sm hover:text-white hover:translate-x-1 inline-flex items-center gap-1 transition-all duration-150 group">
                    <FiArrowRight className="text-blue-500 opacity-0 group-hover:opacity-100 -ml-1 transition-opacity text-xs" />
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="col-span-6 lg:col-span-2">
            <h4 className="text-white font-black text-base mb-5 border-l-4 border-orange-500 pl-3">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to}
                    className="text-sm hover:text-white hover:translate-x-1 inline-flex items-center gap-1 transition-all duration-150 group">
                    <FiArrowRight className="text-orange-500 opacity-0 group-hover:opacity-100 -ml-1 transition-opacity text-xs" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies + App */}
          <div className="col-span-12 lg:col-span-3">
            <h4 className="text-white font-black text-base mb-5 border-l-4 border-green-500 pl-3">Policies</h4>
            <ul className="space-y-2 mb-8">
              {policies.map((p) => (
                <li key={p.label}>
                  <Link to={p.to}
                    className="text-sm hover:text-white hover:translate-x-1 inline-flex items-center gap-1 transition-all duration-150 group">
                    <FiArrowRight className="text-green-500 opacity-0 group-hover:opacity-100 -ml-1 transition-opacity text-xs" />
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* App download */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <p className="text-white font-black text-sm mb-1">📱 Download Our App</p>
              <p className="text-xs text-gray-400 mb-3">Get 15% off your first purchase</p>
              <div className="flex flex-col gap-2">
                <a href={s.playStoreLink}
                  className="flex items-center gap-2 bg-black hover:bg-gray-700 text-white rounded-xl px-3 py-2 transition-colors">
                  <span className="text-lg">▶</span>
                  <div className="leading-none">
                    <p className="text-[9px] text-gray-400">GET IT ON</p>
                    <p className="text-xs font-bold">Google Play</p>
                  </div>
                </a>
                <a href={s.appStoreLink}
                  className="flex items-center gap-2 bg-black hover:bg-gray-700 text-white rounded-xl px-3 py-2 transition-colors">
                  <span className="text-lg"></span>
                  <div className="leading-none">
                    <p className="text-[9px] text-gray-400">DOWNLOAD ON THE</p>
                    <p className="text-xs font-bold">App Store</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE ACCORDION ── */}
        <div className="md:hidden">
          <div className="mb-6">
            <img
              src="https://amulyaelectronics.com/wp-content/uploads/2026/01/CONNECT-WITH-ELECTRONICS-1.png"
              alt="Amulya Electronics" className="h-10 mb-3 brightness-200"
            />
            <p className="text-sm leading-relaxed mb-4">
              Your trusted destination for electronic components, sensors, motors & DIY kits.
            </p>
            <div className="flex gap-2 mb-4">
              {socials.map((sc) => (
                <a key={sc.label} href={sc.href} target="_blank" rel="noopener noreferrer"
                  className={`w-9 h-9 bg-gray-700 ${sc.color} text-white rounded-full flex items-center justify-center transition-all`}>
                  {sc.icon}
                </a>
              ))}
            </div>
          </div>

          <FooterAccordion title="Contact Info">
            <div className="space-y-3 text-sm">
              {s.phones.map((ph, i) => (
                <a key={i} href={`tel:${ph.replace(/\D/g, '')}`} className="flex items-center gap-2 hover:text-white">
                  <FiPhone className="text-blue-400" /> {ph}
                </a>
              ))}
              <a href={`mailto:${s.email}`} className="flex items-center gap-2 hover:text-white">
                <FiMail className="text-orange-400" /> {s.email}
              </a>
              <div className="flex items-start gap-2">
                <FiMapPin className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>{s.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="text-purple-400" /> {s.hours}
              </div>
            </div>
          </FooterAccordion>

          <FooterAccordion title="Categories">
            <ul className="grid grid-cols-2 gap-y-2">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link to={`/collection?cat=${encodeURIComponent(cat)}`}
                    className="text-sm hover:text-white transition-colors">{cat}</Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Quick Links">
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Policies">
            <ul className="space-y-2">
              {policies.map((p) => (
                <li key={p.label}>
                  <Link to={p.to} className="text-sm hover:text-white transition-colors">{p.label}</Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>

          <div className="bg-gray-800 rounded-2xl p-4 mt-4">
            <p className="text-white font-black text-sm mb-1">📱 Download Our App</p>
            <p className="text-xs text-gray-400 mb-3">15% off your first purchase</p>
            <div className="flex gap-3">
              <a href={s.playStoreLink}
                className="flex items-center gap-2 bg-black text-white rounded-xl px-3 py-2 flex-1 justify-center text-xs font-bold">
                ▶ Google Play
              </a>
              <a href={s.appStoreLink}
                className="flex items-center gap-2 bg-black text-white rounded-xl px-3 py-2 flex-1 justify-center text-xs font-bold">
                 App Store
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="border-t border-gray-700 py-5 px-4">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-center md:text-left">{s.copyrightText}</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {['VISA', 'MC', 'UPI', 'Paytm', 'GPay', 'RazorPay'].map((p) => (
              <span key={p} className="bg-gray-700 text-gray-300 text-[10px] font-bold px-2.5 py-1 rounded-md">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FLOATING WHATSAPP ── */}
      <a href={s.whatsapp} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-400 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 hover:scale-110 transition-all duration-200"
        aria-label="Chat on WhatsApp">
        <FaWhatsapp className="text-3xl" />
      </a>
    </footer>
  )
}
