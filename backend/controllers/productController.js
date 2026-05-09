// controllers/productController.js
import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

// ─── Helper: recalculate averageRating & totalReviews ────────────────────────
const recalcRating = (product) => {
  if (!product.reviews.length) {
    product.averageRating = 0
    product.totalReviews  = 0
    return
  }
  const sum = product.reviews.reduce((acc, r) => acc + r.rating, 0)
  product.averageRating = parseFloat((sum / product.reviews.length).toFixed(1))
  product.totalReviews  = product.reviews.length
}

// ─── Helper: safely parse a JSON string field from FormData ──────────────────
const parseField = (val, fallback) => {
  if (val === undefined || val === null || val === "") return fallback
  try { return JSON.parse(val) } catch { return fallback }
}

// ─── Helper: upload images to Cloudinary ─────────────────────────────────────
const uploadImages = async (files) => {
  const slots = ["image1", "image2", "image3", "image4"]
  const toUpload = slots.map((k) => files?.[k]?.[0]).filter(Boolean)
  return Promise.all(
    toUpload.map((item) =>
      cloudinary.uploader
        .upload(item.path, { resource_type: "image", folder: "amulya_electronics" })
        .then((r) => r.secure_url)
    )
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  PRODUCT CRUD
// ════════════════════════════════════════════════════════════════════════════

// ─── ADD PRODUCT ─────────────────────────────────────────────────────────────
// POST /api/product/add  (admin)
// Body: multipart/form-data – all fields below + image1..image4 files
const addProduct = async (req, res) => {
  try {
    const {
      name, description, price, originalPrice,
      category, subCategory,
      bestseller, isHot, isPopular, isFeatured,
      inStock, stockCount,
      keyFeatures, specifications, tags, useCases,
      warranty, returnPolicy,
    } = req.body

    const imagesUrl = await uploadImages(req.files)
    if (!imagesUrl.length)
      return res.json({ success: false, message: "At least one product image is required." })

    const productData = {
      name:          name?.trim(),
      description:   description?.trim(),
      price:         Number(price),
      originalPrice: Number(originalPrice) || 0,
      category:      category?.trim(),
      subCategory:   subCategory?.trim() || "",
      image:         imagesUrl,
      inStock:       inStock === "true",
      stockCount:    Number(stockCount) || 0,
      bestseller:    bestseller === "true",
      isHot:         isHot     === "true",
      isPopular:     isPopular === "true",
      isFeatured:    isFeatured === "true",
      keyFeatures:   parseField(keyFeatures, []),
      specifications:parseField(specifications, {}),
      tags:          parseField(tags, []),
      useCases:      parseField(useCases, []),    // "What You Can Do" cards
      warranty:      warranty     || "1 Year Warranty",
      returnPolicy:  returnPolicy || "30-Day Returns",
      date:          Date.now(),
    }

    const product = new productModel(productData)
    await product.save()

    res.json({ success: true, message: "Product Added", productId: product._id })
  } catch (error) {
    console.error("addProduct:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── UPDATE PRODUCT ──────────────────────────────────────────────────────────
// POST /api/product/update  (admin)
// Body: multipart/form-data – productId + any fields to change + optional new image files
const updateProduct = async (req, res) => {
  try {
    const {
      productId,
      name, description, price, originalPrice,
      category, subCategory,
      bestseller, isHot, isPopular, isFeatured,
      inStock, stockCount,
      keyFeatures, specifications, tags, useCases,
      warranty, returnPolicy,
    } = req.body

    const product = await productModel.findById(productId)
    if (!product) return res.json({ success: false, message: "Product not found" })

    // Replace only image slots that received a new file
    let updatedImages = [...product.image]
    for (let i = 1; i <= 4; i++) {
      const file = req.files?.[`image${i}`]?.[0]
      if (file) {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: "image",
          folder: "amulya_electronics",
        })
        updatedImages[i - 1] = result.secure_url
      }
    }

    const updates = {
      ...(name          !== undefined && { name: name.trim() }),
      ...(description   !== undefined && { description: description.trim() }),
      ...(price         !== undefined && { price: Number(price) }),
      ...(originalPrice !== undefined && { originalPrice: Number(originalPrice) }),
      ...(category      !== undefined && { category: category.trim() }),
      ...(subCategory   !== undefined && { subCategory: subCategory.trim() }),
      ...(inStock       !== undefined && { inStock: inStock === "true" }),
      ...(stockCount    !== undefined && { stockCount: Number(stockCount) }),
      ...(bestseller    !== undefined && { bestseller: bestseller === "true" }),
      ...(isHot         !== undefined && { isHot: isHot === "true" }),
      ...(isPopular     !== undefined && { isPopular: isPopular === "true" }),
      ...(isFeatured    !== undefined && { isFeatured: isFeatured === "true" }),
      ...(keyFeatures   !== undefined && { keyFeatures:    parseField(keyFeatures,    product.keyFeatures) }),
      ...(specifications!== undefined && { specifications: parseField(specifications, product.specifications) }),
      ...(tags          !== undefined && { tags:      parseField(tags,      product.tags) }),
      ...(useCases      !== undefined && { useCases:  parseField(useCases,  product.useCases) }),
      ...(warranty      !== undefined && { warranty }),
      ...(returnPolicy  !== undefined && { returnPolicy }),
      image: updatedImages,
    }

    await productModel.findByIdAndUpdate(productId, updates, { new: true })
    res.json({ success: true, message: "Product Updated" })
  } catch (error) {
    console.error("updateProduct:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── REMOVE PRODUCT ──────────────────────────────────────────────────────────
// POST /api/product/remove  (admin)
// Body: { id }
const removeProduct = async (req, res) => {
  try {
    const product = await productModel.findByIdAndDelete(req.body.id)
    if (!product) return res.json({ success: false, message: "Product not found" })
    res.json({ success: true, message: "Product Removed" })
  } catch (error) {
    console.error("removeProduct:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── LIST PRODUCTS ───────────────────────────────────────────────────────────
// GET /api/product/list
// Query params: category, subCategory, minPrice, maxPrice, minRating,
//               bestseller, isHot, isFeatured, inStock, tags,
//               sort (date|popularity|price_asc|price_desc|rating),
//               page, limit, search
const listProducts = async (req, res) => {
  try {
    const {
      category, subCategory,
      minPrice, maxPrice,
      minRating,
      bestseller, isHot, isFeatured, inStock,
      tags,
      sort  = "date",
      page  = 1,
      limit = 12,
      search,
    } = req.query

    const query = {}
    if (category)    query.category    = category
    if (subCategory) query.subCategory = subCategory
    if (inStock  !== undefined) query.inStock    = inStock    === "true"
    if (bestseller!==undefined) query.bestseller = bestseller === "true"
    if (isHot    !== undefined) query.isHot      = isHot      === "true"
    if (isFeatured!==undefined) query.isFeatured = isFeatured === "true"
    if (minRating)   query.averageRating = { $gte: Number(minRating) }
    if (tags)        query.tags = { $in: tags.split(",") }

    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags:        { $regex: search, $options: "i" } },
      ]
    }

    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }

    const sortOptions = {
      date:       { date: -1 },
      popularity: { views: -1 },
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      rating:     { averageRating: -1 },
    }

    const skip  = (Number(page) - 1) * Number(limit)
    const total = await productModel.countDocuments(query)

    const products = await productModel
      .find(query, { reviews: 0 })              // exclude heavy reviews array in list view
      .sort(sortOptions[sort] || { date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean()

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    console.error("listProducts:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── SINGLE PRODUCT ──────────────────────────────────────────────────────────
// POST /api/product/single
// Body: { productId }
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body

    const product = await productModel.findByIdAndUpdate(
      productId,
      { $inc: { views: 1 } },
      { new: true }
    )

    if (!product) return res.json({ success: false, message: "Product not found" })

    res.json({ success: true, product })
  } catch (error) {
    console.error("singleProduct:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── SIMILAR PRODUCTS ────────────────────────────────────────────────────────
// POST /api/product/similar
// Body: { productId, category, limit? }
const similarProducts = async (req, res) => {
  try {
    const { productId, category, limit = 6 } = req.body

    const products = await productModel
      .find({ category, _id: { $ne: productId } }, { reviews: 0 })
      .sort({ averageRating: -1 })
      .limit(Number(limit))
      .lean()

    res.json({ success: true, products })
  } catch (error) {
    console.error("similarProducts:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── TOGGLE STOCK ────────────────────────────────────────────────────────────
// POST /api/product/toggle-stock  (admin)
// Body: { productId, inStock: "true"|"false" }
const toggleStock = async (req, res) => {
  try {
    const { productId, inStock } = req.body
    await productModel.findByIdAndUpdate(productId, { inStock: inStock === "true" })
    res.json({ success: true, message: "Stock status updated" })
  } catch (error) {
    console.error("toggleStock:", error)
    res.json({ success: false, message: error.message })
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  REVIEWS
// ════════════════════════════════════════════════════════════════════════════

// ─── ADD REVIEW ──────────────────────────────────────────────────────────────
// POST /api/product/review/add  (userAuth)
// Body: { productId, userName, rating, comment }
// userId comes from req.userId (set by userAuth middleware)
const addReview = async (req, res) => {
  try {
    const { productId, userName, name, rating, comment } = req.body
    const userId = req.userId ?? req.body.userId ?? ""

    if (!productId || !rating || !comment)
      return res.json({ success: false, message: "productId, rating and comment are required." })

    const product = await productModel.findById(productId)
    if (!product) return res.json({ success: false, message: "Product not found" })

    // Prevent duplicate reviews from the same logged-in user
    if (userId) {
      const alreadyReviewed = product.reviews.find((r) => r.userId === userId)
      if (alreadyReviewed)
        return res.json({ success: false, message: "You have already reviewed this product." })
    }

    const displayName = (userName || name || "Anonymous").trim()

    product.reviews.push({
      userId,
      userName: displayName,
      name:     displayName,
      rating:   Number(rating),
      comment:  comment.trim(),
      date:     Date.now(),
    })

    recalcRating(product)
    await product.save()

    res.json({ success: true, message: "Review Added", averageRating: product.averageRating, totalReviews: product.totalReviews })
  } catch (error) {
    console.error("addReview:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── DELETE REVIEW (admin) ───────────────────────────────────────────────────
// POST /api/product/delete-review  (admin)
// Body: { productId, reviewId }
const deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.body

    const product = await productModel.findById(productId)
    if (!product) return res.json({ success: false, message: "Product not found" })

    const before = product.reviews.length
    product.reviews = product.reviews.filter((r) => r._id.toString() !== reviewId)

    if (product.reviews.length === before)
      return res.json({ success: false, message: "Review not found" })

    recalcRating(product)
    await product.save()

    res.json({ success: true, message: "Review Deleted" })
  } catch (error) {
    console.error("deleteReview:", error)
    res.json({ success: false, message: error.message })
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  USE-CASES  ("What You Can Do" tab)
// ════════════════════════════════════════════════════════════════════════════

// ─── ADD USE-CASE CARD ───────────────────────────────────────────────────────
// POST /api/product/usecase/add  (admin)
// Body: { productId, label, desc, icon? }
const addUseCase = async (req, res) => {
  try {
    const { productId, label, desc = "", icon = "Default" } = req.body

    if (!productId || !label)
      return res.json({ success: false, message: "productId and label are required." })

    const product = await productModel.findByIdAndUpdate(
      productId,
      { $push: { useCases: { label: label.trim(), desc: desc.trim(), icon } } },
      { new: true, select: "useCases" }
    )

    if (!product) return res.json({ success: false, message: "Product not found" })

    res.json({ success: true, message: "Use-case added", useCases: product.useCases })
  } catch (error) {
    console.error("addUseCase:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── UPDATE USE-CASE CARD ────────────────────────────────────────────────────
// POST /api/product/usecase/update  (admin)
// Body: { productId, useCaseId, label?, desc?, icon? }
const updateUseCase = async (req, res) => {
  try {
    const { productId, useCaseId, label, desc, icon } = req.body

    const product = await productModel.findById(productId)
    if (!product) return res.json({ success: false, message: "Product not found" })

    const uc = product.useCases.id(useCaseId)
    if (!uc) return res.json({ success: false, message: "Use-case not found" })

    if (label !== undefined) uc.label = label.trim()
    if (desc  !== undefined) uc.desc  = desc.trim()
    if (icon  !== undefined) uc.icon  = icon

    await product.save()
    res.json({ success: true, message: "Use-case updated", useCases: product.useCases })
  } catch (error) {
    console.error("updateUseCase:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── DELETE USE-CASE CARD ────────────────────────────────────────────────────
// POST /api/product/usecase/delete  (admin)
// Body: { productId, useCaseId }
const deleteUseCase = async (req, res) => {
  try {
    const { productId, useCaseId } = req.body

    const product = await productModel.findByIdAndUpdate(
      productId,
      { $pull: { useCases: { _id: useCaseId } } },
      { new: true, select: "useCases" }
    )

    if (!product) return res.json({ success: false, message: "Product not found" })

    res.json({ success: true, message: "Use-case deleted", useCases: product.useCases })
  } catch (error) {
    console.error("deleteUseCase:", error)
    res.json({ success: false, message: error.message })
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  AGGREGATIONS / DISCOVERY
// ════════════════════════════════════════════════════════════════════════════

// ─── GET CATEGORIES ──────────────────────────────────────────────────────────
// GET /api/product/categories
const getCategories = async (req, res) => {
  try {
    const categories = await productModel.aggregate([
      {
        $addFields: {
          firstImage: {
            $cond: {
              if:   { $isArray: "$image" },
              then: { $arrayElemAt: ["$image", 0] },
              else: "$image",
            },
          },
        },
      },
      {
        $group: {
          _id:   "$category",
          count: { $sum: 1 },
          image: { $first: "$firstImage" },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id:   0,
          name:  "$_id",
          count: 1,
          image: 1,
        },
      },
    ])

    const cleaned = categories.filter((c) => c.name?.trim())

    res.json({ success: true, categories: cleaned, total: cleaned.length })
  } catch (error) {
    console.error("getCategories:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── GET FEATURED PRODUCTS ───────────────────────────────────────────────────
// GET /api/product/featured?limit=8
const getFeaturedProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20)

    const products = await productModel
      .find({ isFeatured: true })
      .sort({ date: -1 })
      .limit(limit)
      .select(
        "_id name price originalPrice image category subCategory " +
        "averageRating totalReviews inStock stockCount " +
        "bestseller isFeatured isHot views tags description " +
        "keyFeatures useCases warranty returnPolicy"
      )
      .lean()

    const normalised = products.map((p) => ({
      ...p,
      image: Array.isArray(p.image) ? p.image : [p.image].filter(Boolean),
    }))

    res.json({ success: true, products: normalised, total: normalised.length })
  } catch (error) {
    console.error("getFeaturedProducts:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── GET HOT / BESTSELLER / POPULAR PRODUCTS ─────────────────────────────────
// GET /api/product/hot?limit=8
// GET /api/product/bestsellers?limit=8
// GET /api/product/popular?limit=8
const getHotProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20)
    const products = await productModel
      .find({ isHot: true }, { reviews: 0 })
      .sort({ date: -1 })
      .limit(limit)
      .lean()
    res.json({ success: true, products, total: products.length })
  } catch (error) {
    console.error("getHotProducts:", error)
    res.json({ success: false, message: error.message })
  }
}

const getBestsellers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20)
    const products = await productModel
      .find({ bestseller: true }, { reviews: 0 })
      .sort({ averageRating: -1, date: -1 })
      .limit(limit)
      .lean()
    res.json({ success: true, products, total: products.length })
  } catch (error) {
    console.error("getBestsellers:", error)
    res.json({ success: false, message: error.message })
  }
}

const getPopularProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20)
    const products = await productModel
      .find({ isPopular: true }, { reviews: 0 })
      .sort({ views: -1, averageRating: -1 })
      .limit(limit)
      .lean()
    res.json({ success: true, products, total: products.length })
  } catch (error) {
    console.error("getPopularProducts:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── SEARCH PRODUCTS ─────────────────────────────────────────────────────────
// GET /api/product/search?q=arduino&page=1&limit=12
const searchProducts = async (req, res) => {
  try {
    const { q = "", page = 1, limit = 12 } = req.query

    if (!q.trim()) return res.json({ success: false, message: "Search query is required." })

    const query = {
      $or: [
        { name:        { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags:        { $regex: q, $options: "i" } },
        { category:    { $regex: q, $options: "i" } },
      ],
    }

    const skip  = (Number(page) - 1) * Number(limit)
    const total = await productModel.countDocuments(query)

    const products = await productModel
      .find(query, { reviews: 0 })
      .sort({ averageRating: -1, date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean()

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    console.error("searchProducts:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── GET ALL TAGS ────────────────────────────────────────────────────────────
// GET /api/product/tags
const getAllTags = async (req, res) => {
  try {
    const result = await productModel.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ])
    res.json({ success: true, tags: result })
  } catch (error) {
    console.error("getAllTags:", error)
    res.json({ success: false, message: error.message })
  }
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
export {
  // CRUD
  addProduct, listProducts, singleProduct, updateProduct, removeProduct,
  // Stock
  toggleStock,
  // Similar
  similarProducts,
  // Reviews
  addReview, deleteReview,
  // Use-cases
  addUseCase, updateUseCase, deleteUseCase,
  // Discovery / Aggregations
  getCategories, getFeaturedProducts,
  getHotProducts, getBestsellers, getPopularProducts,
  searchProducts, getAllTags,
}