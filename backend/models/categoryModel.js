// models/categoryModel.js
import mongoose from 'mongoose'

// ─── toSlug helper ────────────────────────────────────────────────────────────
const toSlug = (str) =>
    str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')

// ─── SubCategory Schema (embedded in Category) ────────────────────────────────
const subCategorySchema = new mongoose.Schema(
    {
        name:        { type: String, required: true, trim: true },
        slug:        { type: String, required: true, trim: true, lowercase: true },
        description: { type: String, default: '' },
        image:       { type: String, default: '' },
        isActive:    { type: Boolean, default: true },
        sortOrder:   { type: Number,  default: 0 },
    },
    { timestamps: true }
)

// ─── Category Schema ──────────────────────────────────────────────────────────
const categorySchema = new mongoose.Schema(
    {
        name:          { type: String, required: true, trim: true, unique: true },
        slug:          { type: String, required: true, trim: true, lowercase: true, unique: true },
        description:   { type: String, default: '' },
        image:         { type: String, default: '' },
        isActive:      { type: Boolean, default: true },
        sortOrder:     { type: Number,  default: 0 },
        subCategories: { type: [subCategorySchema], default: [] },
    },
    { timestamps: true }
)

// ─── Auto-generate slug before save ───────────────────────────────────────────
categorySchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = toSlug(this.name)
    }
    this.subCategories.forEach((sub) => {
        if (!sub.slug) sub.slug = toSlug(sub.name)
    })
    next()
})

// ─── Model ────────────────────────────────────────────────────────────────────
const categoryModel = mongoose.models.category || mongoose.model('category', categorySchema)

// ─── Single export block (fixes Node v24 ESM named+default export issue) ──────
export { categoryModel as default, toSlug }