import express from 'express'
import {
    addBlog,
    listBlogs,
    singleBlog,
    updateBlog,
    removeBlog,
    togglePublish,
    addComment,
    manageComment,
    likeBlog,
    getBlogById
} from '../controllers/blogController.js'
import upload from '../middleware/multer.js'
import { adminAuth } from '../middleware/adminAuth.js'   // ← named import

const blogRouter = express.Router()

// ── Admin routes (protected) ──────────────────────────────────────────────────
blogRouter.post('/add',             adminAuth, upload.single('image'), addBlog)
blogRouter.post('/update',          adminAuth, upload.single('image'), updateBlog)
blogRouter.post('/remove',          adminAuth, removeBlog)
blogRouter.post('/toggle-publish',  adminAuth, togglePublish)
blogRouter.post('/comment/approve', adminAuth, manageComment)

// ── Public routes — fixed routes BEFORE dynamic /:id ─────────────────────────
blogRouter.get( '/list',         listBlogs)
blogRouter.post('/single',       singleBlog)
blogRouter.post('/like',         likeBlog)
blogRouter.post('/comment/add',  addComment)
blogRouter.get( '/:id',          getBlogById)   // ← always last

export default blogRouter
