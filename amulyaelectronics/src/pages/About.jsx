import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiAward, FiUsers, FiPackage, FiTruck,
  FiShield, FiRotateCcw, FiHeart, FiZap,
  FiStar, FiMapPin, FiPhone, FiMail,
  FiCheckCircle, FiArrowRight,
} from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const stats = [
  { icon: <FiUsers className="text-2xl" />,   value: '10,000+', label: 'Happy Customers', color: 'bg-blue-600'   },
  { icon: <FiPackage className="text-2xl" />, value: '500+',    label: 'Products',        color: 'bg-orange-500' },
  { icon: <FiAward className="text-2xl" />,   value: '8+',      label: 'Years of Trust',  color: 'bg-green-600'  },
  { icon: <FiTruck className="text-2xl" />,   value: '50+',     label: 'Cities Served',   color: 'bg-purple-600' },
]

const values = [
  {
    icon:    <FiShield className="text-2xl" />,
    title:   'Quality Assured',
    desc:    'Every product is sourced from trusted manufacturers and tested for reliability before it reaches you.',
    color:   'bg-blue-50 border-blue-200',
    iconBg:  'bg-blue-600',
  },
  {
    icon:    <FiHeart className="text-2xl" />,
    title:   'Customer First',
    desc:    'We treat every customer like family. Your satisfaction is not just our goal — it\'s our promise.',
    color:   'bg-red-50 border-red-200',
    iconBg:  'bg-red-500',
  },
  {
    icon:    <FiZap className="text-2xl" />,
    title:   'Expert Knowledge',
    desc:    'Our team are electronics enthusiasts themselves — we give honest advice, not just sales pitches.',
    color:   'bg-orange-50 border-orange-200',
    iconBg:  'bg-orange-500',
  },
  {
    icon:    <FiRotateCcw className="text-2xl" />,
    title:   'Hassle-Free Returns',
    desc:    '30-day no-questions-asked return policy. If something\'s wrong, we make it right — fast.',
    color:   'bg-green-50 border-green-200',
    iconBg:  'bg-green-600',
  },
]

const team = [
  {
    name:    'Amulya Patil',
    role:    'Founder & CEO',
    emoji:   '👨‍💼',
    bio:     'Electronics enthusiast with 15+ years in the industry. Started Amulya Electronics to make quality components accessible to every hobbyist and professional.',
    color:   'bg-blue-100',
  },
  {
    name:    'Priya Kulkarni',
    role:    'Head of Operations',
    emoji:   '👩‍💻',
    bio:     'Ensures every order is packed with care and delivered on time. Passionate about creating seamless customer experiences.',
    color:   'bg-orange-100',
  },
  {
    name:    'Ravi Desai',
    role:    'Technical Expert',
    emoji:   '🔧',
    bio:     'Our in-house electronics wizard. Ravi helps customers pick the right components and troubleshoot technical challenges.',
    color:   'bg-green-100',
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
  'Free delivery on orders above ₹499',
  'Secure payment via Razorpay & COD',
]

// ─── ABOUT US PAGE ────────────────────────────────────────────────────────────
export default function About() {
  const [activeTab, setActiveTab] = useState('story')
  const tabs = ['story', 'team', 'milestones']

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[160px] flex items-center justify-center font-black text-white">
          ⚡
        </div>
        <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">
          Our Story
        </p>
        <h1 className="text-4xl md:text-6xl font-black mb-3">About Amulya Electronics</h1>
        <p className="text-blue-100 text-base md:text-lg max-w-2xl mx-auto">
          Dharwad's trusted electronics destination since 2016. We're on a mission to make
          quality electronic components accessible to every engineer, student, and hobbyist in India.
        </p>
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          <Link
            to="/collection/Voltmeter"
            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-black px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <FiPackage /> Shop Now
          </Link>
          <a
            href="https://wa.me/918310787546"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <FaWhatsapp className="text-xl" /> Chat with Us
          </a>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 mb-12">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col items-center text-center border-2 border-gray-100"
            >
              <div className={`${s.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md`}>
                {s.icon}
              </div>
              <p className="text-3xl font-black text-gray-900 leading-none mb-1">{s.value}</p>
              <p className="text-gray-500 text-sm font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── VALUES / WHO WE ARE ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-16">
        <div className="text-center mb-10">
          <p className="text-blue-600 font-black text-sm tracking-widest uppercase mb-2">What We Stand For</p>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900">Our Core Values</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map((v) => (
            <div
              key={v.title}
              className={`flex flex-col items-center text-center border-2 ${v.color} bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`${v.iconBg} text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md`}>
                {v.icon}
              </div>
              <h3 className="font-black text-gray-800 text-base mb-2">{v.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── STORY / TEAM / MILESTONES TABS ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-16">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

          {/* Tab Header */}
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-black capitalize transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {tab === 'story' ? '📖 Our Story' : tab === 'team' ? '👥 The Team' : '🏆 Milestones'}
              </button>
            ))}
          </div>

          <div className="p-7 sm:p-10">

            {/* OUR STORY */}
            {activeTab === 'story' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">
                    From a Small Shop to Karnataka's Favourite Electronics Store
                  </h2>
                  <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                    <p>
                      Amulya Electronics was born in 2016 in the heart of Dharwad, Karnataka — a small
                      shop with a simple belief: <strong className="text-gray-800">everyone deserves access to quality electronics</strong>.
                      Whether you're a student building your first Arduino project, a hobbyist exploring
                      IoT, or a professional sourcing components — we're here for you.
                    </p>
                    <p>
                      What started as a neighbourhood store quickly grew into something much bigger.
                      Word spread about our <strong className="text-gray-800">genuine products, fair prices, and honest advice</strong>.
                      We expanded our catalogue, improved our sourcing, and eventually launched online
                      to serve customers across India.
                    </p>
                    <p>
                      Today, we serve <strong className="text-gray-800">over 10,000 happy customers</strong> with 500+ carefully
                      curated products. We're not just a store — we're a community of electronics
                      enthusiasts who believe in making, building, and learning.
                    </p>
                  </div>
                  <div className="mt-6 flex gap-3 flex-wrap">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors"
                    >
                      <FiMail size={14} /> Contact Us
                    </Link>
                    <Link
                      to="/collection/Voltmeter"
                      className="inline-flex items-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all"
                    >
                      Browse Products <FiArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Why Choose Us */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-3xl p-7 border-2 border-blue-200">
                  <h3 className="font-black text-gray-900 text-lg mb-5 flex items-center gap-2">
                    <FiStar className="text-orange-500" /> Why Choose Amulya Electronics?
                  </h3>
                  <ul className="space-y-3">
                    {whyUs.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                        <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5 text-base" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Mini contact strip */}
                  <div className="mt-6 pt-5 border-t border-blue-200 space-y-2">
                    <a href="tel:8310787546" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
                      <FiPhone className="text-blue-600" /> +91 83107 87546
                    </a>
                    <a href="mailto:amulyaelectronics1@gmail.com" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
                      <FiMail className="text-blue-600" /> amulyaelectronics1@gmail.com
                    </a>
                    <div className="flex items-start gap-2 text-sm text-gray-600 font-medium">
                      <FiMapPin className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Ramanagar, Dharwad – 580001</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TEAM */}
            {activeTab === 'team' && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Meet the People Behind Amulya</h2>
                  <p className="text-gray-500 text-sm max-w-xl mx-auto">
                    A small, passionate team that genuinely loves electronics and is dedicated to helping you find exactly what you need.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {team.map((member) => (
                    <div
                      key={member.name}
                      className="bg-gray-50 border-2 border-gray-100 rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className={`${member.color} w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-md`}>
                        {member.emoji}
                      </div>
                      <h3 className="font-black text-gray-900 text-base mb-0.5">{member.name}</h3>
                      <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">{member.role}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{member.bio}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 bg-orange-50 border-2 border-orange-200 rounded-3xl p-6 text-center">
                  <p className="text-orange-800 font-black text-base mb-1">🙌 We're a Growing Team!</p>
                  <p className="text-orange-700 text-sm">
                    Passionate about electronics? We'd love to hear from you.{' '}
                    <a href="mailto:amulyaelectronics1@gmail.com" className="underline font-bold hover:text-orange-900 transition-colors">
                      Drop us an email.
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* MILESTONES */}
            {activeTab === 'milestones' && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Our Journey So Far</h2>
                  <p className="text-gray-500 text-sm max-w-xl mx-auto">
                    Every milestone is a testament to the trust our customers have placed in us.
                  </p>
                </div>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[28px] sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 to-blue-200 -translate-x-px" />

                  <div className="space-y-6">
                    {milestones.map((m, i) => (
                      <div
                        key={m.year}
                        className={`relative flex items-start gap-5 sm:gap-0 ${
                          i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                        }`}
                      >
                        {/* Content */}
                        <div className={`flex-1 pl-14 sm:pl-0 ${i % 2 === 0 ? 'sm:pr-10 sm:text-right' : 'sm:pl-10 sm:text-left'}`}>
                          <div className={`bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all inline-block text-left`}>
                            <p className="text-blue-600 font-black text-sm mb-1">{m.year}</p>
                            <p className="text-gray-700 text-sm leading-relaxed">{m.event}</p>
                          </div>
                        </div>

                        {/* Dot */}
                        <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 top-4 w-8 h-8 rounded-full bg-blue-600 border-4 border-white shadow-md flex items-center justify-center text-white text-xs font-black z-10 flex-shrink-0">
                          {i + 1}
                        </div>

                        {/* Spacer for alternating layout */}
                        <div className="hidden sm:block flex-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PROMISE STRIP ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-16">
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[120px] flex items-center justify-end pr-8 font-black">
            🤝
          </div>
          <div className="relative z-10 max-w-2xl">
            <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">Our Promise</p>
            <h2 className="text-2xl md:text-3xl font-black mb-4">
              We're committed to being the most trusted electronics partner for every maker in India.
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              From the first resistor to the most complex IoT module — we'll be here, with genuine
              products, fair prices, and support that actually helps.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                to="/collection/Voltmeter"
                className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-black px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 text-sm"
              >
                <FiPackage /> Shop Products
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border-2 border-white/40 hover:border-white text-white font-bold px-6 py-3 rounded-full transition-all text-sm"
              >
                <FiPhone /> Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── SOCIAL STRIP ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-16">
        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-black text-gray-900 text-xl mb-1">Follow Our Journey</h3>
              <p className="text-gray-400 text-sm">Stay updated with new products, offers, and tips from our team.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { href: 'https://wa.me/918310787546', icon: <FaWhatsapp className="text-xl" />, label: 'WhatsApp', cls: 'bg-green-50 hover:bg-green-500 border-green-200 text-green-600 hover:text-white hover:border-green-500' },
                { href: 'https://instagram.com',      icon: <FaInstagram className="text-xl" />, label: 'Instagram', cls: 'bg-pink-50 hover:bg-pink-500 border-pink-200 text-pink-600 hover:text-white hover:border-pink-500' },
                { href: 'https://facebook.com',       icon: <FaFacebookF className="text-xl" />, label: 'Facebook',  cls: 'bg-blue-50 hover:bg-blue-600 border-blue-200 text-blue-600 hover:text-white hover:border-blue-600' },
                { href: 'https://youtube.com',        icon: <FaYoutube className="text-xl" />,   label: 'YouTube',   cls: 'bg-red-50 hover:bg-red-500 border-red-200 text-red-500 hover:text-white hover:border-red-500' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 border-2 ${s.cls} rounded-2xl px-4 py-2.5 transition-all text-sm font-bold`}
                >
                  {s.icon} {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── NEWSLETTER STRIP ── (matches Contact page) */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-white font-black text-2xl mb-1">Subscribe for Deals & Updates</h3>
          <p className="text-orange-100 text-sm mb-5">
            Get 15% off your first order + exclusive offers straight to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email..."
              className="flex-1 rounded-full px-5 py-3 text-sm outline-none border-2 border-transparent focus:border-white bg-white/90"
            />
            <button className="bg-white text-orange-500 font-black px-6 py-3 rounded-full hover:bg-orange-50 transition-all shadow-lg hover:scale-105 active:scale-95 whitespace-nowrap">
              Subscribe →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
