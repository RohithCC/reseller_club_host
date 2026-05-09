// controllers/heroBannerController.js
import heroBannerModel from '../models/heroBannerModel.js'

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
// Body: { badge, title, titleAccent, subtitle, desc, cta, ctaLink,
//         bg, accentColor, image, bgImage, order, isActive }
const createSlide = async (req, res) => {
  try {
    const {
      badge, title, titleAccent, subtitle, desc,
      cta, ctaLink, bg, accentColor,
      image,    // foreground product image — required
      bgImage,  // background image URL      — optional
      order, isActive,
    } = req.body

    // Only hard-required fields are validated
    if (!badge || !title || !titleAccent || !cta || !ctaLink || !bg || !accentColor || !image)
      return res.json({ success: false, message: 'All required fields must be filled.' })

    const slide = await heroBannerModel.create({
      badge, title, titleAccent,
      subtitle: subtitle ?? '',
      desc:     desc     ?? '',
      cta, ctaLink, bg, accentColor,
      image,
      bgImage:  bgImage  ?? '',   // ← stored (empty string if not provided)
      order:    order    ?? 0,
      isActive: isActive ?? true,
    })

    res.json({ success: true, slide, message: 'Slide created successfully.' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── UPDATE SLIDE ─────────────────────────────────────────────────────────────
// PUT /api/hero-banner/:id
// Accepts any subset of fields — including bgImage
const updateSlide = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body   // bgImage included automatically via $set spread

    const slide = await heroBannerModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )

    if (!slide)
      return res.json({ success: false, message: 'Slide not found.' })

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