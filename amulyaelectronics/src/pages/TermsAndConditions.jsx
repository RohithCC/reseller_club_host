import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiFileText, FiShoppingCart, FiTruck, FiShield,
  FiAlertCircle, FiCheckCircle, FiXCircle, FiLock,
  FiMail, FiPhone, FiMapPin, FiChevronDown, FiChevronUp,
  FiUser, FiGlobe, FiRefreshCw, FiCreditCard,
  FiPackage, FiHelpCircle, FiEye, FiSlash,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const highlights = [
  {
    icon:    <FiShield className="text-2xl" />,
    title:   'Fair & Transparent',
    desc:    'Our terms are written in plain language — no confusing legal jargon that hides the important stuff.',
    color:   'bg-blue-50 border-blue-200',
    iconBg:  'bg-blue-600',
  },
  {
    icon:    <FiShoppingCart className="text-2xl" />,
    title:   'Secure Shopping',
    desc:    'All purchases are protected by our refund policy and Razorpay\'s secure payment infrastructure.',
    color:   'bg-green-50 border-green-200',
    iconBg:  'bg-green-600',
  },
  {
    icon:    <FiUser className="text-2xl" />,
    title:   'Your Account',
    desc:    'You are responsible for keeping your account credentials safe and all activity under your account.',
    color:   'bg-orange-50 border-orange-200',
    iconBg:  'bg-orange-500',
  },
  {
    icon:    <FiGlobe className="text-2xl" />,
    title:   'Indian Law Applies',
    desc:    'These terms are governed by the laws of India. Disputes are subject to jurisdiction in Dharwad, Karnataka.',
    color:   'bg-purple-50 border-purple-200',
    iconBg:  'bg-purple-600',
  },
]

const userObligations = [
  'Provide accurate, complete, and up-to-date information when creating an account or placing orders',
  'Keep your login credentials confidential and not share them with others',
  'Use the website only for lawful purposes and in accordance with these terms',
  'Not attempt to hack, disrupt, or gain unauthorised access to our systems',
  'Not post false, misleading, or defamatory reviews or content',
  'Notify us immediately if you suspect unauthorised use of your account',
]

const prohibited = [
  'Placing fraudulent orders or using stolen payment methods',
  'Reselling our products without prior written authorisation',
  'Scraping, crawling, or data-mining our website without permission',
  'Impersonating Amulya Electronics or any of our staff',
  'Using our website to distribute spam, malware, or harmful content',
  'Circumventing security measures or attempting to breach our systems',
  'Creating multiple accounts to abuse promotional offers or discounts',
]

const sections = [
  {
    id:    'acceptance',
    icon:  <FiFileText />,
    title: 'Acceptance of Terms',
    content: [
      {
        subtitle: 'Agreement to Terms',
        text: 'By accessing or using the Amulya Electronics website (amulyaelectronics.com) or placing an order with us, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our website.',
        bullets: [],
      },
      {
        subtitle: 'Who Can Use Our Services',
        text: 'To use our services, you must:',
        bullets: [
          'Be at least 18 years of age, or have parental/guardian consent',
          'Be a resident of India (we currently ship within India only)',
          'Have the legal capacity to enter into a binding contract',
          'Provide accurate personal and payment information',
        ],
      },
      {
        subtitle: 'Changes to Terms',
        text: 'Amulya Electronics reserves the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the website. Continued use of our services after changes constitutes acceptance of the new terms. We will notify registered users of significant changes via email.',
        bullets: [],
      },
    ],
  },
  {
    id:    'account',
    icon:  <FiUser />,
    title: 'Account Registration & Responsibilities',
    content: [
      {
        subtitle: 'Creating an Account',
        text: 'To place orders and access certain features, you may need to create an account. When registering, you agree to:',
        bullets: [
          'Provide truthful, accurate, and complete registration information',
          'Keep your account information current and up to date',
          'Maintain the confidentiality of your password',
          'Accept responsibility for all activities that occur under your account',
          'Notify us immediately of any unauthorised access or security breach',
        ],
      },
      {
        subtitle: 'Account Termination',
        text: 'We reserve the right to suspend or terminate your account at our discretion if:',
        bullets: [
          'You violate any provision of these Terms and Conditions',
          'We suspect fraudulent or abusive activity on your account',
          'You provide false or misleading information',
          'You engage in conduct harmful to other customers or our business',
        ],
      },
      {
        subtitle: 'Guest Checkout',
        text: 'You may place orders as a guest without creating an account. However, a registered account provides access to order history, easy returns, and faster checkout for future orders.',
        bullets: [],
      },
    ],
  },
  {
    id:    'orders',
    icon:  <FiShoppingCart />,
    title: 'Orders & Pricing',
    content: [
      {
        subtitle: 'Placing an Order',
        text: 'When you place an order on our website, you are making an offer to purchase the selected products. An order is confirmed only when you receive an order confirmation email from us. We reserve the right to decline any order at our discretion.',
        bullets: [],
      },
      {
        subtitle: 'Pricing',
        text: 'All prices on our website are:',
        bullets: [
          'Listed in Indian Rupees (INR) and inclusive of applicable taxes',
          'Subject to change without prior notice',
          'Verified at the time of checkout — the final price shown at checkout is what you pay',
          'Occasionally subject to promotional discounts with specific validity periods',
        ],
      },
      {
        subtitle: 'Pricing Errors',
        text: 'While we make every effort to ensure accurate pricing, errors may occasionally occur. In the event of a pricing error:',
        bullets: [
          'We will notify you as soon as the error is discovered',
          'You will have the option to proceed at the correct price or cancel the order',
          'We are not obligated to honour orders placed at incorrect prices',
          'Full refunds will be issued for cancelled orders due to pricing errors',
        ],
      },
      {
        subtitle: 'Order Cancellation by Us',
        text: 'Amulya Electronics reserves the right to cancel any order due to:',
        bullets: [
          'Product going out of stock after order placement',
          'Pricing or product description errors',
          'Suspected fraudulent activity',
          'Inability to verify payment or delivery details',
          'Force majeure events beyond our control',
        ],
      },
    ],
  },
  {
    id:    'payment',
    icon:  <FiCreditCard />,
    title: 'Payment Terms',
    content: [
      {
        subtitle: 'Accepted Payment Methods',
        text: 'We accept the following payment methods:',
        bullets: [
          'UPI (GPay, PhonePe, Paytm, BHIM, and all UPI apps)',
          'Credit and Debit Cards (Visa, Mastercard, RuPay)',
          'Net Banking (all major Indian banks)',
          'Digital Wallets (Paytm, Mobikwik, etc.)',
          'Cash on Delivery (COD) — available for eligible orders above ₹199',
        ],
      },
      {
        subtitle: 'Payment Security',
        text: 'All online payments are processed by Razorpay, a PCI-DSS Level 1 certified payment gateway. We do not store your card details on our servers. All payment data is encrypted and handled securely.',
        bullets: [],
      },
      {
        subtitle: 'Cash on Delivery (COD)',
        text: 'COD is available for orders above ₹199. Please note:',
        bullets: [
          'Exact change is appreciated as our delivery partners may not carry change',
          'Repeated COD order rejections may result in COD being disabled for your account',
          'COD orders are subject to verification calls before dispatch',
          'Additional COD handling fee may apply for certain pin codes',
        ],
      },
      {
        subtitle: 'Failed Payments',
        text: 'If a payment fails or is declined, your order will not be confirmed. Money deducted for failed transactions is typically refunded by your bank within 5–7 business days. Contact us if you face any payment issues.',
        bullets: [],
      },
    ],
  },
  {
    id:    'delivery',
    icon:  <FiTruck />,
    title: 'Shipping & Delivery',
    content: [
      {
        subtitle: 'Delivery Areas',
        text: 'We currently deliver to all serviceable pin codes across India. Delivery availability is confirmed at checkout. Remote or restricted areas may have limited or no delivery options.',
        bullets: [],
      },
      {
        subtitle: 'Delivery Timelines',
        text: 'Estimated delivery times (business days after dispatch):',
        bullets: [
          'Dharwad & nearby areas: 1–2 business days',
          'Karnataka: 2–4 business days',
          'Metro cities (Mumbai, Delhi, Bangalore, Chennai): 3–5 business days',
          'Rest of India: 5–8 business days',
          'Remote/rural areas: 7–12 business days',
        ],
      },
      {
        subtitle: 'Shipping Charges',
        text: 'Shipping charges are calculated at checkout based on your location and order value:',
        bullets: [
          'Free delivery on orders above ₹499',
          'Flat ₹49 delivery charge for orders below ₹499',
          'Additional charges may apply for remote areas',
          'Expedited delivery options may be available for select pin codes',
        ],
      },
      {
        subtitle: 'Delivery Responsibility',
        text: 'Risk of loss or damage to products passes to you upon delivery. We are not responsible for:',
        bullets: [
          'Delays caused by courier partners or weather conditions',
          'Delivery failures due to incorrect address provided by the customer',
          'Items lost or damaged after successful delivery confirmation',
          'Delays due to incomplete or inaccessible delivery locations',
        ],
      },
    ],
  },
  {
    id:    'intellectual',
    icon:  <FiEye />,
    title: 'Intellectual Property',
    content: [
      {
        subtitle: 'Our Content',
        text: 'All content on the Amulya Electronics website — including text, images, logos, graphics, product descriptions, and software — is the property of Amulya Electronics and is protected by Indian and international copyright laws.',
        bullets: [],
      },
      {
        subtitle: 'Permitted Use',
        text: 'You may use our website content only for:',
        bullets: [
          'Personal, non-commercial browsing and shopping purposes',
          'Sharing product links on social media for personal use',
          'Printing product information for personal reference',
        ],
      },
      {
        subtitle: 'Prohibited Use',
        text: 'Without our prior written consent, you may not:',
        bullets: [
          'Copy, reproduce, or distribute our content for commercial purposes',
          'Modify, adapt, or create derivative works from our content',
          'Use our brand name, logo, or trademarks in any way',
          'Scrape or harvest data from our website',
          'Frame or mirror our website on any other site',
        ],
      },
    ],
  },
  {
    id:    'liability',
    icon:  <FiAlertCircle />,
    title: 'Limitation of Liability',
    content: [
      {
        subtitle: 'Disclaimer of Warranties',
        text: 'Our website and services are provided "as is" without warranties of any kind, either express or implied. We do not warrant that the website will be uninterrupted, error-free, or free of viruses or other harmful components.',
        bullets: [],
      },
      {
        subtitle: 'Limitation of Damages',
        text: 'To the maximum extent permitted by law, Amulya Electronics shall not be liable for:',
        bullets: [
          'Indirect, incidental, or consequential damages arising from use of our products',
          'Loss of data, profits, or business opportunities',
          'Damages arising from events beyond our reasonable control (force majeure)',
          'Technical issues, delays, or errors caused by third-party service providers',
          'Misuse of products or damages from improper installation or use',
        ],
      },
      {
        subtitle: 'Maximum Liability',
        text: 'Our maximum liability to you for any claim arising from these terms or your use of our services shall not exceed the amount you paid for the specific product or service giving rise to the claim.',
        bullets: [],
      },
    ],
  },
  {
    id:    'reviews',
    icon:  <FiFileText />,
    title: 'Product Reviews & User Content',
    content: [
      {
        subtitle: 'Submitting Reviews',
        text: 'By submitting a product review or any other content on our website, you grant Amulya Electronics a non-exclusive, royalty-free licence to use, reproduce, and display that content on our website and marketing materials.',
        bullets: [],
      },
      {
        subtitle: 'Review Guidelines',
        text: 'All reviews must:',
        bullets: [
          'Be based on genuine personal experience with the product',
          'Be written in a respectful and constructive manner',
          'Not contain false, defamatory, or misleading information',
          'Not include personal information about others',
          'Not contain spam, promotional content, or links',
        ],
      },
      {
        subtitle: 'Content Moderation',
        text: 'We reserve the right to remove or reject any review or content that violates our guidelines or these terms, without notice or explanation.',
        bullets: [],
      },
    ],
  },
  {
    id:    'prohibited-conduct',
    icon:  <FiSlash />,
    title: 'Prohibited Conduct',
    content: [
      {
        subtitle: 'Prohibited Activities',
        text: 'The following conduct is strictly prohibited when using our website or services:',
        bullets: prohibited,
      },
      {
        subtitle: 'Consequences',
        text: 'Violation of these prohibitions may result in:',
        bullets: [
          'Immediate suspension or termination of your account',
          'Cancellation of pending orders without refund',
          'Reporting to appropriate law enforcement authorities',
          'Legal action to recover damages',
        ],
      },
    ],
  },
  {
    id:    'governing',
    icon:  <FiGlobe />,
    title: 'Governing Law & Dispute Resolution',
    content: [
      {
        subtitle: 'Applicable Law',
        text: 'These Terms and Conditions are governed by and construed in accordance with the laws of India, including but not limited to the Consumer Protection Act 2019, Information Technology Act 2000, and applicable e-commerce regulations.',
        bullets: [],
      },
      {
        subtitle: 'Dispute Resolution',
        text: 'In the event of any dispute arising out of or in connection with these terms or your use of our services:',
        bullets: [
          'We encourage you to first contact us directly to resolve the issue amicably',
          'Unresolved disputes shall be subject to the exclusive jurisdiction of the courts in Dharwad, Karnataka, India',
          'For consumer disputes, you may also approach the National Consumer Helpline (1800-11-4000)',
          'Online dispute resolution is available through the ODR portal at consumerhelpline.gov.in',
        ],
      },
      {
        subtitle: 'Severability',
        text: 'If any provision of these Terms and Conditions is found to be invalid or unenforceable, the remaining provisions will continue to be valid and enforceable to the fullest extent permitted by law.',
        bullets: [],
      },
    ],
  },
  {
    id:    'contact-terms',
    icon:  <FiHelpCircle />,
    title: 'Contact & Grievance Redressal',
    content: [
      {
        subtitle: 'Grievance Officer',
        text: 'In accordance with the Information Technology Act 2000 and Consumer Protection (E-Commerce) Rules 2020, we have designated a Grievance Officer to address your concerns:',
        bullets: [
          'Name: Amulya Patil',
          'Designation: Founder & Grievance Officer',
          'Email: amulyaelectronics1@gmail.com',
          'Phone: +91 83107 87546',
          'Address: Ramanagar, Dharwad – 580001, Karnataka, India',
          'Response time: Within 48 hours of receiving your complaint',
        ],
      },
      {
        subtitle: 'How to Contact Us',
        text: 'For any questions, concerns, or feedback regarding these Terms and Conditions or our services, you can reach us through:',
        bullets: [
          'WhatsApp: +91 83107 87546 (Mon–Sun, 9 AM – 8 PM)',
          'Email: amulyaelectronics1@gmail.com',
          'Contact form: Visit our Contact Us page',
          'In-person: Visit our store in Dharwad during business hours',
        ],
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

// ─── TERMS AND CONDITIONS PAGE ────────────────────────────────────────────────
export default function TermsAndConditions() {
  const [openSection, setOpenSection] = useState('acceptance')

  const toggle = (id) => setOpenSection((prev) => (prev === id ? null : id))

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[160px] flex items-center justify-center font-black text-white">
          📋
        </div>
        <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">
          Please Read Carefully
        </p>
        <h1 className="text-4xl md:text-6xl font-black mb-3">Terms & Conditions</h1>
        <p className="text-blue-100 text-base md:text-lg max-w-xl mx-auto">
          These terms govern your use of the Amulya Electronics website and services.
          We've kept them clear and straightforward — because trust matters.
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

      {/* ── USER OBLIGATIONS & PROHIBITED ── */}
      <div className="max-w-[1200px] mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Obligations */}
          <div className="bg-white border-2 border-blue-200 rounded-3xl shadow-md p-6">
            <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
              <FiCheckCircle className="text-blue-600 text-xl" /> Your Responsibilities
            </h3>
            <ul className="space-y-3">
              {userObligations.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prohibited */}
          <div className="bg-white border-2 border-red-200 rounded-3xl shadow-md p-6">
            <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
              <FiXCircle className="text-red-500 text-xl" /> Prohibited Activities
            </h3>
            <ul className="space-y-3">
              {prohibited.map((item) => (
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

          {/* Intro card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6 mb-1">
            <h2 className="text-lg font-black text-gray-900 mb-2">Introduction</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Welcome to Amulya Electronics. These Terms and Conditions ("Terms") constitute a legally
              binding agreement between you and Amulya Electronics ("we", "us", "our") governing your
              access to and use of our website and purchase of products from us.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              By using our website, you agree to these Terms in full. If you disagree with any part,
              please discontinue use of our services. For questions, visit our{' '}
              <Link to="/contact" className="text-blue-600 font-bold hover:underline">Contact page</Link>.
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

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Quick Nav */}
          <div className="bg-white rounded-3xl shadow-lg p-6 sticky top-6">
            <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
              <FiFileText className="text-blue-600" /> Quick Navigation
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
                  <span className="text-base flex-shrink-0">{s.icon}</span>
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Key Facts */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-3xl p-6">
            <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
              <FiShield className="text-blue-600" /> Key Facts
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Effective Date',    value: '1st April 2026'    },
                { label: 'Governing Law',     value: 'Laws of India'     },
                { label: 'Jurisdiction',      value: 'Dharwad, Karnataka'},
                { label: 'Min. Age',          value: '18 years'          },
                { label: 'Delivery',          value: 'India Only'        },
                { label: 'Response Time',     value: 'Within 48 hours'   },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                  <span className="text-xs font-black text-gray-800 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-md">
            <h3 className="font-black text-gray-900 text-base mb-1 flex items-center gap-2">
              <FiMail className="text-blue-600" /> Have Questions?
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              Our team is happy to clarify any part of these terms.
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
              <FiMail size={12} /> Contact Us
            </Link>
          </div>

          {/* Important note */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-amber-500 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-black text-sm mb-1">Notice</p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  By placing an order or creating an account, you confirm that you
                  have read and agree to these Terms and Conditions in full.
                </p>
              </div>
            </div>
          </div>

          {/* Related Links */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-md">
            <h3 className="font-black text-gray-800 text-sm mb-3">Related Policies</h3>
            <div className="space-y-2">
              {[
                { to: '/privacy-policy',             label: '🔒 Privacy Policy'               },
                { to: '/refund-cancellation-policy',  label: '↩️ Refund & Cancellation Policy' },
                { to: '/contact',                    label: '📞 Contact Us'                    },
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
            🤝
          </div>
          <div className="relative z-10 max-w-2xl">
            <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">Built on Trust</p>
            <h2 className="text-2xl md:text-3xl font-black mb-4">
              We're committed to fair, transparent business — always.
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              These terms exist to protect both you and us. If you ever feel something is
              unfair or unclear, reach out — we'll always do the right thing.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a
                href="https://wa.me/918310787546"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-black px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 text-sm"
              >
                <FaWhatsapp className="text-lg" /> Chat on WhatsApp
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border-2 border-white/40 hover:border-white text-white font-bold px-6 py-3 rounded-full transition-all text-sm"
              >
                <FiMail size={14} /> Send Us a Message
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
