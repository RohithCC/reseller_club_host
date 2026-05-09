import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiShield, FiLock, FiEye, FiDatabase, FiMail,
  FiPhone, FiShare2, FiTrash2, FiRefreshCw,
  FiAlertCircle, FiCheckCircle, FiChevronDown, FiChevronUp,
  FiUser, FiGlobe, FiMapPin,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const highlights = [
  {
    icon:    <FiLock className="text-2xl" />,
    title:   'Secure Payments',
    desc:    'All transactions are encrypted and processed securely via Razorpay. We never store your card details.',
    color:   'bg-blue-50 border-blue-200',
    iconBg:  'bg-blue-600',
  },
  {
    icon:    <FiEye className="text-2xl" />,
    title:   'No Selling of Data',
    desc:    'We do not sell, rent, or trade your personal information to third parties — ever.',
    color:   'bg-green-50 border-green-200',
    iconBg:  'bg-green-600',
  },
  {
    icon:    <FiDatabase className="text-2xl" />,
    title:   'Minimal Data Collection',
    desc:    'We collect only what\'s necessary to process your orders and improve your experience.',
    color:   'bg-orange-50 border-orange-200',
    iconBg:  'bg-orange-500',
  },
  {
    icon:    <FiShield className="text-2xl" />,
    title:   'Your Rights Matter',
    desc:    'You can request access, correction, or deletion of your data at any time by contacting us.',
    color:   'bg-purple-50 border-purple-200',
    iconBg:  'bg-purple-600',
  },
]

const sections = [
  {
    id:    'information',
    icon:  <FiUser />,
    title: 'Information We Collect',
    content: [
      {
        subtitle: 'Information You Provide',
        text: 'When you create an account, place an order, or contact us, we collect:',
        bullets: [
          'Full name and contact details (email address, phone number)',
          'Delivery address and billing information',
          'Payment information (processed securely via Razorpay — we do not store card numbers)',
          'Messages or enquiries you send to us via our contact form or WhatsApp',
          'Product reviews and ratings you submit',
        ],
      },
      {
        subtitle: 'Information Collected Automatically',
        text: 'When you browse our website, we may automatically collect:',
        bullets: [
          'IP address and browser type',
          'Pages visited and time spent on each page',
          'Device information (mobile, desktop, OS)',
          'Referring URLs (which site brought you here)',
          'Cookies and similar tracking technologies',
        ],
      },
    ],
  },
  {
    id:    'usage',
    icon:  <FiRefreshCw />,
    title: 'How We Use Your Information',
    content: [
      {
        subtitle: 'To Process & Fulfil Orders',
        text: 'Your personal information is primarily used to:',
        bullets: [
          'Process and confirm your orders',
          'Arrange delivery to your address',
          'Send order confirmation and shipping updates via email/SMS',
          'Handle returns, refunds, and warranty claims',
          'Respond to your queries and support requests',
        ],
      },
      {
        subtitle: 'To Improve Our Services',
        text: 'We also use your data to:',
        bullets: [
          'Personalise your shopping experience and product recommendations',
          'Analyse website usage and improve our platform',
          'Send promotional emails and offers (only with your consent)',
          'Prevent fraud and ensure the security of our platform',
          'Comply with legal and regulatory obligations',
        ],
      },
    ],
  },
  {
    id:    'sharing',
    icon:  <FiShare2 />,
    title: 'Sharing of Your Information',
    content: [
      {
        subtitle: 'We Do Not Sell Your Data',
        text: 'Amulya Electronics does not sell, rent, or trade your personal data to any third parties for their marketing purposes.',
        bullets: [],
      },
      {
        subtitle: 'Trusted Service Partners',
        text: 'We share your information only with trusted partners who help us run our business:',
        bullets: [
          'Razorpay — payment processing (PCI-DSS compliant)',
          'Courier partners (Delhivery, DTDC, India Post) — for order delivery',
          'Cloudinary — secure image storage',
          'Email/SMS service providers — for order notifications',
          'Google Analytics — anonymous website usage analytics',
        ],
      },
      {
        subtitle: 'Legal Disclosures',
        text: 'We may disclose your information if required by law, court order, or to protect the rights, property, or safety of Amulya Electronics or our customers.',
        bullets: [],
      },
    ],
  },
  {
    id:    'cookies',
    icon:  <FiGlobe />,
    title: 'Cookies & Tracking',
    content: [
      {
        subtitle: 'What Are Cookies?',
        text: 'Cookies are small text files stored on your device that help us remember your preferences and improve your experience on our site.',
        bullets: [],
      },
      {
        subtitle: 'How We Use Cookies',
        text: 'We use cookies for:',
        bullets: [
          'Keeping you logged into your account',
          'Remembering your cart items across sessions',
          'Understanding how you use our website (analytics)',
          'Personalising content and product recommendations',
          'Preventing fraudulent activity',
        ],
      },
      {
        subtitle: 'Managing Cookies',
        text: 'You can control and delete cookies through your browser settings. Note that disabling cookies may affect the functionality of our website, including the shopping cart and account features.',
        bullets: [],
      },
    ],
  },
  {
    id:    'security',
    icon:  <FiLock />,
    title: 'Data Security',
    content: [
      {
        subtitle: 'How We Protect Your Data',
        text: 'We take data security seriously and implement the following measures:',
        bullets: [
          'SSL/TLS encryption for all data transmitted between your browser and our servers',
          'Secure password hashing — we never store plain-text passwords',
          'Payment data processed via Razorpay\'s PCI-DSS Level 1 certified infrastructure',
          'Regular security audits and vulnerability assessments',
          'Restricted access to personal data — only authorised staff can access it',
          'Automatic session expiry to protect your account when idle',
        ],
      },
      {
        subtitle: 'Data Breach Notification',
        text: 'In the unlikely event of a data breach that affects your personal information, we will notify you and the relevant authorities as required by applicable law within 72 hours of becoming aware of the breach.',
        bullets: [],
      },
    ],
  },
  {
    id:    'rights',
    icon:  <FiCheckCircle />,
    title: 'Your Rights',
    content: [
      {
        subtitle: 'You Have the Right To:',
        text: 'Under applicable Indian data protection laws, you have the following rights regarding your personal data:',
        bullets: [
          'Access — request a copy of the personal data we hold about you',
          'Correction — ask us to correct inaccurate or incomplete information',
          'Deletion — request that we delete your personal data (subject to legal obligations)',
          'Opt-out — unsubscribe from marketing emails at any time via the unsubscribe link',
          'Portability — request your data in a structured, machine-readable format',
          'Objection — object to processing of your data for certain purposes',
        ],
      },
      {
        subtitle: 'How to Exercise Your Rights',
        text: 'To exercise any of these rights, contact us at amulyaelectronics1@gmail.com or via WhatsApp at +91 83107 87546. We will respond within 30 days.',
        bullets: [],
      },
    ],
  },
  {
    id:    'retention',
    icon:  <FiDatabase />,
    title: 'Data Retention',
    content: [
      {
        subtitle: 'How Long We Keep Your Data',
        text: 'We retain your personal data only for as long as necessary:',
        bullets: [
          'Account data — retained while your account is active and for 2 years after deletion',
          'Order data — retained for 7 years for tax and legal compliance',
          'Payment records — retained as required by Razorpay and financial regulations',
          'Support communications — retained for 2 years',
          'Analytics data — retained in anonymised form indefinitely',
        ],
      },
    ],
  },
  {
    id:    'children',
    icon:  <FiAlertCircle />,
    title: "Children's Privacy",
    content: [
      {
        subtitle: 'Age Restriction',
        text: 'Our services are not directed at children under the age of 18. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal data, please contact us immediately and we will delete the information.',
        bullets: [],
      },
    ],
  },
  {
    id:    'changes',
    icon:  <FiRefreshCw />,
    title: 'Changes to This Policy',
    content: [
      {
        subtitle: 'Policy Updates',
        text: 'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make significant changes, we will:',
        bullets: [
          'Update the "Last Updated" date at the top of this page',
          'Send an email notification to registered customers',
          'Display a prominent notice on our website',
        ],
      },
      {
        subtitle: 'Continued Use',
        text: 'Your continued use of our website and services after any changes to this policy constitutes your acceptance of the updated terms.',
        bullets: [],
      },
    ],
  },
]

// ─── ACCORDION SECTION ────────────────────────────────────────────────────────
function PolicySection({ section, isOpen, onToggle }) {
  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? 'border-blue-200 shadow-md' : 'border-gray-100'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${isOpen ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${isOpen ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {section.icon}
          </div>
          <span className={`font-black text-sm sm:text-base ${isOpen ? 'text-blue-700' : 'text-gray-800'}`}>
            {section.title}
          </span>
        </div>
        <div className={`flex-shrink-0 transition-colors ${isOpen ? 'text-blue-600' : 'text-gray-400'}`}>
          {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 bg-white space-y-5">
          {section.content.map((block, i) => (
            <div key={i}>
              {block.subtitle && (
                <h4 className="font-black text-gray-800 text-sm mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
                  {block.subtitle}
                </h4>
              )}
              {block.text && (
                <p className="text-gray-600 text-sm leading-relaxed mb-2">{block.text}</p>
              )}
              {block.bullets && block.bullets.length > 0 && (
                <ul className="space-y-2 mt-2">
                  {block.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5 text-base" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PRIVACY POLICY PAGE ──────────────────────────────────────────────────────
export default function PrivacyPolicy() {
  const [openSection, setOpenSection] = useState('information')

  const toggle = (id) => setOpenSection((prev) => (prev === id ? null : id))

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[160px] flex items-center justify-center font-black text-white">
          🔒
        </div>
        <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">
          Your Privacy Matters
        </p>
        <h1 className="text-4xl md:text-6xl font-black mb-3">Privacy Policy</h1>
        <p className="text-blue-100 text-base md:text-lg max-w-xl mx-auto">
          We believe in transparency. Here's exactly how we collect, use, and protect
          your personal information at Amulya Electronics.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 text-sm text-blue-100 font-semibold">
          <FiRefreshCw size={13} /> Last Updated: April 2026
        </div>
      </div>

      {/* ── HIGHLIGHT CARDS ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {highlights.map((card) => (
            <div
              key={card.title}
              className={`flex flex-col items-center text-center border-2 ${card.color} bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`${card.iconBg} text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md`}>
                {card.icon}
              </div>
              <h3 className="font-black text-gray-800 text-base mb-2">{card.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

        {/* ── Policy Accordion ── */}
        <div className="space-y-3">
          <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 mb-4">
            <h2 className="text-xl font-black text-gray-900 mb-2">Introduction</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Amulya Electronics ("we", "us", "our") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you visit
              our website or make a purchase from us.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              By using our website, you agree to the collection and use of information in accordance with
              this policy. If you have any questions, please{' '}
              <Link to="/contact" className="text-blue-600 font-bold hover:underline">contact us</Link>.
            </p>
          </div>

          {sections.map((section) => (
            <PolicySection
              key={section.id}
              section={section}
              isOpen={openSection === section.id}
              onToggle={() => toggle(section.id)}
            />
          ))}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">

          {/* Quick Nav */}
          <div className="bg-white rounded-3xl shadow-lg p-6 sticky top-6">
            <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
              <FiShield className="text-blue-600" /> Quick Navigation
            </h3>
            <nav className="space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setOpenSection(s.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    openSection === s.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <span className="text-base">{s.icon}</span>
                  {s.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Contact for Privacy */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-3xl p-6">
            <h3 className="font-black text-gray-900 text-base mb-1 flex items-center gap-2">
              <FiMail className="text-blue-600" /> Privacy Questions?
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              Have a question about your data or want to exercise your rights?
              Reach out — we'll respond within 30 days.
            </p>
            <div className="space-y-2">
              <a href="mailto:amulyaelectronics1@gmail.com"
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors font-semibold">
                <FiMail className="text-blue-600 flex-shrink-0" />
                amulyaelectronics1@gmail.com
              </a>
              <a href="tel:8310787546"
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors font-semibold">
                <FiPhone className="text-blue-600 flex-shrink-0" />
                +91 83107 87546
              </a>
              <a href="https://wa.me/918310787546" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-green-600 transition-colors font-semibold">
                <FaWhatsapp className="text-green-500 flex-shrink-0" />
                WhatsApp Us
              </a>
              <div className="flex items-start gap-2 text-xs text-gray-600 font-semibold">
                <FiMapPin className="text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Ramanagar, Dharwad – 580001</span>
              </div>
            </div>
            <Link
              to="/contact"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl text-xs transition-colors"
            >
              <FiMail size={12} /> Send Us a Message
            </Link>
          </div>

          {/* Related Links */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-md">
            <h3 className="font-black text-gray-800 text-sm mb-3">Related Policies</h3>
            <div className="space-y-2">
              {[
                { to: '/terms-conditions',           label: '📋 Terms & Conditions'         },
                { to: '/refund-cancellation-policy', label: '↩️ Refund & Cancellation Policy' },
                { to: '/contact',                    label: '📞 Contact Us'                  },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center justify-between text-xs font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all"
                >
                  {l.label}
                  <span className="text-gray-300">›</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Effective date badge */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 text-center">
            <FiAlertCircle className="text-amber-500 text-2xl mx-auto mb-2" />
            <p className="text-amber-800 font-black text-sm mb-1">Effective Date</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              This policy is effective as of <strong>1st April 2026</strong> and applies to all
              users of the Amulya Electronics website.
            </p>
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
