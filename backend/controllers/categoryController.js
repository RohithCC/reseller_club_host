// controllers/categoryController.js
import { rmSync, existsSync } from 'fs'
import categoryModel, { toSlug } from '../models/categoryModel.js'

// ─── Helper: local image URL ───────────────────────────────────────────────────
const localImageUrl = (file) => (file ? `/uploads/${file.filename}` : '')

// ─── Helper: delete image file(s) from disk ───────────────────────────────────
const deleteImageFiles = (urls) => {
    if (!urls || (Array.isArray(urls) && urls.length === 0)) return
    const arr = Array.isArray(urls) ? urls : [urls]
    for (const url of arr) {
        if (!url || typeof url !== 'string') continue
        // Only delete local /uploads/ files, not external URLs
        if (!url.startsWith('/uploads/')) continue
        try {
            const filePath = `.${url}`  // e.g. './uploads/abc.jpg'
            if (existsSync(filePath)) rmSync(filePath)
        } catch (err) {
            console.error('deleteImageFiles error:', url, err.message)
        }
    }
}

// ═══════════════════════════════════════════════════════════════
//  CATEGORY  —  CREATE / READ / UPDATE / DELETE
// ═══════════════════════════════════════════════════════════════

// ─── CREATE CATEGORY ──────────────────────────────────────────────────────────
// POST /api/category/add
// Body (multipart): name, description?, sortOrder?, isActive?
// File:  image (optional)
const addCategory = async (req, res) => {
    try {
        const { name, description, sortOrder, isActive } = req.body

        if (!name) return res.json({ success: false, message: 'Category name is required' })

        // Prevent duplicate name
        const exists = await categoryModel.findOne({ name: { $regex: `^${name}$`, $options: 'i' } })
        if (exists) return res.json({ success: false, message: 'Category already exists' })

        const category = new categoryModel({
            name,
            slug:        toSlug(name),
            description: description || '',
            image:       localImageUrl(req.file),
            isActive:    isActive !== undefined ? isActive === 'true' : true,
            sortOrder:   Number(sortOrder) || 0,
        })

        await category.save()
        res.json({ success: true, message: 'Category created', category })
    } catch (error) {
        console.error('addCategory error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── LIST CATEGORIES ──────────────────────────────────────────────────────────
// GET /api/category/list?activeOnly=true
const listCategories = async (req, res) => {
    try {
        const { activeOnly } = req.query
        const query = activeOnly === 'true' ? { isActive: true } : {}

        const categories = await categoryModel
            .find(query)
            .sort({ sortOrder: 1, name: 1 })
            .lean()

        res.json({ success: true, categories, total: categories.length })
    } catch (error) {
        console.error('listCategories error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── SINGLE CATEGORY ─────────────────────────────────────────────────────────
// POST /api/category/single   Body: { categoryId }
const singleCategory = async (req, res) => {
    try {
        const { categoryId } = req.body
        const category = await categoryModel.findById(categoryId)
        if (!category) return res.json({ success: false, message: 'Category not found' })
        res.json({ success: true, category })
    } catch (error) {
        console.error('singleCategory error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── UPDATE CATEGORY ──────────────────────────────────────────────────────────
// POST /api/category/update
// Body (multipart): categoryId, name?, description?, sortOrder?, isActive?
// File:  image (optional — replaces existing)
const updateCategory = async (req, res) => {
    try {
        const { categoryId, name, description, sortOrder, isActive } = req.body

        const category = await categoryModel.findById(categoryId)
        if (!category) return res.json({ success: false, message: 'Category not found' })

        // Check duplicate name (exclude self)
        if (name && name !== category.name) {
            const dup = await categoryModel.findOne({
                name:  { $regex: `^${name}$`, $options: 'i' },
                _id:   { $ne: categoryId },
            })
            if (dup) return res.json({ success: false, message: 'Category name already taken' })
            category.name = name
            category.slug = toSlug(name)
        }

        if (description !== undefined) category.description = description
        if (sortOrder   !== undefined) category.sortOrder   = Number(sortOrder)
        if (isActive    !== undefined) category.isActive    = isActive === 'true'

        // Delete old image file if a new one is uploaded
        if (req.file) {
            deleteImageFiles(category.image)
            category.image = localImageUrl(req.file)
        }

        await category.save()
        res.json({ success: true, message: 'Category updated', category })
    } catch (error) {
        console.error('updateCategory error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── DELETE CATEGORY ──────────────────────────────────────────────────────────
// POST /api/category/remove   Body: { categoryId }
const removeCategory = async (req, res) => {
    try {
        const { categoryId } = req.body
        const category = await categoryModel.findByIdAndDelete(categoryId)
        if (!category) return res.json({ success: false, message: 'Category not found' })
        // Delete associated image files
        deleteImageFiles(category.image)
        category.subCategories?.forEach((s) => deleteImageFiles(s.image))
        res.json({ success: true, message: 'Category deleted' })
    } catch (error) {
        console.error('removeCategory error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── TOGGLE CATEGORY ACTIVE ───────────────────────────────────────────────────
// POST /api/category/toggle   Body: { categoryId, isActive }
const toggleCategory = async (req, res) => {
    try {
        const { categoryId, isActive } = req.body
        await categoryModel.findByIdAndUpdate(categoryId, { isActive: isActive === 'true' })
        res.json({ success: true, message: 'Category visibility updated' })
    } catch (error) {
        console.error('toggleCategory error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ═══════════════════════════════════════════════════════════════
//  SUBCATEGORY  —  ADD / UPDATE / REMOVE  (nested in Category)
// ═══════════════════════════════════════════════════════════════

// ─── ADD SUBCATEGORY ──────────────────────────────────────────────────────────
// POST /api/category/sub/add
// Body (multipart): categoryId, name, description?, sortOrder?, isActive?
// File:  image (optional)
const addSubCategory = async (req, res) => {
    try {
        const { categoryId, name, description, sortOrder, isActive } = req.body

        if (!categoryId || !name)
            return res.json({ success: false, message: 'categoryId and name are required' })

        const category = await categoryModel.findById(categoryId)
        if (!category) return res.json({ success: false, message: 'Parent category not found' })

        // Prevent duplicate sub within same category
        const dup = category.subCategories.find(
            (s) => s.name.toLowerCase() === name.toLowerCase()
        )
        if (dup) return res.json({ success: false, message: 'Sub-category already exists in this category' })

        category.subCategories.push({
            name,
            slug:        toSlug(name),
            description: description || '',
            image:       localImageUrl(req.file),
            isActive:    isActive !== undefined ? isActive === 'true' : true,
            sortOrder:   Number(sortOrder) || 0,
        })

        await category.save()
        const added = category.subCategories[category.subCategories.length - 1]
        res.json({ success: true, message: 'Sub-category added', subCategory: added })
    } catch (error) {
        console.error('addSubCategory error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── UPDATE SUBCATEGORY ───────────────────────────────────────────────────────
// POST /api/category/sub/update
// Body (multipart): categoryId, subCategoryId, name?, description?, sortOrder?, isActive?
// File:  image (optional)
const updateSubCategory = async (req, res) => {
    try {
        const { categoryId, subCategoryId, name, description, sortOrder, isActive } = req.body

        const category = await categoryModel.findById(categoryId)
        if (!category) return res.json({ success: false, message: 'Parent category not found' })

        const sub = category.subCategories.id(subCategoryId)
        if (!sub) return res.json({ success: false, message: 'Sub-category not found' })

        if (name) { sub.name = name; sub.slug = toSlug(name) }
        if (description !== undefined) sub.description = description
        if (sortOrder   !== undefined) sub.sortOrder   = Number(sortOrder)
        if (isActive    !== undefined) sub.isActive    = isActive === 'true'
        if (req.file) {
            deleteImageFiles(sub.image)
            sub.image = localImageUrl(req.file)
        }

        await category.save()
        res.json({ success: true, message: 'Sub-category updated', subCategory: sub })
    } catch (error) {
        console.error('updateSubCategory error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── REMOVE SUBCATEGORY ───────────────────────────────────────────────────────
// POST /api/category/sub/remove   Body: { categoryId, subCategoryId }
const removeSubCategory = async (req, res) => {
    try {
        const { categoryId, subCategoryId } = req.body

        const category = await categoryModel.findById(categoryId)
        if (!category) return res.json({ success: false, message: 'Parent category not found' })

        const removedSub = category.subCategories.id(subCategoryId)
        const before = category.subCategories.length
        category.subCategories = category.subCategories.filter(
            (s) => s._id.toString() !== subCategoryId
        )
        if (category.subCategories.length === before)
            return res.json({ success: false, message: 'Sub-category not found' })

        await category.save()
        // Delete sub-category image file
        if (removedSub) deleteImageFiles(removedSub.image)
        res.json({ success: true, message: 'Sub-category removed' })
    } catch (error) {
        console.error('removeSubCategory error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── GET SUBCATEGORIES OF A CATEGORY ─────────────────────────────────────────
// GET /api/category/sub/list?categoryId=xxx&activeOnly=true
const listSubCategories = async (req, res) => {
    try {
        const { categoryId, activeOnly } = req.query

        const category = await categoryModel.findById(categoryId).lean()
        if (!category) return res.json({ success: false, message: 'Category not found' })

        let subs = category.subCategories
        if (activeOnly === 'true') subs = subs.filter((s) => s.isActive)
        subs = subs.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

        res.json({ success: true, subCategories: subs, total: subs.length })
    } catch (error) {
        console.error('listSubCategories error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ─── FULL TREE  (categories + their subCategories) ────────────────────────────
// GET /api/category/tree?activeOnly=true
const getCategoryTree = async (req, res) => {
    try {
        const { activeOnly } = req.query
        const query = activeOnly === 'true' ? { isActive: true } : {}

        const categories = await categoryModel.find(query).sort({ sortOrder: 1, name: 1 }).lean()

        const tree = categories.map((cat) => ({
            ...cat,
            subCategories: cat.subCategories
                .filter((s) => (activeOnly === 'true' ? s.isActive : true))
                .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
        }))

        res.json({ success: true, tree, total: tree.length })
    } catch (error) {
        console.error('getCategoryTree error:', error)
        res.json({ success: false, message: error.message })
    }
}

export {
    // Category
    addCategory, listCategories, singleCategory,
    updateCategory, removeCategory, toggleCategory,
    // SubCategory
    addSubCategory, updateSubCategory, removeSubCategory, listSubCategories,
    // Tree
    getCategoryTree,
}