// controllers/heroBannerController.js
import heroBannerModel from '../models/heroBannerModel.js'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS   = path.join(__dirname, '..', 'uploads')

const deleteFile = (filePath) => {
  if (!filePath || filePath.startsWith('http')) return
  const full = path.join(UPLOADS, path.basename(filePath))
  if (fs.existsSync(full)) fs.unlinkSync(full)
}

// ─── GET ALL SLIDES (public) ──────────────────────────────────────────────────
// GET /api/hero-banner
// Returns only active slides sorted by order
const getAllSlides = async (req, res) => {
  try {
    const slides = await heroBannerModel
      .find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
    res.json({ success: true, slides })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── GET ALL SLIDES ADMIN (includes inactive) ─────────────────────────────────
// GET /api/hero-banner/admin
const getAllSlidesAdmin = async (req, res) => {
  try {
    const slides = await heroBannerModel.find().sort({ order: 1, createdAt: 1 })
    res.json({ success: true, slides })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── CREATE SLIDE ─────────────────────────────────────────────────────────────
// POST /api/hero-banner
// Body: { image, imageMobile, link, title, isActive } plus optional legacy fields
const createSlide = async (req, res) => {
  try {
    const { title, link, image, imageMobile, badge, titleAccent, subtitle, desc,
      cta, ctaLink, bg, accentColor, bgImage, order, isActive } = req.body

    // Handle uploaded files — file path takes priority over text field
    let imagePath = image?.trim() || ''
    let mobilePath = imageMobile?.trim() || ''
    if (req.files) {
      if (req.files.image && req.files.image[0]) imagePath = '/uploads/' + req.files.image[0].filename
      if (req.files.imageMobile && req.files.imageMobile[0]) mobilePath = '/uploads/' + req.files.imageMobile[0].filename
    }

    if (!imagePath) return res.json({ success: false, message: 'Desktop banner image is required.' })

    const slide = await heroBannerModel.create({
      title:       title?.trim()       || 'Hero Slide',
      link:        link?.trim()        || '/collection',
      image:       imagePath,
      imageMobile: mobilePath,
      badge:       badge?.trim()       || '',
      titleAccent: titleAccent?.trim() || '',
      subtitle:    subtitle?.trim()    || '',
      desc:        desc?.trim()        || '',
      cta:         cta?.trim()         || 'Shop Now',
      ctaLink:     ctaLink?.trim()     || link?.trim() || '/collection',
      bg:          bg?.trim()          || 'from-blue-800 via-blue-700 to-blue-900',
      accentColor: accentColor?.trim() || 'text-yellow-300',
      bgImage:     bgImage?.trim()     || '',
      order:       order !== undefined ? Number(order) : 0,
      isActive:    isActive !== undefined ? Boolean(isActive) : true,
    })

    res.json({ success: true, slide, message: 'Slide created successfully.' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── UPDATE SLIDE ─────────────────────────────────────────────────────────────
// PUT /api/hero-banner/:id
// Accepts any subset of fields — handles file uploads for image + imageMobile
const updateSlide = async (req, res) => {
  try {
    const { id } = req.params
    const { image, imageMobile } = req.body

    // Handle uploaded files — file path takes priority
    let imagePath = image?.trim()
    let mobilePath = imageMobile?.trim()
    if (req.files) {
      if (req.files.image && req.files.image[0]) imagePath = '/uploads/' + req.files.image[0].filename
      if (req.files.imageMobile && req.files.imageMobile[0]) mobilePath = '/uploads/' + req.files.imageMobile[0].filename
    }

    const updates = { ...req.body }
    if (imagePath !== undefined) updates.image = imagePath
    if (mobilePath !== undefined) updates.imageMobile = mobilePath

    const slide = await heroBannerModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )

    if (!slide) return res.json({ success: false, message: 'Slide not found.' })
    res.json({ success: true, slide, message: 'Slide updated successfully.' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── DELETE SLIDE ─────────────────────────────────────────────────────────────
// DELETE /api/hero-banner/:id
const deleteSlide = async (req, res) => {
  try {
    const { id } = req.params
    const slide = await heroBannerModel.findByIdAndDelete(id)
    if (!slide)
      return res.json({ success: false, message: 'Slide not found.' })
    deleteFile(slide.image)
    deleteFile(slide.imageMobile)
    res.json({ success: true, message: 'Slide deleted.' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────────
// PATCH /api/hero-banner/:id/toggle
const toggleSlide = async (req, res) => {
  try {
    const { id } = req.params
    const slide = await heroBannerModel.findById(id)
    if (!slide)
      return res.json({ success: false, message: 'Slide not found.' })

    slide.isActive = !slide.isActive
    await slide.save()
    res.json({
      success: true,
      isActive: slide.isActive,
      message: `Slide ${slide.isActive ? 'activated' : 'deactivated'}.`,
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { getAllSlides, getAllSlidesAdmin, createSlide, updateSlide, deleteSlide, toggleSlide }