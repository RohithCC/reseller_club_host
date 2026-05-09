import express from 'express'
import {
  submitContact,
  getAllContacts,
  updateContactStatus,
} from '../controllers/contactController.js'
import { adminAuth } from '../middleware/adminAuth.js'   // ✅ named import

const contactRouter = express.Router()

// Public
contactRouter.post('/submit', submitContact)

// Admin only
contactRouter.get('/all',          adminAuth, getAllContacts)
contactRouter.patch('/:id/status', adminAuth, updateContactStatus)

export default contactRouter
