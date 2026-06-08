# ⚡ Amulya Electronics — Full-Stack E-Commerce Platform

> **Dharwad's trusted electronics components store — online since 2020.**  
> A complete e-commerce solution with customer-facing storefront, admin dashboard, and Node.js/Express backend.  
> **Prepared for Frontend Team Handoff — June 2026**

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Customer Frontend](#-customer-frontend)
- [Admin Dashboard](#-admin-dashboard)
- [Backend API](#-backend-api)
- [Database Models](#-database-models)
- [Authentication & Authorization](#-authentication--authorization)
- [Payment System](#-payment-system)
- [Key Design Decisions](#-key-design-decisions)
- [Knowledge Graph](#-knowledge-graph)
- [Known Issues & Tech Debt](#-known-issues--tech-debt)
- [For AI Agents](#-for-ai-agents)

---

## 🏗 Architecture

Three independent Vite + React projects plus one backend server:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Customer        │     │  Admin Panel     │     │  Backend API     │
│  Storefront      │────▶│  (React 19/Vite) │────▶│  (Express/Node)  │
│  (React 19/Vite) │     │  Port 5174       │     │  Port 10000      │
│  Port 5173       │     │                  │     │                  │
└─────────────────┘     └─────────────────┘     └────────┬─────────┘
                                                          │
                                                ┌─────────▼─────────┐
                                                │  MongoDB 7.0      │
                                                │  (Local / Atlas)   │
                                                └───────────────────┘
```

### Projects

| Project | Directory | Purpose | Port | Pages | Components |
|---------|-----------|---------|------|-------|------------|
| **Customer Frontend** | `amulyaelectronics/` | Public storefront | 5173 | 22 | 17 |
| **Admin Dashboard** | `admin/` | Store management (901 modules) | 5174 | 16 | 5 |
| **Backend API** | `backend/` | Express REST API | 10000 | — | — |
| **Knowledge Graph** | `graphify-out/` | Auto-generated docs | — | — | — |

---

## 🛠 Tech Stack

### Backend (`backend/`)

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ (ESM — `"type": "module"`) |
| **Framework** | Express 4.19 |
| **Database** | MongoDB 7.0 via Mongoose 8.5 |
| **Auth** | JWT (`jsonwebtoken`), bcryptjs, Google OAuth |
| **File Upload** | Multer (local `uploads/` directory) |
| **Payments** | Razorpay (primary), Stripe (configured) |
| **Email** | Nodemailer (Gmail SMTP) |
| **Real-time** | Socket.io 4.8 (dashboard updates) |
| **Security** | Helmet, HPP, XSS-Clean, express-rate-limit, validator |

### Customer Frontend (`amulyaelectronics/`)

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + Vite 5 |
| **Routing** | React Router DOM 7 |
| **State** | Redux Toolkit 2 + React-Redux 9 (11 slices) + React Context (Auth, Cart) |
| **Styling** | Tailwind CSS 3 + custom CSS |
| **HTTP** | Axios (with interceptors for auto-token) |
| **Icons** | react-icons (Feather), lucide-react |
| **Auth** | `@react-oauth/google` (Google login) |
| **Toasts** | react-toastify |
| **Build** | javascript-obfuscator (production build) |

### Admin Dashboard (`admin/`)

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + Vite 5 |
| **Routing** | React Router DOM 6 |
| **State** | Token-based (JWT decoded client-side for role) |
| **Styling** | Tailwind CSS 3 + inline styles + TailAdmin-inspired design |
| **HTTP** | Axios |
| **Charts** | recharts (Dashboard, Sales Analytics) |
| **Rich Text** | Tiptap (Blog Manager) |
| **Icons** | Custom SVG icons in sidebar |
| **Real-time** | socket.io-client (new order alerts) |

---

## 📁 Project Structure

```
amulya-electronics/
├── README.md                               ← You are here
├── graphify-out/                           ← Auto-generated knowledge graph
│   ├── graph.json                          ← Raw graph data
│   ├── graph.html                          ← Interactive graph visualization
│   └── GRAPH_REPORT.md                     ← Full audit report
│
├── backend/                                ← Express API server
│   ├── server.js                           ← Entry point, CORS, routes, Socket.io
│   ├── .env                                ← All secrets & config
│   ├── config/
│   │   ├── mongodb.js                      ← Mongoose connection (graceful fallback)
│   │   └── razorpay.js                     ← Razorpay config
│   ├── models/                             ← 14+ Mongoose schemas (see below)
│   ├── controllers/                        ← Route handler functions
│   ├── routes/                             ← Express routers with middleware chains
│   ├── middleware/                         ← Auth & upload middleware
│   ├── services/
│   │   └── emailService.js                 ← HTML email templates
│   └── uploads/                            ← Local upload storage
│
├── amulyaelectronics/                      ← Customer-facing storefront
│   ├── src/
│   │   ├── App.jsx                         ← Routes, Redux init, layout (Navbar + Footer + OffersBanner)
│   │   ├── main.jsx                        ← Entry + providers (Redux, Router, Auth, Cart, Google OAuth)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx             ← JWT auth (login, logout, profile fetch, localStorage persist)
│   │   │   └── CartContext.jsx             ← Cart + wishlist state (add, remove, qty)
│   │   ├── app/                            ← Redux slices (11 total)
│   │   │   ├── store.js                    ← configureStore
│   │   │   ├── authSlice.js                ← Login, Google OAuth, profile
│   │   │   ├── cartSlice.js                ← Server-synced cart
│   │   │   ├── wishlistSlice.js            ← localStorage persisted
│   │   │   ├── orderSlice.js               ← Razorpay + COD order placement
│   │   │   ├── orderDetailsSlice.js        ← Order history
│   │   │   ├── searchSlice.js              ← Live search
│   │   │   ├── footerSlice.js              ← Footer settings fetch
│   │   │   ├── categorySlice.js            ← Category tree
│   │   │   ├── Contentslice.js             ← Testimonials + blogs
│   │   │   ├── projectcontentslice.js      ← Projects
│   │   │   └── userProfileSlice.js         ← Profile fetch/update
│   │   ├── pages/                          ← 22 customer-facing pages
│   │   └── components/                     ← 17 reusable components
│   └── utils/
│       └── api.js                          ← Axios instance with auth interceptor
│
├── admin/                                  ← Admin dashboard
│   ├── src/
│   │   ├── App.jsx                         ← Routes, JWT decode, login gate
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx                 ← Role-based accordion nav (5 sections, SVG icons)
│   │   │   ├── Navbar.jsx                  ← Top bar with hamburger, admin badge, user dropdown
│   │   │   ├── Login.jsx                   ← Admin login form
│   │   │   ├── NewOrderAlert.jsx           ← Real-time order toast + desktop notification
│   │   │   └── RichTextEditor.jsx          ← Tiptap-based blog content editor
│   │   ├── pages/                          ← 16 pages (Dashboard, Add, List, Orders, Categories, Users, HeroBanner, Footer, CTA Banners, Contacts, Customers, Sales Analytics, Coupons, Payment Controller, Blog, Profile)
│   │   └── hooks/
│   │       └── useSocket.js                ← Socket.io singleton + `useNewOrderSocket` hook
│   └── assets/
│       └── assets.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ (with npm)
- **MongoDB** 7.0+ (local via Homebrew or Atlas)
- **Google OAuth** client ID (for Google login)
- **Gmail App Password** (for email sending)

### Quick Start

```bash
# 1. Install dependencies (from project root)
cd backend && npm install
cd ../amulyaelectronics && npm install
cd ../admin && npm install

# 2. Start MongoDB (local)
brew services start mongodb-community@7.0

# 3. Start backend (Terminal 1)
cd backend && node server.js

# 4. Start customer frontend (Terminal 2)
cd amulyaelectronics && npx vite --port 5173 --host

# 5. Start admin panel (Terminal 3)
cd admin && npx vite --port 5174 --host

# 6. (Optional) Seed database
cd backend && node scripts/seed.js
```

### Access Points

| App | URL | Credentials |
|-----|-----|-------------|
| **Customer Storefront** | http://localhost:5173 | Register new account |
| **Admin Dashboard** | http://localhost:5174 | `admin@example.com` / `Admin@123` |
| **Backend API** | http://localhost:10000 | — |

> 💡 The super admin credentials are set in `backend/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Once logged in, create additional admin/staff users from the **Users** page.

---

## 🛒 Customer Frontend

### Pages (22)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home.jsx | Hero carousel, trust strip, categories grid, featured/bestseller products, blog, projects, testimonials |
| `/collection` | Collection.jsx | Product listing with filters, sub-categories, sort, pagination |
| `/collection/:category` | Collection.jsx | Filtered by category |
| `/collection/:category/:subCategory` | Collection.jsx | Filtered by sub-category |
| `/product/:productId` | Product.jsx | Images, specs table, key features, use-case cards, reviews, warranty |
| `/cart` | Cart.jsx | Cart management, coupon, totals |
| `/checkout` | Checkout.jsx | Address form, delivery options, payment method |
| `/place-order` | PlaceOrder.jsx | Order placement |
| `/orders` | MyOrders.jsx | Order history with status |
| `/orders/:orderNumber` | OrderDetails.jsx | Single order detail with tracking timeline |
| `/login` | Login.jsx | Login/register with Google OAuth |
| `/wishlist` | Wishlist.jsx | Saved items |
| `/profile` | Profile.jsx | Edit name, phone, avatar |
| `/about` | About.jsx | Company info |
| `/contact` | Contact.jsx | Contact form |
| `/search` | SearchBar.jsx | Full-text search with suggestions |
| `/forgot-password` | ForgotPassword.jsx | Password reset request |
| `/reset-password` | ResetPassword.jsx | Reset with token |
| `/verify` | Verify.jsx | Email verification |
| `/privacy-policy` | PrivacyPolicy.jsx | Legal |
| `/refund-policy` | RefundPolicy.jsx | Legal |
| `/terms` | TermsAndConditions.jsx | Legal |
| `/blog` | BlogPost.jsx | Blog listing + single post |
| `/blog/:id` | BlogPost.jsx | Single blog post |

### Key Components (17)

| Component | Description |
|-----------|-------------|
| `Navbar.jsx` | Main nav with cart/wishlist counts, category dropdown, mobile menu |
| `Footer.jsx` | Contact, social links, newsletter, trust badges — all from DB settings |
| `HeroBanner.jsx` | Auto-rotating carousel with admin-managed slides (homepage) |
| `FeaturedProducts.jsx` | Featured products grid |
| `BestsellingKits.jsx` | Bestseller section |
| `PopularCategories.jsx` | Category grid |
| `ProductShowcaseBanner.jsx` | Showcase banner (homepage) |
| `ProductShowcaseBanner_footer.jsx` | Site-wide banner — responsive desktop/mobile images, auto-rotate, dot indicators |
| `Blog.jsx` | Blog posts display |
| `BlogPost.jsx` | Single blog post with comments |
| `OurProjects.jsx` | Portfolio projects |
| `ShiningGlobally.jsx` | Trust/achievement section |
| `SearchModal.jsx` | Search overlay |
| `PaymentModal.jsx` | Razorpay payment modal |
| `OrderReport.jsx` | Order receipt/print |
| `GuideSlider.jsx` | Product guide carousel |
| `LearningPreference.jsx` | Learning resources section |

### State Architecture

The frontend uses a **dual state management** approach:

1. **Redux Toolkit** (primary): 11 slices covering auth, cart, wishlist, orders, search, footer, categories, content, projects, userProfile
2. **React Context** (secondary):
   - `AuthContext` — persists user/token to `localStorage`, provides `login/logout/updateUser`, auto-attaches token via axios interceptor
   - `CartContext` — client-side cart + wishlist for instant UI updates

> ⚠️ **Note:** Both `AuthContext` and `authSlice` manage auth state independently. The Context is the primary source of truth for Navbar. The Redux slice handles async thunks.

---

## 🔧 Admin Dashboard

16 pages · 5 components · 1 hook · 901 modules · ~1.5MB bundle (434KB gzip)

### Pages (16)

| # | Route | Page | Lines | Key Libraries | Role | Description |
|---|-------|------|-------|---------------|------|-------------|
| 1 | `/dashboard` | Dashboard.jsx | 935 | recharts, socket.io-client | All | KPI cards (products, orders, revenue, customers, stock), order status donut chart, monthly revenue line chart, new orders WebSocket widget with pulsing glow + 30s polling, low stock alerts table, recent contacts |
| 2 | `/add` | Add.jsx | 741 | axios, react-toastify | All | Add product form — 4 image uploads (validated 1200×1200 WebP/JPEG 100-200KB), category tree from API, badges (bestseller/HOT/popular/featured), key features, specifications, use-case cards with icon picker, tags |
| 3 | `/list` | List.jsx | 1026 | axios, react-toastify | All | Product listing with search/filter/sort, pagination (10/25/50/100), inline stock toggle via ToggleSwitch, edit modal with full product editor + image replacement + review management (fetch + delete), delete confirmation dialog |
| 4 | `/orders` | Orders.jsx | 1421 | jsPDF + autoTable (CDN) | All | Order management — search, filters (status/payment/date range), pagination, inline status badges, order detail drawer with items/pricing/payment/tracking, status update modal with location + tracking + admin note, refund modal, invoice PDF with GST breakdown, authorised signatory, terms |
| 5 | `/categories` | Categories.jsx | 743 | axios | All | Category + sub-category tree — add/edit/delete with image upload, accordion expand, search filter, stats (total/active/hidden), toggle active |
| 6 | `/users` | Users.jsx | 450 | axios | Super Admin | Admin staff user management — add user (name/email/pass/role), edit role dropdown, change password, delete with confirm |
| 7 | `/hero-banner` | HeroBannerAdmin.jsx | 442 | axios | Admin+ | Hero carousel slide management — desktop + mobile image, link, order, toggle, reorder up/down, gradient presets, inline toast feedback |
| 8 | `/footer-settings` | FooterEditor.jsx | 373 | axios | Admin+ | Footer settings editor — phone (2), email, address, hours, 5 social links (WhatsApp/Instagram/Facebook/YouTube/X), newsletter title/subtitle, trust badges (add/remove), app store links, copyright |
| 9 | `/cta-banners` | ShowcaseBanners.jsx | 354 | axios | Admin+ | Site-wide CTA banners — desktop + mobile image upload, title/subtitle/cta/link, order, toggle active |
| 10 | `/contacts` | ContactsList.jsx | 532 | axios | All | Contact inbox — search, filter tabs (all/new/read/replied), expandable cards with reply handling, status dropdown inline, stats, pagination |
| 11 | `/customers` | Customers.jsx | 1106 | axios | All | Customer management — search, preset date filter (today/week/month/3 months), stats (total/active/new/orders), order expand rows, per-customer CSV export, bulk download, 360° drawer with full order history |
| 12 | `/sales-analytics` | SalesAnalytics.jsx | 441 | recharts | All | Sales breakdown — summary KPIs (orders/revenue/items/avg order), hourly order bar chart, payment method split donut (COD vs Razorpay), daily revenue line chart (30 days), top 10 products table, category sales table, date range filter |
| 13 | `/coupons` | CouponManagement.jsx | 642 | axios | Admin+ | Full coupon CRUD — create/edit with type (percent/flat), value, min order, max discount, usage/per-user limits, validity. Bulk generate modal (count+prefix), usage tracking modal (per-user table), expiring-soon alert banner, toggle active |
| 14 | `/payment-controller` | PaymentController.jsx | 405 | axios | Admin+ | Tabbed view — Delivery Charges table (method dropdown, single-state select, charge/free above/days, add/edit/delete/toggle) + COD Control table (per-state toggle, min/max order limits, save) |
| 15 | `/blog` | BlogManager.jsx | 682 | @tiptap/react (rich text editor) | Admin+ | Blog CRUD — title, featured image, category (Project/Blog/News Updates), rich content editor (image/link/underline/align/placeholder), publish date, category + date range filters, toggle publish |
| 16 | `/profile` | Profile.jsx | 412 | axios, react-router-dom | All | Admin profile — view/change name, email, password fields, JWT info display, logout |

### Components (5)

| Component | Lines | Role | Description |
|-----------|-------|------|-------------|
| **Login.jsx** | 421 | Public | White TailAdmin-themed admin login — email + password with show/hide toggle, loading spinner, SVG icons, error/info toasts |
| **Navbar.jsx** | 306 | All | Sticky top bar — hamburger for mobile sidebar toggle, logo, admin role badge from JWT, phone link, user avatar dropdown with logout |
| **Sidebar.jsx** | 427 | Role-aware | Accordion sidebar — 5 sections (Main, Products, Content, Website Setting, Users), SVG icons, desktop collapse, mobile-full drawer with backdrop, item highlighted for active route |
| **NewOrderAlert.jsx** | 193 | All | Real-time order notification — WebSocket `new-order` event listener + 30s HTTP polling fallback, desktop Notification API, chime sound, toast with link to orders |
| **RichTextEditor.jsx** | ~350 | Blog | Tiptap-based rich text editor — bold/italic/heading/bullet/list, image upload via API, link, underline, text-align, placeholder |

### Role-Based Access Control

| Role | Source | Pages Accessible | Guarded |
|------|--------|-----------------|---------|
| **super_admin** | Backend env var | All 16 pages | ✅ Users page via `<RoleGuard>` |
| **admin** | MongoDB `role: admin` | 14 pages (no Users) | ✅ Hero/Footer/Banners/Coupons/Payment via `<RoleGuard>` |
| **staff** | MongoDB `role: staff` | 11 pages (no Settings pages) | ❌ Sidebar hiding only |
| **bloger** | MongoDB `role: bloger` | Blog only | ✅ Blog link + route accessible |

> Route-level guards use `<RoleGuard allowed={[...]}>` for sensitive pages. Staff/bloger access is enforced via sidebar visibility + backend middleware.

### Key Libraries

| Library | Used In | Purpose |
|---------|---------|---------|
| **recharts** | Dashboard, SalesAnalytics | PieChart (donut), LineChart, BarChart, Tooltip, Legend |
| **socket.io-client** | Dashboard (useSocket) | Real-time new-order events |
| **@tiptap/react** | BlogManager | Rich text editing (starter-kit + image/link/underline/text-align/placeholder) |
| **jsPDF + autoTable** | Orders | Invoice PDF generation (CDN-loaded) |
| **react-toastify** | 12 pages + Login | Toast notifications (dark theme, 3s auto-close, top-right) |
| **react-router-dom** | App, Sidebar, Profile | SPA routing, navigation guards |

### API Coverage

| Backend Prefix | Admin Pages Using It |
|----------------|---------------------|
| `/api/dashboard` | Dashboard, SalesAnalytics |
| `/api/product` | Add, List |
| `/api/order` | Orders, Dashboard |
| `/api/category` | Add, List, Categories |
| `/api/user` | Login, Users, Profile |
| `/api/coupons` | CouponManagement |
| `/api/delivery` | PaymentController |
| `/api/cod` | PaymentController |
| `/api/hero-banner` | HeroBannerAdmin |
| `/api/showcase` | ShowcaseBanners |
| `/api/footer` | FooterEditor |
| `/api/contact` | ContactsList |
| `/api/blog` | BlogManager |
| `/api/customers` | Customers |

### Build Statistics

| Metric | Value |
|--------|-------|
| Total modules | 901 |
| Bundle size | 1,506 KB (434 KB gzip) |
| CSS | 40.6 KB (7.9 KB gzip) |
| Build time | ~4.5s |
| Pages | 16 |
| Components | 5 |
| Hooks | 1 (useSocket) |

---

## ✅ Recent Audit (June 2026)

### Bugs Found & Fixed

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `Dashboard.jsx:169` | `SkeletonTable` used `width` instead of destructured param `w` — rendered `NaN` width loading bars | Changed to `width: w` |
| 2 | `FooterEditor.jsx:10` | Hardcoded port 4000 fallback — would fail to reach backend (runs on 10000) | Changed to `localhost:10000` |
| 3 | `HeroBannerAdmin.jsx:12` | Same port 4000 fallback | Changed to `localhost:10000` |
| 4 | `ContactsList.jsx:10` | Same port 4000 fallback | Changed to `localhost:10000` |
| 5 | `Customers.jsx:15` | Same port 4000 fallback | Changed to `localhost:10000` |

### Build Status

- ✅ Admin build passes (901 modules, 0 errors)
- ✅ Storefront build passes (1800+ modules, 0 errors)
- ✅ Backend runs on port 10000 with MongoDB connected

---

## 🔌 Backend API

All endpoints under `http://localhost:10000/api/`

### Authentication (`/api/user`)

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/register` | Public | 10/15min | Register new customer |
| POST | `/login` | Public | 10/15min | Login customer |
| POST | `/google` | Public | 10/15min | Google OAuth login |
| POST | `/admin` | Public | 10/15min | Admin login |
| POST | `/forgot-password` | Public | 5/hr | Send reset email |
| POST | `/reset-password` | Public | 5/hr | Reset password |
| POST | `/profile` | JWT | — | Get profile |
| POST | `/update-profile` | JWT | 20/min | Update name/phone/avatar |
| POST | `/admin-users` | Super Admin | — | List admin users |
| POST | `/admin-users/add` | Super Admin | — | Create admin user |
| POST | `/admin-users/update` | Super Admin | — | Update role |
| POST | `/admin-users/change-password` | Super Admin | — | Change password |
| POST | `/admin-users/delete` | Super Admin | — | Delete user |
| POST | `/customers?page=&limit=&search=&dateFrom=&dateTo=` | Admin | — | List customers (paginated) |
| POST | `/customer-orders` | Admin | — | Get customer's orders |

### Products (`/api/product`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/add` | Admin | Add product (with image upload) |
| POST | `/list` | Public | List products (with filters, pagination) |
| POST | `/remove` | Admin | Remove product |
| POST | `/single` | Public | Get single product |
| POST | `/update` | Admin | Update product |
| POST | `/add-review` | JWT | Add product review |

### Orders (`/api/order`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/place` | JWT | Place order (COD) |
| POST | `/userorders` | JWT | Get user's orders |
| POST | `/list` | Admin | List all orders |
| POST | `/status` | Admin | Update order status |
| POST | `/verify` | Public | Verify Razorpay payment |
| POST | `/admin-cancel` | Admin | Cancel order |
| POST | `/cancel` | JWT | Cancel order (user) |
| POST | `/request-return` | JWT | Request return |
| GET | `/new-orders?since=` | Admin | Poll for new orders |

### Other API Prefixes

| Prefix | Auth | Description |
|--------|------|-------------|
| `/api/cart` | JWT | Cart CRUD, guest sync, coupon |
| `/api/category` | Mixed | Category + sub-category CRUD, tree view |
| `/api/blog` | Mixed | Blog CRUD with image upload |
| `/api/blogs` | Mixed | Secondary blog routes |
| `/api/hero-banner` | Mixed | Hero carousel slides |
| `/api/showcase` | Mixed | Showcase banners (CRUD + toggle + reorder) |
| `/api/footer` | Mixed | Footer settings (singleton get/update) |
| `/api/contact` | Mixed | Contact form submit + list |
| `/api/coupons` | Mixed | Coupon CRUD, bulk generate, usage tracking |
| `/api/delivery` | Mixed | Delivery charge rules |
| `/api/search` | Public | Full-text search + suggestions |
| `/api/testimonials` | Mixed | Testimonials CRUD |
| `/api/projects` | Mixed | Projects CRUD |
| `/api/payment` | Mixed | Razorpay create/verify |
| `/api/orders` | JWT | User orders (my orders, detail, cancel) |
| `/api/dashboard` | Admin | Dashboard stats + sales analytics |

---

## 📊 Database Models (14+)

| Model | Collection | Key Fields |
|-------|-----------|------------|
| **userModel** | `users` | name, email, password (select:false), googleId, phone, avatar, addresses[], role (customer/admin/staff), isBlocked, loginAttempts, lockUntil, cartData, wishlist[], walletBalance, loyaltyPoints |
| **productModel** | `products` | name, description, price, originalPrice, image[], category, subCategory, inStock, stockCount, bestseller, isHot, isFeatured, keyFeatures[], specifications (Map), tags[], useCases[], warranty, reviews[], averageRating, views |
| **Order** | `orders` | orderNumber (auto `AE-YYYYMMDD-XXXX`), userId, items[], billing, payment (razorpay/cod), tracking, coupon, delivery, mrpTotal, subtotal, grandTotal, status (enum), statusHistory[], adminNote |
| **categoryModel** | `categories` | name, slug (auto), image, isActive, subCategories[] (embedded with name/slug/image) |
| **Cart** | `carts` | userId, items[], coupon, mergeItems method |
| **blogModel** | `blogs` | title, slug (auto), description, content (rich HTML), image, category, tags[], author, published, views, comments[] |
| **heroBannerModel** | `herobanners` | badge, title, titleAccent, subtitle, desc, cta, ctaLink, bg (gradient), accentColor, image, bgImage, order, isActive |
| **showcaseBannerModel** | `showcasebanners` | title, subtitle, cta, link, image (desktop 1400×440), imageMobile (600×800), overlay (gradient), order, isActive |
| **footerSettingsModel** | `footersettings` | Singleton: phones[], email, address, hours, social links (whatsapp/instagram/facebook/youtube), newsletter, trustBadges[], copyrightText |
| **contactModel** | `contacts` | name, email, phone, subject, message, status (new/read/replied) |
| **Coupon** | `coupons` | code, label, type (percent/flat), value, minOrderValue, maxDiscount, usageLimit, eligibility, validFrom, validTill, isActive |
| **DeliveryCharge** | `deliverycharges` | name, method (standard/express/same_day/pickup), freeAbove, charge, baseWeight, perKgExtra, estimatedDays, applicablePincodes[], priority, `computeCharge()` method |
| **Testimonial** | `testimonials` | name, text, rating, order, isActive |
| **Project** | `projects` | title, description, image, link, order, isActive |

---

## 🔐 Authentication & Authorization

### Customer Auth Flow

```
Login Page → POST /api/user/login → JWT { id } → stored in:
  - AuthContext (localStorage: amulya_token, amulya_user)
  - axios.defaults.headers.common['token'] (auto-attached)
  - Redux authSlice (for thunk-based operations)
```

### Admin Auth Flow

```
Admin Login → POST /api/user/admin → JWT { role, isAdmin, email } → stored in:
  - localStorage: 'token'
  - JWT decoded client-side for role-based sidebar visibility
```

### Middleware Chain

```
adminAuth          → Any admin panel user (super_admin, admin, staff)
superAdminAuth     → ONLY env-var super_admin (isAdmin: true)
staffOrAboveAuth   → super_admin, admin, OR staff
userAuth           → Any logged-in customer (JWT with userId)
auth               → Basic JWT verification (supports Bearer + token header)
```

### Security Features

- **Rate limiting**: 10 req/15min login, 5 req/hr password reset, 20/min profile update
- **Account lock-out**: 5 failed attempts → 15-minute lock
- **Strong passwords**: 8-128 chars, uppercase, lowercase, digit, special char
- **Helmet** security headers
- **CORS** whitelist (askpoint.online domains + localhost)
- **XSS protection** via xss-clean
- **HPP** (HTTP Parameter Pollution) protection
- **Input sanitization**: HTML tag stripping, email normalization
- **JWT with 7-day expiry**, `select: false` on sensitive fields

---

## 💳 Payment System

### Razorpay (Primary)

```
Customer Checkout → POST /api/payment/create-order (backend creates Razorpay order)
                 → Razorpay checkout modal (frontend)
                 → POST /api/order/verify (backend verifies HMAC signature)
                 → POST /api/order/place (creates order in DB)
```

### COD (Cash on Delivery)

```
Customer Checkout → POST /api/order/place (creates order directly)
                 → Order marked as payment.pending
                 → Admin marks as paid manually
```

---

## 🎯 Key Design Decisions

1. **3 independent Vite projects** — Each frontend has its own `package.json`, `vite.config.js`, and dependencies. Admin uses React 19, customer frontend uses React 19.

2. **ESM throughout** — All backend code uses ES modules (`import`/`export`). No CommonJS.

3. **Auth duality** — Two auth systems coexist: customer auth (JWT with `{ id }`) and admin auth (JWT with `{ role, isAdmin, email }`). Middleware checks different payload fields.

4. **Singleton footer settings** — `footerSettingsModel` uses singleton pattern — only one document ever. Updated via upsert logic.

5. **Graceful MongoDB fallback** — Server stays up even if MongoDB fails. Non-DB endpoints (like admin login checking env vars) still work. DB endpoints return 500.

6. **Rate limiting per-endpoint** — Limiters are created in `userController.js` and exported for routes.

7. **Auto-generated order numbers** — Via Mongoose `pre('save')` hook: `AE-YYYYMMDD-XXXX`.

8. **WebSocket real-time dashboard** — Socket.io pushes new order events to admin 'admin' room, plus 30s HTTP polling fallback.

9. **Site-wide banners** — `ProductShowcaseBanner_footer` renders on ALL pages (not just Home) with responsive desktop/mobile image support.

10. **Admin white theme** — All admin pages use white cards with subtle shadows, matching a clean TailAdmin-inspired design.

---

## 🧠 Knowledge Graph

The `graphify-out/` directory contains an auto-generated knowledge graph of the entire project:

| File | Description |
|------|-------------|
| `graph.json` | Raw graph data (105 nodes, 98 edges, 6 clusters) |
| `graph.html` | Interactive graph visualization (open in browser) |
| `GRAPH_REPORT.md` | Full audit report with community analysis, technical debt, recommendations |

### Key Findings

- **7 communities** identified: Auth & Security, Products, Cart & Orders, Customer Frontend, Content, Site Configuration, Admin Dashboard
- **Top god nodes**: Express API Server (22 connections), Admin App (17), Redux Store (11)
- **4 code smells**: Duplicate order models, duplicate blog controllers, CJS-in-ESM, broken import

---

## 🧹 Known Issues & Tech Debt

| Priority | Issue | Location | Impact |
|----------|-------|----------|--------|
| **HIGH** | Duplicate order model | `models/Order.js` vs `models/orderModel.js` | Possible schema conflicts |
| **HIGH** | Broken import in razorpayRoutes.js | Imports non-existent `authMiddleware.js` | Route cannot load |
| **HIGH** | Auth header inconsistency — 3 files use `Authorization: Bearer` while rest use `headers.token` | Admin: NewOrderAlert, HeroBannerAdmin, Customer360Drawer | Auth silently fails for these features |
| **MEDIUM** | CJS files in ESM project | `razorpayOrders.js`, `razorpayWebhook.js` | Unusable without conversion |
| **MEDIUM** | Duplicate blog controllers | `blogController.js` + `Blogcontroller1.js` | Maintenance overhead |
| **MEDIUM** | Hardcoded port 4000 fallback in 3 admin files | NewOrderAlert.jsx, HeroBannerAdmin.jsx, FooterEditor.jsx | Fails to reach backend if `VITE_BACKEND_URL` unset |
| **MEDIUM** | No route-level auth guards in admin — only sidebar UI hiding | All admin pages | Users can navigate to unauthorized URLs directly |
| **LOW** | Inline SVG icons duplicated across admin components | HeroBannerAdmin, FooterEditor, Sidebar, etc. | Code bloat, hard to maintain |
| **LOW** | Auth Context + Redux authSlice overlap | Both manage auth state | Potential sync issues |
| **LOW** | Legacy cartData in user model | `cartData: Object` in userModel | Dead field |
| **LOW** | Mixed state management (Context + Redux) | App uses both patterns | Can confuse new developers |

---

## 🤖 For AI Agents

### Common Code Patterns

**Backend controllers:**
```javascript
const someFunction = async (req, res) => {
    try {
        // ... logic ...
        res.json({ success: true, data })
    } catch (error) {
        console.error('[functionName]', error.message)
        res.status(500).json({ success: false, message: 'Human readable error' })
    }
}
```

**Backend routes:**
```javascript
router.post('/endpoint', middleware1, middleware2, controllerFunction)
```

**Admin frontend:**
```javascript
// Components receive token as prop, pass in headers
const MyPage = ({ token }) => {
  await axios.post(url, body, { headers: { token } })
}
```

**Customer frontend:**
```javascript
// Uses AuthContext for login state
const { user, isLoggedIn, login, logout } = useAuth()
// Token auto-attached via axios interceptor
```

### Quick Reference

```bash
cd backend && node server.js                    # API on :10000
cd amulyaelectronics && npx vite --port 5173    # Store on :5173
cd admin && npx vite --port 5174                # Admin on :5174
brew services start mongodb-community@7.0       # Local MongoDB
cd backend && node scripts/seed.js              # Seed DB
cd amulyaelectronics && npx vite build          # Build store
cd admin && npx vite build                      # Build admin
```

---

## 📄 License

Private commercial project — Amulya Electronics, Dharwad, Karnataka.
