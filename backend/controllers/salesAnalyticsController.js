// controllers/salesAnalyticsController.js
// ─────────────────────────────────────────────────────────────────────────────
// Detailed Sales Analytics endpoint — top products, category breakdown,
// hourly trends, daily/weekly/monthly revenue.
// ─────────────────────────────────────────────────────────────────────────────

import Order from '../models/Order.js'
import productModel from '../models/productModel.js'

// ─── GET /api/dashboard/sales-analytics — detailed sales data ─────────────────
const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Build date filter (optional)
    const dateFilter = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        dateFilter.createdAt.$lte = end
      }
    }

    const match = Object.keys(dateFilter).length > 0 ? { $match: dateFilter } : null
    const pipeline = match ? [match] : []

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Top 10 selling products (by quantity sold)
    // ═══════════════════════════════════════════════════════════════════════
    const topProducts = await Order.aggregate([
      ...pipeline,
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          productId: { $first: '$items.productId' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          productId: 1,
          quantitySold: 1,
          revenue: 1,
          orderCount: { $size: '$orderCount' },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 },
    ])

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Category-wise sales breakdown
    // ═══════════════════════════════════════════════════════════════════════
    const categorySales = await Order.aggregate([
      ...pipeline,
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.subcat',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $addToSet: '$_id' },
          productCount: { $addToSet: '$items.name' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          quantitySold: 1,
          revenue: 1,
          orderCount: { $size: '$orderCount' },
          productCount: { $size: '$productCount' },
        },
      },
      { $sort: { revenue: -1 } },
    ])

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Hourly order trends (which hours are busiest?)
    // ═══════════════════════════════════════════════════════════════════════
    const hourlyTrends = await Order.aggregate([
      ...pipeline,
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$payment.status', 'paid'] },
                '$grandTotal',
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          hour: '$_id',
          orders: 1,
          revenue: { $round: ['$revenue', 0] },
        },
      },
      { $sort: { hour: 1 } },
    ])

    // Fill missing hours with 0
    const filledHourly = []
    for (let h = 0; h < 24; h++) {
      const existing = hourlyTrends.find(t => t.hour === h)
      filledHourly.push({
        hour: h,
        label: `${h.toString().padStart(2, '0')}:00`,
        orders: existing?.orders ?? 0,
        revenue: existing?.revenue ?? 0,
      })
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Daily revenue (last 30 days, or custom date range if filter active)
    // ═══════════════════════════════════════════════════════════════════════
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyDateFilter = dateFilter.createdAt
      ? { createdAt: dateFilter.createdAt }
      : { createdAt: { $gte: thirtyDaysAgo } }

    const dailyRevenue = await Order.aggregate([
      { $match: dailyDateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$payment.status', 'paid'] },
                '$grandTotal',
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          orders: 1,
          revenue: { $round: ['$revenue', 0] },
        },
      },
      { $sort: { date: 1 } },
    ])

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Payment method split
    // ═══════════════════════════════════════════════════════════════════════
    const paymentMethodSplit = await Order.aggregate([
      ...pipeline,
      {
        $group: {
          _id: '$payment.method',
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$payment.status', 'paid'] },
                '$grandTotal',
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          method: { $ifNull: ['$_id', 'unknown'] },
          orders: 1,
          revenue: { $round: ['$revenue', 0] },
        },
      },
    ])

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Summary KPIs
    // ═══════════════════════════════════════════════════════════════════════
    const summary = await Order.aggregate([
      ...pipeline,
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$payment.status', 'paid'] },
                '$grandTotal',
                0,
              ],
            },
          },
          totalItemsSold: { $sum: { $sum: '$items.quantity' } },
          avgOrderValue: { $avg: '$grandTotal' },
          codOrders: { $sum: { $cond: [{ $eq: ['$payment.method', 'cod'] }, 1, 0] } },
          razorpayOrders: { $sum: { $cond: [{ $eq: ['$payment.method', 'razorpay'] }, 1, 0] } },
        },
      },
    ])

    res.json({
      success: true,
      data: {
        summary: summary[0] || {
          totalOrders: 0, totalRevenue: 0, totalItemsSold: 0,
          avgOrderValue: 0, codOrders: 0, razorpayOrders: 0,
        },
        topProducts,
        categorySales,
        hourlyTrends: filledHourly,
        dailyRevenue,
        paymentMethodSplit,
      },
    })
  } catch (error) {
    console.error('[salesAnalytics]', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export { getSalesAnalytics }
