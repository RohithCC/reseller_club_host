// routes/heroBannerRoute.js
import express from 'express'
import multer from 'multer'
import { randomUUID } from 'crypto'
import path from 'path'
import {
  getAllSlides,
  getAllSlidesAdmin,
  createSlide,
  updateSlide,
  deleteSlide,
  toggleSlide,
} from '../controllers/heroBannerController.js'
import { adminOrSuperAdminAuth } from '../middleware/adminAuth.js'

const heroBannerRouter = express.Router()

// ── Multer – local disk storage for hero banner uploads ───────────────────────
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `hero-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`)
  },
})
const upload = multer({ storage })
const heroUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'imageMobile', maxCount: 1 },
])

// ── Public — frontend Home page ───────────────────────────────────────────────
heroBannerRouter.get('/',             getAllSlides)

// ── Admin only ────────────────────────────────────────────────────────────────
heroBannerRouter.get('/admin',        adminOrSuperAdminAuth, getAllSlidesAdmin)
heroBannerRouter.post('/',            adminOrSuperAdminAuth, heroUpload, createSlide)
heroBannerRouter.put('/:id',          adminOrSuperAdminAuth, heroUpload, updateSlide)
heroBannerRouter.delete('/:id',       adminOrSuperAdminAuth, deleteSlide)
heroBannerRouter.patch('/:id/toggle', adminOrSuperAdminAuth, toggleSlide)

export default heroBannerRouter