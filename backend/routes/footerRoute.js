import express from 'express'
import { getFooterSettings, updateFooterSettings } from '../controllers/footerController.js'
import { adminAuth } from '../middleware/adminAuth.js'   // ✅ named import

const footerRouter = express.Router()

footerRouter.get('/',  getFooterSettings)               // public
footerRouter.put('/',  adminAuth, updateFooterSettings) // admin only

export default footerRouter
