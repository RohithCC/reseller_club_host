// routes/productRoute.js
import express from "express"
import multer  from "multer"
import { adminAuth } from "../middleware/adminAuth.js"
import { userAuth  } from "../middleware/userAuth.js"
import {
  // CRUD
  addProduct, listProducts, singleProduct, updateProduct, removeProduct,
  // Stock
  toggleStock,
  // Similar
  similarProducts,
  // Reviews
  addReview, deleteReview,
  // Use-cases ("What You Can Do")
  addUseCase, updateUseCase, deleteUseCase,
  // Discovery / Aggregations
  getCategories, getFeaturedProducts,
  getHotProducts, getBestsellers, getPopularProducts,
  searchProducts, getAllTags,
} from "../controllers/productController.js"

const productRouter = express.Router()

// ─── Multer – disk storage for Cloudinary uploads ────────────────────────────
const storage = multer.diskStorage({ destination: "uploads/" })
const upload  = multer({ storage })
const imgFields = upload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
])

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES  (require adminAuth)
// ════════════════════════════════════════════════════════════════════════════

// Product CRUD
productRouter.post("/add",          adminAuth, imgFields, addProduct)
productRouter.post("/update",       adminAuth, imgFields, updateProduct)
productRouter.post("/remove",       adminAuth,            removeProduct)

// Stock toggle
productRouter.post("/toggle-stock", adminAuth,            toggleStock)

// Review moderation
productRouter.post("/delete-review", adminAuth,           deleteReview)

// Use-case cards CRUD  (powers "What You Can Do" tab)
productRouter.post("/usecase/add",    adminAuth,          addUseCase)
productRouter.post("/usecase/update", adminAuth,          updateUseCase)
productRouter.post("/usecase/delete", adminAuth,          deleteUseCase)

// ════════════════════════════════════════════════════════════════════════════
//  AUTH-REQUIRED ROUTES  (require userAuth)
// ════════════════════════════════════════════════════════════════════════════

// Submit a review
productRouter.post("/review/add", userAuth, addReview)

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES  (no auth)
// ════════════════════════════════════════════════════════════════════════════

// Core list / detail
productRouter.get( "/list",     listProducts)     // GET  /api/product/list?category=&sort=&page=&limit=…
productRouter.post("/single",   singleProduct)    // POST /api/product/single        { productId }
productRouter.post("/similar",  similarProducts)  // POST /api/product/similar       { productId, category }

// Search
productRouter.get("/search",    searchProducts)   // GET  /api/product/search?q=arduino&page=1

// Discovery / homepage feeds
productRouter.get("/categories", getCategories)   // GET  /api/product/categories
productRouter.get("/featured",   getFeaturedProducts) // GET  /api/product/featured?limit=8
productRouter.get("/hot",        getHotProducts)      // GET  /api/product/hot?limit=8
productRouter.get("/bestsellers",getBestsellers)      // GET  /api/product/bestsellers?limit=8
productRouter.get("/popular",    getPopularProducts)  // GET  /api/product/popular?limit=8

// Tags cloud
productRouter.get("/tags",       getAllTags)       // GET  /api/product/tags

export default productRouter

