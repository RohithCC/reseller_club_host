// controllers/searchController.js
// ─────────────────────────────────────────────────────────────────────────────
// Routes (wired in searchRoute.js → mounted at /api/search in server.js):
//
//  GET /api/search?q=&category=&page=&limit=   → searchProducts
//  GET /api/search/suggestions?q=              → getSearchSuggestions
//  GET /api/search/categories                  → getCategories
//
// All routes are PUBLIC — no auth required.
// ─────────────────────────────────────────────────────────────────────────────

import productModel from '../models/productModel.js'

// ─── GET /api/search ──────────────────────────────────────────────────────────
// Query params:
//   q        — search string (searches name, description, category, subcat)
//   category — filter by exact category (optional)
//   page     — pagination page (default 1)
//   limit    — results per page (default 12, max 48)
const searchProducts = async (req, res) => {
  try {
    const {
      q        = '',
      category = '',
      page     = 1,
      limit    = 12,
    } = req.query

    const safeLimit = Math.min(Number(limit), 48)
    const safePage  = Math.max(Number(page), 1)
    const skip      = (safePage - 1) * safeLimit

    // Build MongoDB query
    const query = {}

    // Text search across name, description, category, subcat
    if (q.trim()) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      query.$or = [
        { name:        { $regex: regex } },
        { description: { $regex: regex } },
        { category:    { $regex: regex } },
        { subcat:      { $regex: regex } },
        { tags:        { $regex: regex } },
      ]
    }

    // Category filter
    if (category.trim()) {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') }
    }

    // Only show available / in-stock products
    // Adjust field name to match your productModel schema
    // (common names: available, inStock, isAvailable, status)
    // We use a safe fallback — if the field doesn't exist, don't filter
    // query.available = true   ← uncomment if your schema has this field

    const [products, total] = await Promise.all([
      productModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select('name price salePrice mrp image category subcat description available inStock')
        .lean(),
      productModel.countDocuments(query),
    ])

    // Normalize image field — your products may store image as array
    const normalized = products.map((p) => ({
      ...p,
      image: Array.isArray(p.image) ? p.image[0] : (p.image || ''),
    }))

    res.json({
      success:  true,
      products: normalized,
      total,
      page:       safePage,
      limit:      safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      query:      q,
      category,
    })
  } catch (error) {
    console.error('searchProducts:', error)
    res.json({ success: false, message: error.message, products: [], total: 0 })
  }
}

// ─── GET /api/search/suggestions ─────────────────────────────────────────────
// Returns up to 8 fast name-only suggestions for the live search typeahead.
const getSearchSuggestions = async (req, res) => {
  try {
    const { q = '' } = req.query

    if (!q.trim() || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] })
    }

    const regex   = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const products = await productModel
      .find({ name: { $regex: regex } })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('name category image price salePrice')
      .lean()

    const suggestions = products.map((p) => ({
      _id:      p._id,
      name:     p.name,
      category: p.category,
      price:    p.salePrice ?? p.price ?? 0,
      image:    Array.isArray(p.image) ? p.image[0] : (p.image || ''),
    }))

    res.json({ success: true, suggestions })
  } catch (error) {
    console.error('getSearchSuggestions:', error)
    res.json({ success: false, suggestions: [] })
  }
}

// ─── GET /api/search/categories ───────────────────────────────────────────────
// Returns distinct categories from the products collection with counts.
// Used to populate the category filter in the search modal.
const getCategories = async (req, res) => {
  try {
    const categories = await productModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null, $ne: '' } } },
      { $sort:  { count: -1 } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ])

    res.json({ success: true, categories })
  } catch (error) {
    console.error('getCategories:', error)
    res.json({ success: false, categories: [] })
  }
}

export { searchProducts, getSearchSuggestions, getCategories }