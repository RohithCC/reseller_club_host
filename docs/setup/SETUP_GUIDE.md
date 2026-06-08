# ⚡ Amulya Electronics — Environment Setup Guide

> Complete software and environment setup guide for the Amulya Electronics e-commerce platform.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Project Overview](#-project-overview)
- [Environment Variables](#-environment-variables)
- [Step 1: Install Software](#-step-1-install-software)
- [Step 2: Set Up MongoDB](#-step-2-set-up-mongodb)
- [Step 3: Configure Environment Files](#-step-3-configure-environment-files)
- [Step 4: Install Dependencies](#-step-4-install-dependencies)
- [Step 5: Start the Project](#-step-5-start-the-project)
- [Step 6: Seed the Database (Optional)](#-step-6-seed-the-database-optional)
- [Access Points](#-access-points)
- [Common Issues & Fixes](#-common-issues--fixes)
- [Quick Reference Commands](#-quick-reference-commands)

---

## 🛠 Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | v18+ (v20+ recommended) | JavaScript runtime |
| **npm** | v9+ (comes with Node.js) | Package manager |
| **MongoDB** | v7.0+ | Database |
| **Git** | Any recent version | Version control |
| **Code Editor** | VS Code (recommended) | Development |

---

## 🏗 Project Overview

This project has **3 independent parts** that all run simultaneously:

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

| Part | Directory | Port | Description |
|------|-----------|------|-------------|
| **Backend API** | `backend/` | 10000 | Express REST API + Socket.io |
| **Customer Storefront** | `amulyaelectronics/` | 5173 | Public e-commerce website |
| **Admin Dashboard** | `admin/` | 5174 | Store management panel |

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

Create `backend/.env` with these variables (see `backend.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ Yes | — | MongoDB connection string (e.g. `mongodb://127.0.0.1:27017/amulya`) |
| `JWT_SECRET` | ✅ Yes | — | Secret key for JWT token signing (use a random 64-char string) |
| `ADMIN_EMAIL` | ✅ Yes | — | Super admin login email |
| `ADMIN_PASSWORD` | ✅ Yes | — | Super admin login password |
| `GOOGLE_CLIENT_ID` | ✅ Yes | — | Google OAuth 2.0 Client ID (for Google login) |
| `RAZORPAY_KEY_ID` | Optional | — | Razorpay API Key ID (for payments) |
| `RAZORPAY_KEY_SECRET` | Optional | — | Razorpay API Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | — | Razorpay webhook secret |
| `EMAIL_USER` | Optional | — | Gmail address for sending transactional emails |
| `EMAIL_PASS` | Optional | — | Gmail App Password (not your regular password) |
| `FRONTEND_URL` | Optional | `http://localhost:5173` | Frontend URL for email links |
| `PORT` | Optional | `10000` | Backend server port |
| `NODE_ENV` | Optional | `development` | Environment (`development` / `production`) |

### Customer Storefront (`amulyaelectronics/.env`)

Create `amulyaelectronics/.env` with these variables (see `storefront.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BACKEND_URL` | ✅ Yes | `http://localhost:10000` | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Optional | — | Google OAuth Client ID (same as backend GOOGLE_CLIENT_ID) |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | — | Google Maps API key (for checkout location picker) |
| `VITE_RAZORPAY_KEY_ID` | Optional | — | Razorpay Key ID (same as backend RAZORPAY_KEY_ID) |

### Admin Dashboard (`admin/.env`)

Create `admin/.env` with these variables (see `admin.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BACKEND_URL` | ✅ Yes | `http://localhost:10000` | Backend API base URL |

---

## 📥 Step 1: Install Software

### 1.1 — Install Node.js

**Option A — Download from website:**
- Go to [nodejs.org](https://nodejs.org/)
- Download the **LTS** version (v20+)
- Run the installer

**Option B — Using Homebrew (macOS):**
```bash
brew install node
```

**Verify installation:**
```bash
node --version   # Should show v18+ or v20+
npm --version    # Should show v9+
```

### 1.2 — Install MongoDB

**Option A — Local via Homebrew (macOS):**
```bash
# Tap the MongoDB formula
brew tap mongodb/brew

# Install MongoDB 7.0
brew install mongodb-community@7.0

# Start MongoDB
brew services start mongodb-community@7.0

# Verify it's running
brew services list | grep mongodb
```

**Option B — MongoDB Atlas (cloud, no local install):**
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a **free M0 cluster**
4. Click **Connect** → **Drivers**
5. Copy the connection string (looks like `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/amulya`)
6. Use this as your `MONGODB_URI`

**Option C — Windows:**
- Download from [mongodb.com](https://www.mongodb.com/try/download/community)
- Run the installer (select "Complete" setup)
- Run MongoDB as a service

### 1.3 — Configure Google OAuth (for Google Login)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins: `http://localhost:5173`
7. Copy the **Client ID** → set as `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (storefront)

### 1.4 — Configure Google Maps API (Optional)

1. In the same Google Cloud project, go to **APIs & Services** → **Library**
2. Search for **Maps JavaScript API** → Enable it
3. Search for **Places API** → Enable it
4. Go to **Credentials** → create an **API Key**
5. Copy the key → set as `VITE_GOOGLE_MAPS_API_KEY`

### 1.5 — Configure Razorpay (Optional, for payments)

1. Go to [razorpay.com](https://razorpay.com/)
2. Create an account
3. Go to **Settings** → **API Keys**
4. Generate **Key ID** and **Key Secret**
5. Set as `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (backend) and `VITE_RAZORPAY_KEY_ID` (storefront)

### 1.6 — Configure Gmail App Password (Optional, for emails)

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Go to **App Passwords** (search in Google Account)
4. Select **Mail** + your device
5. Copy the 16-character password
6. Set as `EMAIL_PASS` (backend, with `EMAIL_USER` as your Gmail address)

---

## 📝 Step 2: Set Up MongoDB

### Local MongoDB (Homebrew)

```bash
# Start MongoDB
brew services start mongodb-community@7.0

# Verify
mongosh --eval "db.version()"
# Should show: 7.x

# Create the database (it's created automatically on first connection)
# The app uses 'amulya_electronics' by default
```

### Connection String

Update `backend/.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/amulya_electronics
```

> **Important:** Use `127.0.0.1` not `localhost` — MongoDB 7+ on macOS sometimes has issues with `localhost` resolution.

---

## 🔧 Step 3: Configure Environment Files

### 3.1 — Backend `.env`

Copy the example file:

```bash
cp docs/setup/backend.env.example backend/.env
```

Edit `backend/.env` and fill in your values:

```env
# ── Database ──
MONGODB_URI=mongodb://127.0.0.1:27017/amulya_electronics

# ── Authentication ──
JWT_SECRET=your-random-64-character-secret-string-here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com

# ── Payments (optional — leave blank if not using) ──
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# ── Email (optional — leave blank if not using) ──
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your-16-char-app-password

# ── App ──
FRONTEND_URL=http://localhost:5173
PORT=10000
NODE_ENV=development
```

### 3.2 — Storefront `.env`

Copy the example file:

```bash
cp docs/setup/storefront.env.example amulyaelectronics/.env
```

Edit `amulyaelectronics/.env`:

```env
VITE_BACKEND_URL=http://localhost:10000
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxx
```

### 3.3 — Admin `.env`

Copy the example file:

```bash
cp docs/setup/admin.env.example admin/.env
```

Edit `admin/.env`:

```env
VITE_BACKEND_URL=http://localhost:10000
```

---

## 📦 Step 4: Install Dependencies

Run these commands in **separate terminals** or one after the other:

```bash
# From the project root directory (/Users/surajachari/Test/code)

# 1. Backend dependencies
cd backend
npm install

# 2. Storefront dependencies
cd ../amulyaelectronics
npm install

# 3. Admin dependencies
cd ../admin
npm install

# Return to root
cd ..
```

> ⏱ This may take 1–3 minutes per project.

---

## 🚀 Step 5: Start the Project

You need **4 terminal windows** open simultaneously:

### Terminal 1 — MongoDB
```bash
brew services start mongodb-community@7.0
```
(Keep this running in the background)

### Terminal 2 — Backend API (Port 10000)
```bash
cd /Users/surajachari/Test/code/backend
npm run dev
```
Expected output: `Server started on PORT: 10000`

### Terminal 3 — Customer Storefront (Port 5173)
```bash
cd /Users/surajachari/Test/code/amulyaelectronics
npx vite --port 5173 --host
```
Expected output: `http://localhost:5173`

### Terminal 4 — Admin Dashboard (Port 5174)
```bash
cd /Users/surajachari/Test/code/admin
npx vite --port 5174 --host
```
Expected output: `http://localhost:5174`

---

## 🌱 Step 6: Seed the Database (Optional)

Populate the database with sample products, categories, and admin user:

```bash
cd /Users/surajachari/Test/code/backend
node scripts/seed.js
```

This creates:
- Sample categories and products
- A blog post
- SEO settings
- Admin user (based on your `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

---

## 🌐 Access Points

| App | URL | Default Credentials |
|-----|-----|---------------------|
| **Customer Storefront** | [http://localhost:5173](http://localhost:5173) | Register a new account |
| **Admin Dashboard** | [http://localhost:5174](http://localhost:5174) | `admin@example.com` / `Admin@123` (or your `ADMIN_EMAIL` / `ADMIN_PASSWORD`) |
| **Backend API** | [http://localhost:10000](http://localhost:10000) | — (returns `API Working ✅`) |

---

## ❗ Common Issues & Fixes

### MongoDB won't start
```bash
# Check if MongoDB process is running
brew services list | grep mongodb

# If stopped, try starting manually
mongod --dbpath /usr/local/var/mongodb

# Check logs
cat /usr/local/var/log/mongodb/mongo.log | tail -20
```

### Backend crashes with "MongooseError: URI missing"
→ You forgot to set `MONGODB_URI` in `backend/.env`

### Blank page on storefront / checkout
→ Open browser console (F12) — likely one of:
- Missing `VITE_GOOGLE_CLIENT_ID` in `amulyaelectronics/.env` (app now shows a warning instead of crashing)
- Backend not running on port 10000

### "EADDRINUSE" error on port 10000
```bash
# Find what's using port 10000
lsof -i :10000

# Kill the process
kill -9 <PID>
```

### "CORS blocked" error
→ Ensure backend is running on port 10000 and storefront/admin are on ports 5173/5174

### Razorpay checkout doesn't open
→ Check `VITE_RAZORPAY_KEY_ID` in storefront `.env` and `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in backend `.env`

### Emails not sending
→ Ensure `EMAIL_USER` and `EMAIL_PASS` (App Password) are set correctly in backend `.env`

---

## ⚡ Quick Reference Commands

```bash
# ── Start all services (4 separate terminals) ──

# Terminal 1: MongoDB
brew services start mongodb-community@7.0

# Terminal 2: Backend
cd /Users/surajachari/Test/code/backend && npm run dev

# Terminal 3: Storefront
cd /Users/surajachari/Test/code/amulyaelectronics && npx vite --port 5173 --host

# Terminal 4: Admin
cd /Users/surajachari/Test/code/admin && npx vite --port 5174 --host

# ── Build for production ──
cd /Users/surajachari/Test/code/amulyaelectronics && npm run build
cd /Users/surajachari/Test/code/admin && npm run build

# ── Seed database ──
cd /Users/surajachari/Test/code/backend && node scripts/seed.js

# ── Check MongoDB status ──
brew services list | grep mongodb
```
