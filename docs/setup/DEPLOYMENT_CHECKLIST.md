# 🚀 VPS Deployment Checklist — Amulya Electronics

> Everything you need to change **in the code** and **on the server** before deploying to a VPS.

---

## 📋 Overview

| Part | What gets deployed | How it runs |
|------|--------------------|-------------|
| **Backend API** | `backend/` source code | Node.js via PM2 on port 10000 |
| **Customer Storefront** | `amulyaelectronics/dist/` (built) | Served by Nginx on port 80/443 |
| **Admin Dashboard** | `admin/dist/` (built) | Served by Nginx on port 80/443 |

---

## 🔴 1. Code Changes Required (Must Do Before Uploading)

### 1.1 — Update CORS Origins in `backend/server.js`

**File:** `backend/server.js` (lines 64-70)

Currently has `askpoint.online` domains hardcoded. Add your actual VPS domain:

```javascript
const allowedOrigins = [
  "https://yourdomain.com",          // ← CHANGE this
  "https://www.yourdomain.com",      // ← CHANGE this
  "https://admin.yourdomain.com",    // ← CHANGE this
  "https://api.yourdomain.com",      // ← CHANGE this
  "http://localhost:5173",           // keep for dev
  "http://localhost:5174",           // keep for dev
]
```

> ⚠️ If you're using subdomain-based routing (e.g., `api.yourdomain.com` for backend, `admin.yourdomain.com` for admin), list ALL subdomains here.

### 1.2 — Enable Trust Proxy (for Nginx Reverse Proxy)

**File:** `backend/server.js` — add this line right after `const app = express()`:

```javascript
const app = express()
app.set('trust proxy', 1)   // ← ADD THIS — required for rate limiting + real IPs behind Nginx
const port = process.env.PORT || 10000
```

Without this, `express-rate-limit` will see all requests coming from `127.0.0.1` (Nginx's IP) and rate-limit incorrectly.

### 1.3 — Remove or Update Hardcoded Error Boundaries

**File:** `amulyaelectronics/src/App.jsx` and `amulyaelectronics/src/components/ErrorBoundary.jsx`

If there's an `<ErrorBoundary>` wrapper around the checkout route added during development:
1. Remove the `<ErrorBoundary>` wrapper from the checkout route in `App.jsx`
2. Delete the `ErrorBoundary.jsx` component file entirely — don't leave dead code

### 1.4 — Admin Backend URL Check

**File:** `admin/src/App.jsx` (line 27)

```javascript
export const backendUrl = import.meta.env.VITE_BACKEND_URL
```

✅ This reads from env var — set it to your production backend URL. No code change needed, just set the env var (see section 2).

### 1.5 — Verify `.gitignore` Excludes Uploads

**File:** `.gitignore`

```
backend/uploads/
```

✅ Already included — uploaded images won't be committed to git. They'll exist only on the VPS filesystem.

---

## 🟡 2. VPS Server Setup (Do Once)

### 2.1 — Install Node.js 20+

```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # v20.x
npm --version    # v10.x
```

### 2.2 — Install PM2 (Process Manager)

```bash
npm install -g pm2

# Make PM2 auto-start on server reboot
pm2 startup
# ^ Run the command that pm2 outputs — it will give you a specific command to copy/paste
```

### 2.3 — Install & Configure Nginx

```bash
sudo apt-get install nginx
```

Create Nginx config at `/etc/nginx/sites-available/yourdomain`:

```nginx
# ── Frontend: Customer Storefront ──
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/amulya/storefront/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ── Admin Dashboard ──
server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;

    root /var/www/amulya/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ── Backend API (reverse proxy to Node.js) ──
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    client_max_body_size 10M;   # Allow product image uploads up to 10MB

    location / {
        proxy_pass http://127.0.0.1:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded images with cache headers
    location /uploads/ {
        alias /var/www/amulya/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

> 🔑 **SSL Certificates with Let's Encrypt:**
> ```bash
> sudo apt-get install certbot python3-certbot-nginx
> sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
> sudo certbot --nginx -d admin.yourdomain.com
> sudo certbot --nginx -d api.yourdomain.com
> ```

### 2.4 — Set Up MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a **free M0 cluster**
3. Go to **Network Access** → **Add IP Address** → `0.0.0.0/0` (allow all) — or add your VPS IP only
4. Go to **Database Access** → create a database user with password
5. Click **Connect** → **Drivers** → copy the connection string

### 2.5 — Configure Firewall

```bash
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw allow 10000/tcp     # Backend API (optional — only if not proxied through Nginx)
sudo ufw enable
```

---

## 🟢 3. Environment Variables on VPS

### 3.1 — Backend `.env` (Production Values)

Create `backend/.env` on the VPS:

```env
# ── Database ──
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/amulya_electronics?retryWrites=true&w=majority

# ── Authentication ──
JWT_SECRET=<generate a NEW random 64-char string — don't reuse dev keys>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com

# ── Payments (LIVE keys — not test keys) ──
RAZORPAY_KEY_ID=rzp_live_xxxxxx
RAZORPAY_KEY_SECRET=<your-live-secret>
RAZORPAY_WEBHOOK_SECRET=<your-webhook-secret>

# ── Email ──
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=<gmail-app-password>

# ── App ──
FRONTEND_URL=https://yourdomain.com
PORT=10000
NODE_ENV=production
```

> ⚠️ **IMPORTANT:** 
> - Use **LIVE Razorpay keys** (`rzp_live_...`), not test keys (`rzp_test_...`)
> - Update Google OAuth to include your production domains
> - Use a **different JWT_SECRET** from development

### 3.2 — Storefront Build Env Vars

Before building the storefront, create or update `amulyaelectronics/.env`:

```env
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY=<your-key>
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxx
```

Then build:
```bash
cd amulyaelectronics && npm run build
```

### 3.3 — Admin Build Env Vars

Before building the admin panel, create or update `admin/.env`:

```env
VITE_BACKEND_URL=https://api.yourdomain.com
```

Then build:
```bash
cd admin && npm run build
```

---

## 🔵 4. Deployment Steps

### Step 1 — Upload Code to VPS

```bash
# Option A: Git clone
git clone <your-repo-url> /var/www/amulya

# Option B: SCP
scp -r /path/to/project user@your-vps:/var/www/amulya
```

### Step 2 — Install Dependencies

```bash
cd /var/www/amulya/backend && npm install --production
cd /var/www/amulya/amulyaelectronics && npm install
cd /var/www/amulya/admin && npm install
```

### Step 3 — Build Frontends

```bash
# Build storefront
cd /var/www/amulya/amulyaelectronics
npm run build

# Build admin
cd /var/www/amulya/admin
npm run build
```

### Step 4 — Start Backend with PM2

```bash
cd /var/www/amulya/backend
pm2 start server.js --name amulya-api --env production
pm2 save
```

### Step 5 — Set Up Nginx

Copy the Nginx config from section 2.3, then:

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain /etc/nginx/sites-enabled/
sudo nginx -t          # Test config
sudo systemctl reload nginx
```

### Step 6 — Configure SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d admin.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🟣 5. Google OAuth Update (Crucial)

Update your Google Cloud Console OAuth settings:

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
   - `https://admin.yourdomain.com`
5. (If testing) `http://localhost:5173` and `http://localhost:5174`

---

## 🟤 6. File Uploads — IMPORTANT Decision

**Current setup:** Multer saves images to `backend/uploads/` (local disk).

**On a VPS this works** as long as:
- The `uploads/` directory is on persistent storage (not an ephemeral filesystem)
- You back up the uploads directory regularly

**But if you ever redeploy/restart the server from scratch, uploads are lost.**

### Option A: Keep Local Storage (Simpler)
```bash
# Create uploads directory manually if needed
mkdir -p /var/www/amulya/backend/uploads
mkdir -p /var/www/amulya/backend/uploads/avatars
mkdir -p /var/www/amulya/backend/uploads/editor-images
```

### Option B: Migrate to Cloudinary (Recommended for Production)
If you want images to survive redeploys, switch to Cloudinary:
1. Create a free Cloudinary account
2. Install: `npm install cloudinary multer-storage-cloudinary`
3. Update `backend/middleware/multer.js` to use Cloudinary storage
4. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to backend `.env`
5. All existing images in `uploads/` would need to be migrated

---

## 🟠 7. Razorpay Webhook Setup

For Razorpay webhooks to work (order status auto-updates):

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com/) → **Settings** → **Webhooks**
2. Add webhook URL: `https://api.yourdomain.com/api/payment/webhook`
3. Select events: `payment.captured`, `order.paid`
4. Copy the webhook secret → set as `RAZORPAY_WEBHOOK_SECRET`

---

## ⚪ 8. Post-Deployment Verification

### Checklist

- [ ] **Backend:** Visit `https://api.yourdomain.com/` — should show `API Working ✅`
- [ ] **Storefront:** Visit `https://yourdomain.com/` — site loads, images display
- [ ] **Admin:** Visit `https://admin.yourdomain.com/` — login page loads
- [ ] **Login:** Can log in with admin credentials
- [ ] **Products:** Products load from database
- [ ] **Images:** Product images load (check `/uploads/` path)
- [ ] **Cart:** Add item to cart, proceed to checkout
- [ ] **Payments:** Razorpay checkout modal opens
- [ ] **Orders:** Order history loads in account
- [ ] **WebSocket:** Admin dashboard shows real-time orders (check browser console for WS connection)
- [ ] **HTTPS:** All pages redirect to HTTPS
- [ ] **Console:** No CORS errors in browser console
- [ ] **Mobile:** Site works on mobile viewport

### Common Post-Deployment Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Blank white page | Frontend env vars not set before build | Rebuild frontend with correct `VITE_BACKEND_URL` |
| CORS errors in console | Backend CORS origins don't include your domain | Update `allowedOrigins` in `server.js` |
| Images not loading | `uploads/` directory doesn't exist or wrong path | Create directories, check Nginx `alias` path |
| WebSocket not connecting | Nginx missing `Upgrade` headers | Check Nginx config has `proxy_set_header Upgrade $http_upgrade;` |
| Login fails / "Not Authorized" | `JWT_SECRET` mismatch or not set | Verify `JWT_SECRET` in backend `.env` |
| "MongooseError: URI missing" | `MONGODB_URI` not set in production env | Set `MONGODB_URI` in backend `.env` |
| Razorpay checkout doesn't open | Test keys used on production domain or missing | Use `rzp_live_` keys, check `VITE_RAZORPAY_KEY_ID` |
| Emails not sending | Gmail App Password wrong or 2FA not enabled | Regenerate App Password, verify `EMAIL_PASS` |
| 502 Bad Gateway | Backend process crashed | Check `pm2 status`, `pm2 logs amulya-api` |
| 413 Request Entity Too Large | Nginx default upload limit (1MB) too small | Add `client_max_body_size 10M;` to Nginx config |

---

## ⚡ Quick Reference: PM2 Commands

```bash
pm2 start server.js --name amulya-api          # Start
pm2 restart amulya-api                          # Restart
pm2 stop amulya-api                             # Stop
pm2 logs amulya-api                             # View logs
pm2 status                                      # List all processes
pm2 startup                                     # Auto-start on boot
pm2 save                                        # Save process list
pm2 monit                                       # Resource monitor
```

---

## 📁 File Structure on VPS

```
/var/www/amulya/
├── backend/                    # Source code + running server
│   ├── server.js
│   ├── .env                    # Production env vars
│   ├── uploads/                # User-uploaded images (persistent)
│   │   ├── avatars/
│   │   └── editor-images/
│   └── ...
├── amulyaelectronics/
│   └── dist/                   # Built storefront (served by Nginx)
├── admin/
│   └── dist/                   # Built admin panel (served by Nginx)
└── docs/
    └── setup/
        ├── SETUP_GUIDE.md
        ├── DEPLOYMENT_CHECKLIST.md
        ├── backend.env.example
        ├── storefront.env.example
        └── admin.env.example
```
