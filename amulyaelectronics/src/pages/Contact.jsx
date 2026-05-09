import { useState } from 'react'
import axios from 'axios'
import {
  FiPhone, FiMail, FiMapPin, FiClock,
  FiSend, FiUser, FiMessageSquare, FiCheckCircle, FiAlertCircle,
} from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

const infoCards = [
  {
    icon:    <FiPhone className="text-2xl" />,
    title:   'Call Us',
    lines:   ['+91 83107 87546', '+91 82173 17884'],
    color:   'bg-blue-50 border-blue-200',
    iconBg:  'bg-blue-600',
    link:    'tel:8310787546',
  },
  {
    icon:    <FiMail className="text-2xl" />,
    title:   'Email Us',
    lines:   ['amulyaelectronics1@gmail.com'],
    color:   'bg-orange-50 border-orange-200',
    iconBg:  'bg-orange-500',
    link:    'mailto:amulyaelectronics1@gmail.com',
  },
  {
    icon:    <FiMapPin className="text-2xl" />,
    title:   'Visit Us',
    lines:   [
      'Shree Banashankari Avenue,',
      'Opp. NTTF College, beside Samsung Showroom,',
      'Ramanagar, Dharwad – 580001',
    ],
    color:   'bg-green-50 border-green-200',
    iconBg:  'bg-green-600',
    link:    'https://maps.google.com',
  },
  {
    icon:    <FiClock className="text-2xl" />,
    title:   'Working Hours',
    lines:   ['Mon – Sun', '9:00 AM – 8:00 PM'],
    color:   'bg-purple-50 border-purple-200',
    iconBg:  'bg-purple-600',
    link:    null,
  },
]

const subjects = [
  'Product Inquiry',
  'Order Support',
  'Bulk / Wholesale',
  'Technical Help',
  'Other',
]

const EMPTY_FORM = { name: '', email: '', phone: '', subject: '', message: '' }

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
export default function Contact() {
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    if (error) setError('')   // clear error as user types
  }

  // ── Submit to real API ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic client-side guard
    if (!form.name.trim() || !form.email.trim() || !form.subject || !form.message.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/contact/submit`, {
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim(),
        subject: form.subject,
        message: form.message.trim(),
      })

      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.message || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to send message. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSubmitted(false)
    setError('')
    setForm(EMPTY_FORM)
  }

  const inputCls = 'w-full border-2 border-gray-100 focus:border-blue-400 bg-gray-50 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-colors'

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[160px] flex items-center justify-center font-black text-white">
          📡
        </div>
        <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">
          We're here for you
        </p>
        <h1 className="text-4xl md:text-6xl font-black mb-3">Get in Touch</h1>
        <p className="text-blue-100 text-base md:text-lg max-w-xl mx-auto">
          Have a question about our electronics products? Our team is ready to
          help Mon–Sun, 9 AM – 8 PM.
        </p>
        <a
          href="https://wa.me/918310787546"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-6 bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          <FaWhatsapp className="text-xl" /> Chat on WhatsApp
        </a>
      </div>

      {/* ── INFO CARDS ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {infoCards.map((card) => (
            <a
              key={card.title}
              href={card.link || undefined}
              target={card.link?.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={`flex flex-col items-center text-center border-2 ${card.color} bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${card.link ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`${card.iconBg} text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md`}>
                {card.icon}
              </div>
              <h3 className="font-black text-gray-800 text-base mb-2">{card.title}</h3>
              {card.lines.map((l, i) => (
                <p key={i} className="text-gray-500 text-sm leading-relaxed">{l}</p>
              ))}
            </a>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT: Form + Map ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Contact Form ── */}
        <div className="bg-white rounded-3xl shadow-lg p-7 sm:p-10">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">
            Send Us a Message
          </h2>
          <p className="text-gray-400 text-sm mb-7">
            Fill out the form and we'll get back to you within 24 hours.
          </p>

          {/* ── Success state ── */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FiCheckCircle className="text-green-500 text-6xl mb-4" />
              <h3 className="text-2xl font-black text-gray-800 mb-2">Message Sent!</h3>
              <p className="text-gray-500 mb-2">
                Thanks for reaching out, <span className="font-semibold text-gray-700">{form.name}</span>!
              </p>
              <p className="text-gray-400 text-sm mb-6">
                We've also sent a confirmation to <span className="font-semibold">{form.email}</span>.
                Our team will reply within 24 hours.
              </p>
              <button
                onClick={handleReset}
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors"
              >
                Send Another Message
              </button>
            </div>

          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                  <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={15} />
                  <p className="text-xs text-red-700 font-medium leading-relaxed">{error}</p>
                </div>
              )}

              {/* Name */}
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your Full Name *"
                  className={inputCls}
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="Email Address *"
                    className={inputCls}
                  />
                </div>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="relative">
                <FiMessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className={`${inputCls} appearance-none text-gray-600`}
                >
                  <option value="">Select Subject *</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Write your message here... *"
                className="w-full border-2 border-gray-100 focus:border-blue-400 bg-gray-50 rounded-2xl px-4 py-3.5 text-sm outline-none transition-colors resize-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:scale-[1.01] active:scale-95"
              >
                {loading ? (
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5" />
                ) : (
                  <><FiSend /> Send Message</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* ── Map + Social ── */}
        <div className="flex flex-col gap-6">

          {/* Map Embed */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden flex-1">
            <div className="bg-blue-600 px-6 py-4">
              <h3 className="text-white font-black text-lg">Find Our Store</h3>
              <p className="text-blue-200 text-xs mt-0.5">Dharwad, Karnataka – 580001</p>
            </div>
            <iframe
              title="Amulya Electronics Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3847.123!2d75.0077!3d15.4589!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDI3JzMyLjAiTiA3NcKwMDAnMjcuNyJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
              width="100%"
              height="260"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-5">
              <a
                href="https://maps.google.com/?q=Dharwad+Karnataka"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold py-2.5 rounded-full transition-all text-sm"
              >
                <FiMapPin /> Get Directions
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="font-black text-gray-900 text-lg mb-4">Follow & Connect</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="https://wa.me/918310787546" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl px-4 py-3 transition-all group">
                <FaWhatsapp className="text-green-500 text-2xl group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-bold text-gray-800 text-sm">WhatsApp</p>
                  <p className="text-gray-400 text-xs">Chat Now</p>
                </div>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-2xl px-4 py-3 transition-all group">
                <FaInstagram className="text-pink-500 text-2xl group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-bold text-gray-800 text-sm">Instagram</p>
                  <p className="text-gray-400 text-xs">Follow Us</p>
                </div>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl px-4 py-3 transition-all group">
                <FaFacebookF className="text-blue-600 text-2xl group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-bold text-gray-800 text-sm">Facebook</p>
                  <p className="text-gray-400 text-xs">Like Page</p>
                </div>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl px-4 py-3 transition-all group">
                <FaYoutube className="text-red-500 text-2xl group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-bold text-gray-800 text-sm">YouTube</p>
                  <p className="text-gray-400 text-xs">Subscribe</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── NEWSLETTER STRIP ── */}
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
