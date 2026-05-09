// controllers/showcaseBannerController.js
// ─────────────────────────────────────────────────────────────────────────────
// All 7 controller functions for the showcase banner API.
// Uses showcaseBannerModel (MongoDB via Mongoose).
// ─────────────────────────────────────────────────────────────────────────────

import showcaseBannerModel from '../models/showcaseBannerModel.js'

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

// GET /api/showcase/banners
// Returns only isActive:true banners sorted by order asc
// Called by the frontend ProductShowcaseBanner component on page load
const getActiveBanners = async (req, res) => {
  try {
    const banners = await showcaseBannerModel
      .find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean()

    res.json({ success: true, banners })
  } catch (error) {
    console.error('getActiveBanners:', error)
    res.json({ success: false, message: error.message })
  }
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/showcase/admin/banners
// Returns ALL banners including hidden ones — for admin management UI
const getAllBanners = async (req, res) => {
  try {
    const banners = await showcaseBannerModel
      .find({})
      .sort({ order: 1, createdAt: 1 })
      .lean()

    res.json({ success: true, banners })
  } catch (error) {
    console.error('getAllBanners:', error)
    res.json({ success: false, message: error.message })
  }
}

// POST /api/showcase/admin/banners
// Body: { title, subtitle, cta, link, image, overlay, order, isActive }
const createBanner = async (req, res) => {
  try {
    const { title, subtitle, cta, link, image, overlay, order, isActive } = req.body

    if (!title?.trim() || !subtitle?.trim() || !link?.trim() || !image?.trim()) {
      return res.json({ success: false, message: 'title, subtitle, link and image are required.' })
    }

    // Auto-assign order to end of list if not provided
    const lastBanner = await showcaseBannerModel
      .findOne({})
      .sort({ order: -1 })
      .select('order')
      .lean()

    const banner = new showcaseBannerModel({
      title:    title.trim(),
      subtitle: subtitle.trim(),
      cta:      (cta || 'Shop Now').trim(),
      link:     link.trim(),
      image:    image.trim(),
      overlay:  (overlay || 'from-slate-900/85 via-slate-900/50 to-transparent').trim(),
      order:    order !== undefined ? Number(order) : (lastBanner?.order ?? 0) + 1,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    })

    await banner.save()
    res.json({ success: true, message: 'Banner created', banner })
  } catch (error) {
    console.error('createBanner:', error)
    res.json({ success: false, message: error.message })
  }
}

// PUT /api/showcase/admin/banners/:id
// Body: any subset of banner fields — only provided fields are updated
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params
    const { title, subtitle, cta, link, image, overlay, order, isActive } = req.body

    const updates = {}
    if (title    !== undefined) updates.title    = title.trim()
    if (subtitle !== undefined) updates.subtitle = subtitle.trim()
    if (cta      !== undefined) updates.cta      = cta.trim()
    if (link     !== undefined) updates.link     = link.trim()
    if (image    !== undefined) updates.image    = image.trim()
    if (overlay  !== undefined) updates.overlay  = overlay.trim()
    if (order    !== undefined) updates.order    = Number(order)
    if (isActive !== undefined) updates.isActive = Boolean(isActive)

    const banner = await showcaseBannerModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )

    if (!banner) return res.json({ success: false, message: 'Banner not found' })
    res.json({ success: true, message: 'Banner updated', banner })
  } catch (error) {
    console.error('updateBanner:', error)
    res.json({ success: false, message: error.message })
  }
}

// DELETE /api/showcase/admin/banners/:id
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params
    const banner = await showcaseBannerModel.findByIdAndDelete(id)
    if (!banner) return res.json({ success: false, message: 'Banner not found' })
    res.json({ success: true, message: 'Banner deleted' })
  } catch (error) {
    console.error('deleteBanner:', error)
    res.json({ success: false, message: error.message })
  }
}

// PUT /api/showcase/admin/banners/:id/toggle
// Flips isActive without touching any other field
const toggleBanner = async (req, res) => {
  try {
    const { id } = req.params
    const banner = await showcaseBannerModel.findById(id)
    if (!banner) return res.json({ success: false, message: 'Banner not found' })

    banner.isActive = !banner.isActive
    await banner.save()

    res.json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'}`,
      banner,
    })
  } catch (error) {
    console.error('toggleBanner:', error)
    res.json({ success: false, message: error.message })
  }
}

// PUT /api/showcase/admin/reorder
// Body: { ids: ["mongoId1", "mongoId2", ...] }
// Sets each banner's order = its index in the array
const reorderBanners = async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({ success: false, message: 'ids array is required' })
    }

    await Promise.all(
      ids.map((id, idx) =>
        showcaseBannerModel.findByIdAndUpdate(id, { order: idx })
      )
    )

    res.json({ success: true, message: 'Banner order saved' })
  } catch (error) {
    console.error('reorderBanners:', error)
    res.json({ success: false, message: error.message })
  }
}

export {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  reorderBanners,
}