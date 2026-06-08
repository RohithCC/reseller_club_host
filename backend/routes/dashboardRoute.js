// routes/dashboardRoute.js
import express from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import { getDashboardStats } from '../controllers/dashboardController.js'
import { getSalesAnalytics } from '../controllers/salesAnalyticsController.js'

const dashboardRouter = express.Router()

// GET /api/dashboard/stats — aggregated dashboard data (admin only)
dashboardRouter.get('/stats', adminAuth, getDashboardStats)

// GET /api/dashboard/sales-analytics — detailed sales analytics
dashboardRouter.get('/sales-analytics', adminAuth, getSalesAnalytics)

export default dashboardRouter
