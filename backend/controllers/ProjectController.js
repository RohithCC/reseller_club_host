import Project from "../models/Project.js";

// GET /api/projects  →  all active (public)
export const getAll = async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/projects/admin/all  →  all including inactive (admin)
export const adminGetAll = async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/projects/:id
export const getById = async (req, res) => {
  try {
    const item = await Project.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/projects  →  create
export const create = async (req, res) => {
  try {
    const { title, description, img, cat, date, link, isActive, order } = req.body;
    if (!title || !description || !cat || !date) {
      return res.status(400).json({
        success: false,
        message: "title, description, cat and date are required",
      });
    }
    const item = await Project.create({ title, description, img, cat, date, link, isActive, order });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/projects/:id  →  update
export const update = async (req, res) => {
  try {
    const item = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/projects/:id  →  hard delete
export const remove = async (req, res) => {
  try {
    const item = await Project.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};