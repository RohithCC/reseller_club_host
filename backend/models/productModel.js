// models/productModel.js
import mongoose from "mongoose"

// ─── Review Sub-Schema ────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    userId:   { type: String, default: "" },          // optional – guest reviews allowed
    userName: { type: String, required: true },
    name:     { type: String, default: "" },          // alias kept for compatibility
    rating:   { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String, required: true },
    date:     { type: Number, default: () => Date.now() },
  },
  { timestamps: true }                                // adds createdAt / updatedAt
)

// ─── Use-Case Sub-Schema (powers "What You Can Do" tab) ──────────────────────
const useCaseSchema = new mongoose.Schema({
  label: { type: String, required: true },            // e.g. "IoT Projects"
  desc:  { type: String, default: "" },               // short description shown in card
  icon:  { type: String, default: "Default" },        // icon hint: "IoT"|"Arduino"|etc.
})

// ─── Product Schema ───────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    // ── Core ────────────────────────────────────────────────────────────────
    name:          { type: String, required: true, trim: true },
    description:   { type: String, required: true },
    price:         { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0 },      // MRP / strike-through price
    image:         { type: [String], required: true }, // Cloudinary URLs

    // ── Categorisation ───────────────────────────────────────────────────────
    category:    { type: String, required: true, trim: true },
    subCategory: { type: String, default: "" },

    // ── Stock ────────────────────────────────────────────────────────────────
    inStock:    { type: Boolean, default: true },
    stockCount: { type: Number,  default: 0, min: 0 },

    // ── Visibility / Badges ──────────────────────────────────────────────────
    bestseller: { type: Boolean, default: false },
    isHot:      { type: Boolean, default: false },
    isPopular:  { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    // ── Rich Product Details ─────────────────────────────────────────────────
    keyFeatures:    { type: [String], default: [] },   // bullet points on product page
    specifications: { type: Map, of: String },         // key-value spec table
    tags:           { type: [String], default: [] },   // #NTC #Arduino etc.

    // ── "What You Can Do" – curated use-case cards ──────────────────────────
    // If empty the frontend auto-derives cards from tags; admins can override.
    useCases: { type: [useCaseSchema], default: [] },

    // ── Warranty & Returns ───────────────────────────────────────────────────
    warranty:     { type: String, default: "1 Year Warranty" },
    returnPolicy: { type: String, default: "30-Day Returns" },

    // ── Ratings & Reviews ────────────────────────────────────────────────────
    reviews:       { type: [reviewSchema], default: [] },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:  { type: Number, default: 0, min: 0 },

    // ── Analytics ────────────────────────────────────────────────────────────
    views:         { type: Number, default: 0, min: 0 },
    watchersCount: { type: Number, default: 0, min: 0 },

    // ── Internal ─────────────────────────────────────────────────────────────
    date: { type: Number, required: true, default: () => Date.now() },
  },
  {
    timestamps: true, // product-level createdAt / updatedAt
  }
)

// ── Indexes for common query patterns ────────────────────────────────────────
productSchema.index({ category: 1 })
productSchema.index({ isFeatured: 1, date: -1 })
productSchema.index({ averageRating: -1 })
productSchema.index({ price: 1 })
productSchema.index({ name: "text", description: "text", tags: "text" }) // full-text search

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema)

export default productModel