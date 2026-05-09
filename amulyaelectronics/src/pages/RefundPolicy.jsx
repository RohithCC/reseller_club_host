import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiRotateCcw, FiPackage, FiTruck, FiAlertCircle,
  FiCheckCircle, FiXCircle, FiClock, FiMail,
  FiPhone, FiMapPin, FiChevronDown, FiChevronUp,
  FiDollarSign, FiShield, FiRefreshCw, FiHelpCircle,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { Link as RouterLink } from 'react-router-dom'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const highlights = [
  {
    icon:    <FiRotateCcw className="text-2xl" />,
    title:   '30-Day Returns',
    desc:    'Return most items within 30 days of delivery for a full refund — no questions asked.',
    color:   'bg-blue-50 border-blue-200',
    iconBg:  'bg-blue-600',
  },
  {
    icon:    <FiDollarSign className="text-2xl" />,
    title:   'Easy Refunds',
    desc:    'Refunds are processed to your original payment method or wallet within 5–7 business days.',
    color:   'bg-green-50 border-green-200',
    iconBg:  'bg-green-600',
  },
  {
    icon:    <FiClock className="text-2xl" />,
    title:   'Quick Cancellations',
    desc:    'Cancel your order any time before it is dispatched for an instant, full refund.',
    color:   'bg-orange-50 border-orange-200',
    iconBg:  'bg-orange-500',
  },
  {
    icon:    <FiShield className="text-2xl" />,
    title:   '1-Year Warranty',
    desc:    'All products come with a minimum 1-year manufacturer warranty against defects.',
    color:   'bg-purple-50 border-purple-200',
    iconBg:  'bg-purple-600',
  },
]

const returnEligible = [
  'Item received is damaged or broken',
  'Wrong product delivered (different from what was ordered)',
  'Item is defective or not functioning as described',
  'Product is missing parts or accessories listed in the description',
  'Item significantly differs from the product listing',
  'Sealed/unused product returned within 30 days of delivery',
]

const returnNotEligible = [
  'Items damaged due to misuse, mishandling, or physical damage by the customer',
  'Products with tampered or missing serial numbers / warranty stickers',
  'Consumable items (batteries, solder wire, etc.) once opened',
  'Custom or bulk orders placed under special pricing',
  'Items returned after 30 days of delivery without prior approval',
  'Software, digital products, or downloadable items',
  'Items showing signs of wear, burns, or modification attempts',
]

const sections = [
  {
    id:    'cancellation',
    icon:  <FiXCircle />,
    title: 'Order Cancellation Policy',
    content: [
      {
        subtitle: 'Before Dispatch',
        text: 'You may cancel your order at any time before it is dispatched (shipped) from our warehouse. To cancel:',
        bullets: [
          'Log in to your account and go to "My Orders"',
          'Select the order you wish to cancel and click "Cancel Order"',
          'Or contact us via WhatsApp / email with your Order ID',
          'Cancellations before dispatch are processed immediately',
          'Refunds for prepaid orders are initiated within 24 hours',
        ],
      },
      {
        subtitle: 'After Dispatch',
        text: 'Once an order has been dispatched, it cannot be cancelled directly. You will need to:',
        bullets: [
          'Refuse delivery when the courier arrives — the package will be returned to us',
          'Or accept delivery and initiate a return within 30 days',
          'Refund will be processed once we receive the returned item',
          'Original delivery charges (if any) are non-refundable after dispatch',
        ],
      },
      {
        subtitle: 'COD Orders',
        text: 'For Cash on Delivery orders cancelled after dispatch, no payment is collected. However, repeated cancellations may result in COD being disabled for your account.',
        bullets: [],
      },
    ],
  },
  {
    id:    'returns',
    icon:  <FiRotateCcw />,
    title: 'Return Policy',
    content: [
      {
        subtitle: 'Return Window',
        text: 'We accept returns within 30 days of the delivery date. After 30 days, returns will only be accepted for items covered under the manufacturer\'s warranty.',
        bullets: [],
      },
      {
        subtitle: 'How to Initiate a Return',
        text: 'To start a return, please follow these steps:',
        bullets: [
          'Contact us via WhatsApp (+91 83107 87546) or email (amulyaelectronics1@gmail.com) with your Order ID',
          'Describe the issue and attach clear photos/video of the defective or incorrect item',
          'Our team will review and approve the return within 1–2 business days',
          'Once approved, pack the item securely in its original packaging (if available)',
          'Drop off at your nearest courier centre — we will share the address',
          'Share the tracking number with us after shipping',
        ],
      },
      {
        subtitle: 'Return Shipping',
        text: 'Shipping costs for returns:',
        bullets: [
          'Defective / wrong items — return shipping is covered by Amulya Electronics',
          'Change of mind returns — customer bears the return shipping cost',
          'We recommend using a trackable courier service for returns',
          'Amulya Electronics is not responsible for items lost in transit during return',
        ],
      },
      {
        subtitle: 'Condition of Returned Items',
        text: 'Returned items must be:',
        bullets: [
          'In their original condition — unused, unmodified, and undamaged',
          'Packed securely to prevent damage during transit',
          'Accompanied by all original accessories, manuals, and packaging (if available)',
          'Clearly labelled with your Order ID and contact details',
        ],
      },
    ],
  },
  {
    id:    'refunds',
    icon:  <FiDollarSign />,
    title: 'Refund Policy',
    content: [
      {
        subtitle: 'Refund Timeline',
        text: 'Once we receive and inspect the returned item, refunds are processed as follows:',
        bullets: [
          'Inspection completed within 1–2 business days of receiving the return',
          'Refund initiated within 24 hours of successful inspection',
          'Razorpay / online payments — refund appears in 5–7 business days',
          'COD orders — refund credited to your Amulya wallet within 24 hours',
          'Wallet balance can be used for future purchases or requested as bank transfer',
        ],
      },
      {
        subtitle: 'Refund Methods',
        text: 'Refunds are issued via the original payment method:',
        bullets: [
          'UPI / Net Banking / Cards (via Razorpay) — refunded to source account',
          'COD orders — credited to your Amulya Electronics wallet balance',
          'Wallet balance — can be used for future orders immediately',
          'Bank transfer for wallet balance — processed within 3–5 business days',
        ],
      },
      {
        subtitle: 'Partial Refunds',
        text: 'In some cases, a partial refund may be issued:',
        bullets: [
          'Items returned with missing accessories or damaged packaging',
          'Partial return of a multi-item order',
          'Items showing signs of use beyond normal inspection',
        ],
      },
      {
        subtitle: 'Non-Refundable Charges',
        text: 'Please note the following charges are non-refundable:',
        bullets: [
          'Original delivery/shipping charges (once the order has been dispatched)',
          'Payment gateway convenience fees (if applicable)',
          'Handling charges for bulk/custom orders',
        ],
      },
    ],
  },
  {
    id:    'warranty',
    icon:  <FiShield />,
    title: 'Warranty Policy',
    content: [
      {
        subtitle: 'Warranty Coverage',
        text: 'All products sold by Amulya Electronics come with a minimum 1-year manufacturer warranty against manufacturing defects. Warranty covers:',
        bullets: [
          'Electrical or manufacturing defects present at the time of purchase',
          'Component failure under normal operating conditions',
          'Premature failure not caused by misuse or physical damage',
        ],
      },
      {
        subtitle: 'Warranty Does NOT Cover',
        text: 'The warranty is void in the following cases:',
        bullets: [
          'Physical damage, drops, burns, or liquid damage',
          'Damage caused by incorrect voltage, polarity reversal, or overloading',
          'Tampered, modified, or repaired items',
          'Normal wear and tear',
          'Damage caused by improper storage or environmental factors',
        ],
      },
      {
        subtitle: 'Claiming Warranty',
        text: 'To claim warranty service:',
        bullets: [
          'Contact us with your Order ID, purchase date, and description of the defect',
          'Attach clear photos or a video demonstrating the issue',
          'Our technical team will assess and confirm warranty eligibility',
          'Approved warranty claims: replacement or refund at our discretion',
          'Replacement subject to product availability',
        ],
      },
    ],
  },
  {
    id:    'damaged',
    icon:  <FiPackage />,
    title: 'Damaged or Wrong Items',
    content: [
      {
        subtitle: 'Received a Damaged Item?',
        text: 'If your order arrived damaged or broken, please:',
        bullets: [
          'Do NOT discard the packaging — it may be required for the claim',
          'Take clear photos/video of the damaged item and packaging immediately',
          'Contact us within 48 hours of delivery via WhatsApp or email',
          'Share your Order ID, photos, and a brief description',
          'We will arrange a replacement or full refund — at no extra cost to you',
        ],
      },
      {
        subtitle: 'Received the Wrong Item?',
        text: 'If you received an item different from what you ordered:',
        bullets: [
          'Contact us within 7 days of delivery with your Order ID and photos',
          'We will verify and arrange return pickup at our cost',
          'Correct item will be dispatched within 2–3 business days of pickup',
          'Or a full refund will be processed if the item is out of stock',
        ],
      },
    ],
  },
  {
    id:    'process',
    icon:  <FiRefreshCw />,
    title: 'Return & Refund Process',
    content: [
      {
        subtitle: 'Step-by-Step Process',
        text: 'Here\'s how our return and refund process works from start to finish:',
        bullets: [
          'Step 1: Contact us via WhatsApp or email with your Order ID and issue',
          'Step 2: Our team reviews your request within 1–2 business days',
          'Step 3: Return approved — we share return shipping instructions',
          'Step 4: Pack and ship the item using a trackable courier',
          'Step 5: Share the tracking number with us',
          'Step 6: Item received and inspected at our warehouse (1–2 days)',
          'Step 7: Refund or replacement initiated within 24 hours of inspection',
          'Step 8: Refund appears in your account within 5–7 business days',
        ],
      },
    ],
  },
  {
    id:    'exceptions',
    icon:  <FiHelpCircle />,
    title: 'Special Cases & Exceptions',
    content: [
      {
        subtitle: 'Bulk & Wholesale Orders',
        text: 'Special terms apply for bulk or wholesale orders. Please contact us before placing large orders to understand the applicable return and refund policies.',
        bullets: [],
      },
      {
        subtitle: 'Flash Sale & Discounted Items',
        text: 'Items purchased during flash sales or at heavily discounted prices may have modified return terms. Any such restrictions will be clearly stated on the product page at the time of purchase.',
        bullets: [],
      },
      {
        subtitle: 'Pre-Order Items',
        text: 'Pre-ordered items can be cancelled any time before dispatch for a full refund. Once dispatched, standard return policy applies.',
        bullets: [],
      },
      {
        subtitle: 'International Orders',
        text: 'Currently, we ship within India only. Return shipping for international orders (if applicable in future) will be the customer\'s responsibility.',
        bullets: [],
      },
    ],
  },
]

// ─── STEP TRACKER ─────────────────────────────────────────────────────────────
const processSteps = [
  { emoji: '📞', label: 'Contact Us',       desc: 'WhatsApp or email with Order ID'      },
  { emoji: '✅', label: 'Get Approved',     desc: 'We review within 1–2 business days'  },
  { emoji: '📦', label: 'Ship it Back',     desc: 'Pack securely & share tracking'       },
  { emoji: '🔍', label: 'We Inspect',       desc: 'Quality check at our warehouse'       },
  { emoji: '💰', label: 'Refund Issued',    desc: '5–7 days to your original method'     },
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

// ─── REFUND POLICY PAGE ───────────────────────────────────────────────────────
export default function RefundPolicy() {
  const [openSection, setOpenSection] = useState('cancellation')

  const toggle = (id) => setOpenSection((prev) => (prev === id ? null : id))

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[160px] flex items-center justify-center font-black text-white">
          ↩️
        </div>
        <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">
          Hassle-Free
        </p>
        <h1 className="text-4xl md:text-6xl font-black mb-3">Refund & Cancellation Policy</h1>
        <p className="text-blue-100 text-base md:text-lg max-w-xl mx-auto">
          Your satisfaction is our priority. We've made our return and refund process
          as simple and transparent as possible.
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

      {/* ── PROCESS STEPS ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-12">
        <div className="bg-white rounded-3xl shadow-lg p-7 sm:p-10">
          <div className="text-center mb-8">
            <p className="text-blue-600 font-black text-sm tracking-widest uppercase mb-1">Simple & Transparent</p>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">How Our Return Process Works</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {processSteps.map((step, i) => (
              <div key={step.label} className="flex flex-col items-center text-center relative">
                {/* Connector line */}
                {i < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-blue-100 z-0" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-3xl mb-3 relative z-10 shadow-sm">
                  {step.emoji}
                </div>
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center mb-2">
                  {i + 1}
                </div>
                <p className="font-black text-gray-800 text-sm mb-0.5">{step.label}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ELIGIBLE / NOT ELIGIBLE ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Eligible */}
          <div className="bg-white border-2 border-green-200 rounded-3xl shadow-md p-6">
            <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
              <FiCheckCircle className="text-green-500 text-xl" /> Items Eligible for Return
            </h3>
            <ul className="space-y-3">
              {returnEligible.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not Eligible */}
          <div className="bg-white border-2 border-red-200 rounded-3xl shadow-md p-6">
            <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
              <FiXCircle className="text-red-500 text-xl" /> Items NOT Eligible for Return
            </h3>
            <ul className="space-y-3">
              {returnNotEligible.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <FiXCircle className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT: Accordion + Sidebar ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

        {/* Accordion */}
        <div className="space-y-3">
          {sections.map((section) => (
            <PolicySection
              key={section.id}
              section={section}
              isOpen={openSection === section.id}
              onToggle={() => toggle(section.id)}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Quick Nav */}
          <div className="bg-white rounded-3xl shadow-lg p-6 sticky top-6">
            <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
              <FiRotateCcw className="text-blue-600" /> Quick Navigation
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

          {/* Refund Timeline */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200 rounded-3xl p-6">
            <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
              <FiClock className="text-green-600" /> Refund Timeline
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Inspection',       time: '1–2 days',   color: 'bg-blue-500'   },
                { label: 'Refund Initiated', time: '24 hours',   color: 'bg-orange-500' },
                { label: 'Online Payment',   time: '5–7 days',   color: 'bg-green-500'  },
                { label: 'COD → Wallet',     time: '24 hours',   color: 'bg-purple-500' },
                { label: 'Wallet → Bank',    time: '3–5 days',   color: 'bg-pink-500'   },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
                    <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-xs font-black text-gray-800 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact for Returns */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-3xl p-6">
            <h3 className="font-black text-gray-900 text-base mb-1 flex items-center gap-2">
              <FiMail className="text-blue-600" /> Need Help with a Return?
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              Our team is here to help Mon–Sun, 9 AM – 8 PM.
            </p>
            <div className="space-y-2">
              <a href="https://wa.me/918310787546" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-green-600 transition-colors font-semibold">
                <FaWhatsapp className="text-green-500 flex-shrink-0" />
                +91 83107 87546 (WhatsApp)
              </a>
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
              <div className="flex items-start gap-2 text-xs text-gray-600 font-semibold">
                <FiMapPin className="text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Ramanagar, Dharwad – 580001</span>
              </div>
            </div>
            <Link
              to="/contact"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl text-xs transition-colors"
            >
              <FiMail size={12} /> Contact Support
            </Link>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-amber-500 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-black text-sm mb-1">Important</p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Always contact us before returning any item. Unauthorised returns
                  may not be accepted. Keep your Order ID handy for faster resolution.
                </p>
              </div>
            </div>
          </div>

          {/* Related Links */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-md">
            <h3 className="font-black text-gray-800 text-sm mb-3">Related Policies</h3>
            <div className="space-y-2">
              {[
                { to: '/privacy-policy',   label: '🔒 Privacy Policy'      },
                { to: '/terms-conditions', label: '📋 Terms & Conditions'   },
                { to: '/contact',          label: '📞 Contact Us'           },
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
        </div>
      </div>

      {/* ── PROMISE STRIP ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-16">
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[120px] flex items-center justify-end pr-8 font-black">
            💙
          </div>
          <div className="relative z-10 max-w-2xl">
            <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">Our Promise to You</p>
            <h2 className="text-2xl md:text-3xl font-black mb-4">
              We stand behind every product we sell.
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              If something isn't right, we'll make it right — quickly, fairly, and without
              unnecessary hassle. Your trust is the foundation of everything we do at Amulya Electronics.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a
                href="https://wa.me/918310787546"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-black px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 text-sm"
              >
                <FaWhatsapp className="text-lg" /> WhatsApp Us Now
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border-2 border-white/40 hover:border-white text-white font-bold px-6 py-3 rounded-full transition-all text-sm"
              >
                <FiMail size={14} /> Email Support
              </Link>
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
