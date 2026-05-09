import Testimonial from '../models/Testimonial.js';

// ── PUBLIC ────────────────────────────────────────────────────────────────────

// GET /api/testimonials
export const getAll = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: testimonials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/testimonials/admin/all
export const adminGetAll = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: testimonials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/testimonials/:id
export const getById = async (req, res) => {
  try {
    const item = await Testimonial.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/testimonials
export const create = async (req, res) => {
  try {
    const { name, role, text, rating, avatar, isActive, order } = req.body;
    if (!name || !role || !text) {
      return res.status(400).json({ success: false, message: "name, role and text are required" });
    }
    const item = await Testimonial.create({ name, role, text, rating, avatar, isActive, order });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/testimonials/:id
export const update = async (req, res) => {
  try {
    const item = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/testimonials/:id
export const remove = async (req, res) => {
  try {
    const item = await Testimonial.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};