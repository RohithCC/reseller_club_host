// routes/showcaseBannerRoute.js
// ─────────────────────────────────────────────────────────────────────────────
// ✅ Mount in server.js:
//   import showcaseBannerRouter from './routes/showcaseBannerRoute.js'
//   app.use('/api/showcase', showcaseBannerRouter)
//
// This creates these endpoints:
//   GET    /api/showcase/banners                    → getActiveBanners  (public)
//   GET    /api/showcase/admin/banners              → getAllBanners      (admin)
//   POST   /api/showcase/admin/banners              → createBanner       (admin)
//   PUT    /api/showcase/admin/banners/:id          → updateBanner       (admin)
//   DELETE /api/showcase/admin/banners/:id          → deleteBanner       (admin)
//   PUT    /api/showcase/admin/banners/:id/toggle   → toggleBanner       (admin)
//   PUT    /api/showcase/admin/reorder              → reorderBanners     (admin)
//
// adminAuth reads req.headers.token — same middleware as orders/products/footer
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express'
import multer from 'multer'
import { randomUUID } from 'crypto'
import path from 'path'
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  reorderBanners,
} from '../controllers/showcaseBannerController.js'
import { adminOrSuperAdminAuth } from '../middleware/adminAuth.js'

const showcaseBannerRouter = express.Router()

// ── Multer – local disk storage for banner uploads ───────────────────────────
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `banner-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`)
  },
})
const upload = multer({ storage })
const bannerUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'imageMobile', maxCount: 1 },
])

// ── Public (no auth) ──────────────────────────────────────────────────────────
showcaseBannerRouter.get('/banners', getActiveBanners)

// ── Admin (adminAuth required) ────────────────────────────────────────────────
showcaseBannerRouter.get   ('/admin/banners',            adminOrSuperAdminAuth, getAllBanners)
showcaseBannerRouter.post  ('/admin/banners',            adminOrSuperAdminAuth, bannerUpload, createBanner)
showcaseBannerRouter.put   ('/admin/banners/:id',        adminOrSuperAdminAuth, bannerUpload, updateBanner)
showcaseBannerRouter.delete('/admin/banners/:id',        adminOrSuperAdminAuth, deleteBanner)
showcaseBannerRouter.put   ('/admin/banners/:id/toggle', adminOrSuperAdminAuth, toggleBanner)
showcaseBannerRouter.put   ('/admin/reorder',            adminOrSuperAdminAuth, reorderBanners)

export default showcaseBannerRouter