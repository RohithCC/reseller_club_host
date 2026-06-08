import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  FiAward, FiUsers, FiPackage, FiTruck,
  FiShield, FiRotateCcw, FiHeart, FiZap,
  FiStar, FiMapPin, FiPhone, FiMail,
  FiCheckCircle, FiArrowRight,
} from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa'

// ─── SCROLL REVEAL HOOK ─────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          obs.unobserve(el)
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, revealed]
}

// ─── COUNT-UP HOOK ──────────────────────────────────────────────────────────────
function useCountUp(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(!startOnView)
  const ref = useRef(null)

  useEffect(() => {
    if (!startOnView) return
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          obs.unobserve(el)
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [startOnView])

  useEffect(() => {
    if (!started) return
    let startTime = null
    const raw = String(end).replace(/[^0-9.]/g, '')
    const target = parseFloat(raw)
    const suffix = String(end).replace(/[0-9.]+/g, '')
    const isInt = Number.isInteger(target)

    function tick(now) {
      if (!startTime) startTime = now
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased

      if (isInt) {
        setCount(Math.floor(current) + suffix)
      } else {
        setCount(current.toFixed(1) + suffix)
      }

      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [started, end, duration])

  return [ref, count]
}

// ─── DECORATIVE FLOATING SHAPES ─────────────────────────────────────────────────
function FloatingShapes({ variant = 'hero' }) {
  if (variant === 'hero') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[8%] w-24 h-24 rounded-full bg-white/5 animate-float" />
        <div className="absolute top-[20%] right-[12%] w-16 h-16 rounded-full bg-white/5 animate-floatSlow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[55%] left-[5%] w-32 h-32 rounded-full bg-white/[0.03] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[60%] right-[8%] w-20 h-20 rounded-full bg-white/5 animate-floatSlow" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-[30%] left-[40%] w-8 h-8 rotate-45 bg-white/[0.04] animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[70%] left-[30%] w-12 h-12 rotate-12 bg-white/[0.03] animate-floatSlow" style={{ animationDelay: '3s' }} />
      </div>
    )
  }

  if (variant === 'promise') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] right-[10%] w-20 h-20 rounded-full bg-white/[0.04] animate-float" />
        <div className="absolute bottom-[20%] left-[8%] w-14 h-14 rotate-45 bg-white/[0.03] animate-floatSlow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] w-10 h-10 rounded-full bg-white/[0.03] animate-pulseGlow" />
      </div>
    )
  }

  return null
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const stats = [
  { icon: <FiUsers className="text-2xl" />,   value: '10000+', label: 'Happy Customers', color: 'from-blue-500 to-blue-700'   },
  { icon: <FiPackage className="text-2xl" />, value: '500+',    label: 'Products',        color: 'from-orange-500 to-red-500'  },
  { icon: <FiAward className="text-2xl" />,   value: '8+',      label: 'Years of Trust',  color: 'from-green-500 to-emerald-600' },
  { icon: <FiTruck className="text-2xl" />,   value: '50+',     label: 'Cities Served',   color: 'from-purple-500 to-indigo-600' },
]

const values = [
  {
    icon:    <FiShield className="text-2xl" />,
    title:   'Quality Assured',
    desc:    'Every product is sourced from trusted manufacturers and tested for reliability before it reaches you.',
    iconBg:  'from-blue-500 to-blue-700',
  },
  {
    icon:    <FiHeart className="text-2xl" />,
    title:   'Customer First',
    desc:    "We treat every customer like family. Your satisfaction is not just our goal — it's our promise.",
    iconBg:  'from-red-500 to-rose-600',
  },
  {
    icon:    <FiZap className="text-2xl" />,
    title:   'Expert Knowledge',
    desc:    'Our team are electronics enthusiasts themselves — we give honest advice, not just sales pitches.',
    iconBg:  'from-orange-500 to-amber-600',
  },
  {
    icon:    <FiRotateCcw className="text-2xl" />,
    title:   'Hassle-Free Returns',
    desc:    "30-day no-questions-asked return policy. If something's wrong, we make it right — fast.",
    iconBg:  'from-green-500 to-emerald-600',
  },
]

const team = [
  {
    name:    'Amulya Patil',
    role:    'Founder & CEO',
    emoji:   '👨‍💼',
    bio:     'Electronics enthusiast with 15+ years in the industry. Started Amulya Electronics to make quality components accessible to every hobbyist and professional.',
    gradient: 'from-blue-100 to-blue-200',
  },
  {
    name:    'Priya Kulkarni',
    role:    'Head of Operations',
    emoji:   '👩‍💻',
    bio:     'Ensures every order is packed with care and delivered on time. Passionate about creating seamless customer experiences.',
    gradient: 'from-orange-100 to-amber-200',
  },
  {
    name:    'Ravi Desai',
    role:    'Technical Expert',
    emoji:   '🔧',
    bio:     'Our in-house electronics wizard. Ravi helps customers pick the right components and troubleshoot technical challenges.',
    gradient: 'from-green-100 to-emerald-200',
  },
]

const milestones = [
  { year: '2016', event: 'Amulya Electronics founded in Dharwad with a tiny shop and big dreams.' },
  { year: '2018', event: 'Expanded product range to 200+ electronic components and modules.' },
  { year: '2020', event: 'Launched online store, serving customers across Karnataka during lockdown.' },
  { year: '2022', event: 'Crossed 5,000 happy customers and expanded to Pan-India shipping.' },
  { year: '2024', event: 'Introduced 1-year warranty program and 30-day easy returns.' },
  { year: '2026', event: 'Now serving 10,000+ customers with 500+ curated products.' },
]

const whyUs = [
  'Original products from verified suppliers',
  'Same-day dispatch on orders before 2 PM',
  'Technical support via WhatsApp & call',
  'Competitive wholesale & bulk pricing',
  'Free delivery on orders above ₹999',
  'Secure payment via Razorpay & COD',
]

// ─── ABOUT US PAGE ────────────────────────────────────────────────────────────
export default function About() {
  const [activeTab, setActiveTab] = useState('story')
  const tabs = ['story', 'team', 'milestones']

  return (
    <div className="bg-[#f8fafc] min-h-screen font-body">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white pt-28 pb-24 px-4 overflow-hidden">
        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.12)_0%,_transparent_60%),_radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.1)_0%,_transparent_60%)]" />
        <FloatingShapes variant="hero" />

        {/* Accent glow */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-orange-500/10 blur-[120px]" />

        <div className="relative z-10 max-w-[1200px] mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-xs font-semibold text-orange-300 tracking-widest uppercase mb-6 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulseGlow" />
            Our Story
          </div>

          {/* Animated headline */}
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-5">
            {'About Amulya Electronics'.split(' ').map((word, i) => (
              <span
                key={i}
                className="hero-word inline-block mr-[0.25em]"
                style={{ animationDelay: `${0.3 + i * 0.12}s` }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Subtitle with gradient underline */}
          <p
            className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 opacity-0 animate-fadeIn"
            style={{ animationDelay: '1s', animationFillMode: 'forwards' }}
          >
            Dharwad's trusted electronics destination since 2016. We're on a mission to make
            quality electronic components accessible to every engineer, student, and hobbyist in India.
          </p>

          {/* CTAs */}
          <div
            className="flex items-center justify-center gap-4 flex-wrap opacity-0 animate-fadeIn"
            style={{ animationDelay: '1.3s', animationFillMode: 'forwards' }}
          >
            <Link
              to="/collection/Voltmeter"
              className="group relative inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-7 py-3.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-orange-500/25 hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <FiPackage /> Explore Products
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <a
              href="https://wa.me/918310787546"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white font-bold px-7 py-3.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <FaWhatsapp className="text-lg" /> Chat with Us
            </a>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f8fafc] to-transparent" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS STRIP
      ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {stats.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          VALUES
      ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 py-24">
        <SectionHeader
          label="What We Stand For"
          title="Our Core Values"
          subtitle="Four principles that guide everything we do — from sourcing to shipping."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((v, i) => (
            <ValueCard key={v.title} value={v} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STORY / TEAM / MILESTONES TABS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 pb-24">
        <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden border border-gray-100">

          {/* Tab Header */}
          <TabHeader tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="p-7 sm:p-10 md:p-12">
            {/* OUR STORY */}
            {activeTab === 'story' && <StoryTab />}

            {/* TEAM */}
            {activeTab === 'team' && <TeamTab />}

            {/* MILESTONES */}
            {activeTab === 'milestones' && <MilestonesTab />}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PROMISE STRIP
      ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 pb-24">
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 sm:p-12 md:p-16 text-white overflow-hidden">
          {/* Mesh gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(249,115,22,0.1)_0%,_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.08)_0%,_transparent_50%)]" />
          <div className="absolute top-[-30%] left-[-10%] w-[300px] h-[300px] rounded-full bg-orange-500/5 blur-[100px]" />
          <FloatingShapes variant="promise" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-xs font-semibold text-orange-300 tracking-widest uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              Our Promise
            </div>

            <h2 className="font-heading text-2xl md:text-4xl font-bold leading-tight mb-5">
              We're committed to being the most trusted electronics partner for every maker in India.
            </h2>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
              From the first resistor to the most complex IoT module — we'll be here, with genuine
              products, fair prices, and support that actually helps.
            </p>

            <div className="flex gap-3 flex-wrap">
              <Link
                to="/collection/Voltmeter"
                className="group relative inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-orange-500/25 hover:scale-105 active:scale-95 text-sm overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <FiPackage /> Shop Products
                </span>
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border-2 border-white/20 hover:border-white/40 text-white font-bold px-6 py-3.5 rounded-full transition-all duration-300 hover:bg-white/5 text-sm"
              >
                <FiPhone /> Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SOCIAL STRIP
      ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 pb-24">
        <div
          className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-gray-100 p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-heading font-bold text-gray-900 text-xl mb-1">
                Follow Our Journey
              </h3>
              <p className="text-gray-400 text-sm">
                Stay updated with new products, offers, and tips from our team.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { href: 'https://wa.me/918310787546', icon: <FaWhatsapp className="text-xl" />, label: 'WhatsApp', cls: 'hover:bg-green-500 border-green-200 text-green-600 hover:text-white' },
                { href: 'https://instagram.com',      icon: <FaInstagram className="text-xl" />, label: 'Instagram', cls: 'hover:bg-pink-500 border-pink-200 text-pink-600 hover:text-white' },
                { href: 'https://facebook.com',       icon: <FaFacebookF className="text-xl" />, label: 'Facebook',  cls: 'hover:bg-blue-600 border-blue-200 text-blue-600 hover:text-white' },
                { href: 'https://youtube.com',        icon: <FaYoutube className="text-xl" />,   label: 'YouTube',   cls: 'hover:bg-red-500 border-red-200 text-red-500 hover:text-white' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 border-2 ${s.cls} bg-white rounded-2xl px-5 py-2.5 transition-all duration-300 text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5`}
                >
                  {s.icon} {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────────

/* ── Stat Card (with count-up) ──────────────────────────────── */
function StatCard({ stat, index }) {
  const [ref, revealed] = useScrollReveal(0.2)
  const [countRef, count] = useCountUp(stat.value, 2000)

  return (
    <div
      ref={ref}
      className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-500 p-6 flex flex-col items-center text-center border border-gray-100 ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className={`bg-gradient-to-br ${stat.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-black/5`}>
        {stat.icon}
      </div>
      <p ref={countRef} className="text-3xl md:text-4xl font-heading font-bold text-gray-900 leading-none mb-1 tabular-nums">
        {count}
      </p>
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
    </div>
  )
}

/* ── Value Card ───────────────────────────────────────────────── */
function ValueCard({ value, index }) {
  const [ref, revealed] = useScrollReveal(0.15)

  return (
    <div
      ref={ref}
      className={`group relative bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 overflow-hidden ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

      {/* Icon */}
      <div className={`bg-gradient-to-br ${value.iconBg} text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
        {value.icon}
      </div>

      <h3 className="font-heading font-bold text-gray-900 text-base mb-2.5">{value.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{value.desc}</p>
    </div>
  )
}

/* ── Section Header ──────────────────────────────────────────── */
function SectionHeader({ label, title, subtitle }) {
  const [ref, revealed] = useScrollReveal(0.15)

  return (
    <div
      ref={ref}
      className={`text-center mb-12 transition-all duration-700 ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* Decorative accent */}
      <div className="inline-flex items-center gap-3 mb-4">
        <span className="w-8 h-0.5 bg-orange-400 rounded-full" />
        <span className="text-orange-500 font-heading font-bold text-xs tracking-[0.2em] uppercase">{label}</span>
        <span className="w-8 h-0.5 bg-orange-400 rounded-full" />
      </div>
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-3">{title}</h2>
      {subtitle && (
        <p className="text-gray-400 text-sm max-w-xl mx-auto">{subtitle}</p>
      )}
    </div>
  )
}

/* ── Tab Header ──────────────────────────────────────────────── */
function TabHeader({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex border-b border-gray-100 bg-gray-50/50">
      {tabs.map((tab) => {
        const icons = { story: '📖', team: '👥', milestones: '🏆' }
        const labels = { story: 'Our Story', team: 'The Team', milestones: 'Milestones' }
        const isActive = activeTab === tab
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`relative flex-1 py-4.5 text-sm font-heading font-bold capitalize transition-all duration-300 ${
              isActive
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="hidden sm:inline">{icons[tab]}</span>
              {labels[tab]}
            </span>
            {/* Active indicator */}
            <span
              className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-orange-500 rounded-full transition-all duration-300 ${
                isActive ? 'w-16' : 'w-0'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

/* ── Story Tab ───────────────────────────────────────────────── */
function StoryTab() {
  const [storyRef, storyRevealed] = useScrollReveal(0.1)

  return (
    <div
      ref={storyRef}
      className={`grid grid-cols-1 lg:grid-cols-5 gap-10 md:gap-14 items-start transition-all duration-700 ${
        storyRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* Left — Story Content (3/5) */}
      <div className="lg:col-span-3">
        <p className="text-orange-500 font-heading font-bold text-xs tracking-[0.2em] uppercase mb-3">
          Since 2016
        </p>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 mb-5 leading-tight">
          From a Small Shop to Karnataka's Favourite Electronics Store
        </h2>

        <div className="space-y-4 text-gray-500 text-sm leading-relaxed">
          <p>
            Amulya Electronics was born in 2016 in the heart of Dharwad, Karnataka — a small
            shop with a simple belief: <strong className="text-gray-800 font-bold">everyone deserves access to quality electronics</strong>.
            Whether you're a student building your first Arduino project, a hobbyist exploring
            IoT, or a professional sourcing components — we're here for you.
          </p>
          <p>
            What started as a neighbourhood store quickly grew into something much bigger.
            Word spread about our <strong className="text-gray-800 font-bold">genuine products, fair prices, and honest advice</strong>.
            We expanded our catalogue, improved our sourcing, and eventually launched online
            to serve customers across India.
          </p>
          <p>
            Today, we serve <strong className="text-gray-800 font-bold">over 10,000 happy customers</strong> with 500+ carefully
            curated products. We're not just a store — we're a community of electronics
            enthusiasts who believe in making, building, and learning.
          </p>
        </div>

        <div className="mt-8 flex gap-3 flex-wrap">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <FiMail size={14} /> Contact Us
          </Link>
          <Link
            to="/collection/Voltmeter"
            className="inline-flex items-center gap-2 border-2 border-gray-200 hover:border-gray-900 text-gray-700 hover:text-gray-900 font-bold px-5 py-2.5 rounded-full text-sm transition-all duration-300"
          >
            Browse Products <FiArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Right — Why Choose Us (2/5) */}
      <div className="lg:col-span-2">
        <div className="bg-gradient-to-br from-orange-50 via-orange-50/50 to-amber-50 rounded-3xl p-7 border border-orange-100 shadow-sm">
          <h3 className="font-heading font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
            <FiStar className="text-orange-500" /> Why Choose Us?
          </h3>
          <ul className="space-y-3.5">
            {whyUs.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                <FiCheckCircle className="text-orange-500 flex-shrink-0 mt-0.5 text-base" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Contact strip */}
          <div className="mt-8 pt-6 border-t border-orange-100 space-y-3">
            <a href="tel:8310787546" className="flex items-center gap-3 text-sm text-gray-500 hover:text-orange-600 transition-colors font-medium group">
              <span className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <FiPhone className="text-orange-600 text-sm" />
              </span>
              +91 83107 87546
            </a>
            <a href="mailto:amulyaelectronics1@gmail.com" className="flex items-center gap-3 text-sm text-gray-500 hover:text-orange-600 transition-colors font-medium group">
              <span className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <FiMail className="text-orange-600 text-sm" />
              </span>
              amulyaelectronics1@gmail.com
            </a>
            <div className="flex items-start gap-3 text-sm text-gray-500 font-medium">
              <span className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <FiMapPin className="text-orange-600 text-sm" />
              </span>
              <span>Ramanagar, Dharwad – 580001</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Team Tab ────────────────────────────────────────────────── */
function TeamTab() {
  const [teamRef, teamRevealed] = useScrollReveal(0.1)

  return (
    <div
      ref={teamRef}
      className={`transition-all duration-700 ${
        teamRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="text-center mb-10">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Meet the People Behind Amulya
        </h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          A small, passionate team that genuinely loves electronics and is dedicated to helping you find exactly what you need.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {team.map((member, i) => (
          <TeamCard key={member.name} member={member} index={i} />
        ))}
      </div>

      {/* Hiring callout */}
      <div className="mt-8 relative bg-gradient-to-br from-orange-50 via-orange-50/50 to-amber-50 rounded-2xl border border-orange-100 p-6 text-center overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <p className="font-heading font-bold text-gray-900 text-base mb-1">
            🙌 We're a Growing Team!
          </p>
          <p className="text-gray-500 text-sm">
            Passionate about electronics? We'd love to hear from you.{' '}
            <a href="mailto:amulyaelectronics1@gmail.com" className="text-orange-600 font-bold hover:text-orange-700 transition-colors underline underline-offset-2">
              Drop us an email.
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Team Card ───────────────────────────────────────────────── */
function TeamCard({ member, index }) {
  const [ref, revealed] = useScrollReveal(0.15)

  return (
    <div
      ref={ref}
      className={`group bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 0.12}s` }}
    >
      {/* Avatar */}
      <div className={`bg-gradient-to-br ${member.gradient} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-4xl shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
        {member.emoji}
      </div>

      {/* Role badge */}
      <span className="inline-block bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
        {member.role}
      </span>

      <h3 className="font-heading font-bold text-gray-900 text-base mb-2">{member.name}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{member.bio}</p>

      {/* Hover accent line */}
      <div className="mt-5 w-8 h-0.5 bg-orange-300 rounded-full mx-auto scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </div>
  )
}

/* ── Milestones Tab ──────────────────────────────────────────── */
function MilestonesTab() {
  const [milestoneRef, milestoneRevealed] = useScrollReveal(0.1)

  return (
    <div
      ref={milestoneRef}
      className={`transition-all duration-700 ${
        milestoneRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="text-center mb-10">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Our Journey So Far
        </h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Every milestone is a testament to the trust our customers have placed in us.
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Gradient vertical line */}
        <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-[3px] bg-gradient-to-b from-orange-400 via-orange-500 to-orange-200 md:-translate-x-px rounded-full" />

        <div className="space-y-8">
          {milestones.map((m, i) => (
            <div
              key={m.year}
              className={`relative flex items-start gap-5 md:gap-0 ${
                i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              {/* Content */}
              <div className={`flex-1 pl-14 md:pl-0 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 inline-block text-left max-w-sm ${
                  i % 2 === 0 ? '' : ''
                }`}>
                  <span className="inline-block bg-orange-50 text-orange-600 font-heading font-bold text-sm px-3 py-1 rounded-lg mb-2">
                    {m.year}
                  </span>
                  <p className="text-gray-500 text-sm leading-relaxed">{m.event}</p>
                </div>
              </div>

              {/* Animated dot */}
              <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-6 w-8 h-8 rounded-full bg-white border-[3px] border-orange-500 shadow-md flex items-center justify-center text-xs font-heading font-bold text-orange-600 z-10 flex-shrink-0">
                {i + 1}
              </div>

              {/* Spacer for alternating layout */}
              <div className="hidden md:block flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
