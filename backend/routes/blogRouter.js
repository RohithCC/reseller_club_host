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
import { blogerOrAboveAuth } from '../middleware/adminAuth.js'

const blogRouter = express.Router()

// ── Admin routes (protected) ──────────────────────────────────────────────────
blogRouter.post('/add',             blogerOrAboveAuth, upload.single('image'), addBlog)
blogRouter.post('/update',          blogerOrAboveAuth, upload.single('image'), updateBlog)
blogRouter.post('/remove',          blogerOrAboveAuth, removeBlog)
blogRouter.post('/toggle-publish',  blogerOrAboveAuth, togglePublish)
blogRouter.post('/comment/approve', blogerOrAboveAuth, manageComment)

// ── Public routes — fixed routes BEFORE dynamic /:id ─────────────────────────
blogRouter.get( '/list',         listBlogs)
blogRouter.post('/single',       singleBlog)
blogRouter.post('/like',         likeBlog)
blogRouter.post('/comment/add',  addComment)
blogRouter.get( '/:id',          getBlogById)   // ← always last

export default blogRouter
