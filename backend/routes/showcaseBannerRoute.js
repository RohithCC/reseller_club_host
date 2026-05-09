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
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  reorderBanners,
} from '../controllers/showcaseBannerController.js'
import { adminAuth } from '../middleware/adminAuth.js'

const showcaseBannerRouter = express.Router()

// ── Public (no auth) ──────────────────────────────────────────────────────────
showcaseBannerRouter.get('/banners', getActiveBanners)

// ── Admin (adminAuth required) ────────────────────────────────────────────────
showcaseBannerRouter.get   ('/admin/banners',            adminAuth, getAllBanners)
showcaseBannerRouter.post  ('/admin/banners',            adminAuth, createBanner)
showcaseBannerRouter.put   ('/admin/banners/:id',        adminAuth, updateBanner)
showcaseBannerRouter.delete('/admin/banners/:id',        adminAuth, deleteBanner)
showcaseBannerRouter.put   ('/admin/banners/:id/toggle', adminAuth, toggleBanner)
showcaseBannerRouter.put   ('/admin/reorder',            adminAuth, reorderBanners)

export default showcaseBannerRouter