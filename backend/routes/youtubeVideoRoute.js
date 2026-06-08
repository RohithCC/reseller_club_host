import express from 'express'
import {
  getPublicVideos,
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  toggleVideo,
} from '../controllers/youtubeVideoController.js'
import { adminOrSuperAdminAuth } from '../middleware/adminAuth.js'

const youtubeVideoRouter = express.Router()

// Public — frontend
youtubeVideoRouter.get('/public', getPublicVideos)

// Admin
youtubeVideoRouter.get('/',       adminOrSuperAdminAuth, listVideos)
youtubeVideoRouter.post('/',      adminOrSuperAdminAuth, createVideo)
youtubeVideoRouter.put('/:id',    adminOrSuperAdminAuth, updateVideo)
youtubeVideoRouter.delete('/:id', adminOrSuperAdminAuth, deleteVideo)
youtubeVideoRouter.patch('/:id/toggle', adminOrSuperAdminAuth, toggleVideo)

export default youtubeVideoRouter
