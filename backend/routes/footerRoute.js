import express from 'express'
import { getFooterSettings, updateFooterSettings } from '../controllers/footerController.js'
import { adminOrSuperAdminAuth } from '../middleware/adminAuth.js'

const footerRouter = express.Router()

footerRouter.get('/',  getFooterSettings)               // public
footerRouter.put('/',  adminOrSuperAdminAuth, updateFooterSettings)

export default footerRouter
