// routes/heroBannerRoute.js
import express from 'express'
import {
  getAllSlides,
  getAllSlidesAdmin,
  createSlide,
  updateSlide,
  deleteSlide,
  toggleSlide,
} from '../controllers/heroBannerController.js'
import { adminAuth } from '../middleware/adminAuth.js'

const heroBannerRouter = express.Router()

// ── Public — frontend Home page ───────────────────────────────────────────────
heroBannerRouter.get('/',             getAllSlides)

// ── Admin only ────────────────────────────────────────────────────────────────
heroBannerRouter.get('/admin',        adminAuth, getAllSlidesAdmin)
heroBannerRouter.post('/',            adminAuth, createSlide)
heroBannerRouter.put('/:id',          adminAuth, updateSlide)
heroBannerRouter.delete('/:id',       adminAuth, deleteSlide)
heroBannerRouter.patch('/:id/toggle', adminAuth, toggleSlide)

export default heroBannerRouter