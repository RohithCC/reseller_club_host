import mongoose from "mongoose";

// ─── Comment Sub-Schema ───────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    name:     { type: String, required: true },
    email:    { type: String, required: true },
    comment:  { type: String, required: true, trim: true },
    approved: { type: Boolean, default: false },  // admin approves/hides comments
    date:     { type: Number, default: () => Date.now() },
  },
  { _id: true }
);

// ─── Blog Schema ──────────────────────────────────────────────────────────────
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,       // rich HTML / markdown body
      required: true,
    },
    image: {
      type: String,       // Cloudinary secure_url
      default: "",
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    author: {
      type: String,
      default: "Admin",
      trim: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: [commentSchema],  // embedded comments array
      default: [],
    },
    date: {
      type: Number,           // Date.now() — mirrors productModel pattern
      default: () => Date.now(),
    },
  },
  { minimize: false }         // mirrors userModel — keeps empty objects in DB
);

// ─── Auto-generate slug from title before save ────────────────────────────────
blogSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

const blogModel =
  mongoose.models.blog || mongoose.model("blog", blogSchema);

export default blogModel;
