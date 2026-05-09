import BlogPost from "../models/Blogpost.js";

// GET /api/blogs  →  all active posts (sorted by order)
const getAll = async (req, res) => {
  try {
    const posts = await BlogPost.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/blogs/admin/all  →  all records (active + inactive)
const adminGetAll = async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/blogs/:id
const getById = async (req, res) => {
  try {
    const item = await BlogPost.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/blogs  →  create
const create = async (req, res) => {
  try {
    const { title, excerpt, content, img, cat, date, link, isActive, order } = req.body;
    if (!title || !excerpt || !cat || !date || !link) {
      return res.status(400).json({ success: false, message: "title, excerpt, cat, date and link are required" });
    }
    const item = await BlogPost.create({ title, excerpt, content, img, cat, date, link, isActive, order });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/blogs/:id  →  update
const update = async (req, res) => {
  try {
    const item = await BlogPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/blogs/:id  →  hard delete
const remove = async (req, res) => {
  try {
    const item = await BlogPost.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export { getAll, adminGetAll, getById, create, update, remove };