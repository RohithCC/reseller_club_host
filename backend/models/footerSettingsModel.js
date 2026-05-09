import mongoose from 'mongoose'

const footerSchema = new mongoose.Schema(
  {
    // ── Contact Info ───────────────────────────────────────────────────────
    phones:   { type: [String], default: ['+91 83107 87546', '+91 82173 17884'] },
    email:    { type: String,   default: 'amulyaelectronics1@gmail.com' },
    address:  { type: String,   default: 'Shree Banashankari Avenue, Opp. NTTF College, Ramanagar, Dharwad – 580001' },
    hours:    { type: String,   default: 'Mon – Sun | 9:00 AM – 8:00 PM' },

    // ── Social Links ───────────────────────────────────────────────────────
    whatsapp:  { type: String, default: 'https://wa.me/918310787546' },
    instagram: { type: String, default: 'https://instagram.com' },
    facebook:  { type: String, default: 'https://facebook.com' },
    youtube:   { type: String, default: 'https://youtube.com' },
    twitter:   { type: String, default: 'https://twitter.com' },

    // ── Newsletter strip ───────────────────────────────────────────────────
    newsletterTitle:    { type: String, default: '📬 Subscribe & Get 15% Off Your First Order!' },
    newsletterSubtitle: { type: String, default: 'Deals, new arrivals, and electronics tips — delivered to your inbox.' },

    // ── App download links ─────────────────────────────────────────────────
    playStoreLink: { type: String, default: '#' },
    appStoreLink:  { type: String, default: '#' },

    // ── Trust badges ───────────────────────────────────────────────────────
    trustBadges: {
      type: [{ emoji: String, text: String }],
      default: [
        { emoji: '🚚', text: 'Free Shipping above ₹999' },
        { emoji: '🔒', text: 'Secure Payments' },
        { emoji: '↩️', text: 'Easy Returns' },
        { emoji: '🎧', text: 'Mon–Sun Support' },
        { emoji: '⚡', text: 'Fast Dispatch' },
      ],
    },

    // ── Copyright ──────────────────────────────────────────────────────────
    copyrightText: { type: String, default: 'Designed by Team Up Box © 2026 Amulya Electronics. All rights reserved.' },
  },
  { timestamps: true }
)

// Only ever one footer settings document — use singleton pattern
const footerSettingsModel =
  mongoose.models.FooterSettings ||
  mongoose.model('FooterSettings', footerSchema)

export default footerSettingsModel
