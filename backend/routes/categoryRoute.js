// routes/categoryRoute.js
import express from 'express'
import multer  from 'multer'
import { adminAuth } from '../middleware/adminAuth.js'
import {
    addCategory, listCategories, singleCategory,
    updateCategory, removeCategory, toggleCategory,
    addSubCategory, updateSubCategory, removeSubCategory, listSubCategories,
    getCategoryTree,
} from '../controllers/categoryController.js'

const categoryRouter = express.Router()

// Single optional image upload (category or sub-category thumbnail)
const storage = multer.diskStorage({ destination: 'uploads/' })
const upload  = multer({ storage })
const singleImg = upload.single('image')  // field name = "image"

// ════════════════════════════════════════════════════════════════
//  CATEGORY ROUTES
// ════════════════════════════════════════════════════════════════

// Admin — full CRUD
categoryRouter.post('/add',    adminAuth, singleImg, addCategory)
categoryRouter.post('/update', adminAuth, singleImg, updateCategory)
categoryRouter.post('/remove', adminAuth,            removeCategory)
categoryRouter.post('/toggle', adminAuth,            toggleCategory)
categoryRouter.post('/single',                       singleCategory)   // public ok

// Public
categoryRouter.get('/list',    listCategories)   // ?activeOnly=true
categoryRouter.get('/tree',    getCategoryTree)  // ?activeOnly=true  ← full nested tree

// ════════════════════════════════════════════════════════════════
//  SUBCATEGORY ROUTES  (nested under /sub/*)
// ════════════════════════════════════════════════════════════════

categoryRouter.post('/sub/add',    adminAuth, singleImg, addSubCategory)
categoryRouter.post('/sub/update', adminAuth, singleImg, updateSubCategory)
categoryRouter.post('/sub/remove', adminAuth,            removeSubCategory)
categoryRouter.get( '/sub/list',                         listSubCategories) // ?categoryId=&activeOnly=true

export default categoryRouter