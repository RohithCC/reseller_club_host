// controllers/dashboardController.js
// ─────────────────────────────────────────────────────────────────────────────
// Aggregated dashboard statistics for the admin panel.
// Single endpoint returns all KPIs, charts data, and recent items.
// ─────────────────────────────────────────────────────────────────────────────

import productModel        from '../models/productModel.js'
import Order              from '../models/Order.js'
import userModel          from '../models/userModel.js'
import categoryModel      from '../models/categoryModel.js'
import blogModel          from '../models/blogModel.js'
import contactModel       from '../models/contactModel.js'
import Coupon             from '../models/Coupon.js'

// ─── Helper: month name ───────────────────────────────────────────────────────
const MONTH_NAMES = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
]

// ─── GET /api/dashboard/stats — all aggregated stats ──────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [
      productStats,
      orderStats,
      orderByStatus,
      monthlyAgg,
      userCount,
      categoryCount,
      blogCount,
      contactData,
      couponData,
      recentOrders,
      lowStockProducts,
      recentContacts,
    ] = await Promise.all([
      // ── Product KPIs ──────────────────────────────────────────────────────
      productModel.aggregate([
        {
          $group: {
            _id:           null,
            totalProducts: { $sum: 1 },
            totalStock:    { $sum: '$stockCount' },
            featuredCount: { $sum: { $cond: ['$isFeatured', 1, 0] } },
            bestsellerCount:{ $sum: { $cond: ['$bestseller', 1, 0] } },
            totalViews:    { $sum: '$views' },
            avgPrice:      { $avg: '$price' },
            inStockCount:  { $sum: { $cond: ['$inStock', 1, 0] } },
          },
        },
      ]),

      // ── Order KPIs ────────────────────────────────────────────────────────
      Order.aggregate([
        {
          $group: {
            _id:          null,
            totalOrders:  { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$payment.status', 'paid'] },
                  '$grandTotal',
                  0,
                ],
              },
            },
            mrpTotalAll:  { $sum: '$mrpTotal' },
            totalSaved:   { $sum: '$savedAmount' },
            totalDelivery:{ $sum: '$deliveryCharge' },
            paidOrders:   { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, 1, 0] } },
            codOrders:    { $sum: { $cond: [{ $eq: ['$payment.method', 'cod'] }, 1, 0] } },
          },
        },
      ]),

      // ── Orders grouped by status ──────────────────────────────────────────
      Order.aggregate([
        {
          $group: {
            _id:     '$status',
            count:   { $sum: 1 },
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
            _id:     0,
            status:  '$_id',
            count:   1,
            revenue: { $round: ['$revenue', 0] },
          },
        },
      ]),

      // ── Monthly stats (last 12 months) ────────────────────────────────────
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
            },
          },
        },
        {
          $group: {
            _id: {
              year:  { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            orders:  { $sum: 1 },
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
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id:     0,
            year:    '$_id.year',
            month:   '$_id.month',
            label:   { $arrayElemAt: [MONTH_NAMES, { $subtract: ['$_id.month', 1] }] },
            orders:  1,
            revenue: { $round: ['$revenue', 0] },
          },
        },
      ]),

      // ── User count ────────────────────────────────────────────────────────
      userModel.countDocuments({ role: 'customer' }),

      // ── Category count ────────────────────────────────────────────────────
      categoryModel.countDocuments({ isActive: true }),

      // ── Blog count ────────────────────────────────────────────────────────
      blogModel.countDocuments(),

      // ── Contact stats ─────────────────────────────────────────────────────
      Promise.all([
        contactModel.countDocuments(),
        contactModel.countDocuments({ status: 'new' }),
      ]),

      // ── Coupon stats ──────────────────────────────────────────────────────
      Promise.all([
        Coupon.countDocuments(),
        Coupon.countDocuments({ isActive: true }),
      ]),

      // ── Recent orders (last 8) ────────────────────────────────────────────
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select('orderNumber grandTotal status payment.method payment.status billing.firstName billing.lastName createdAt items')
        .lean(),

      // ── Low stock products (stockCount <= 5 and inStock = true) ──────────
      productModel.find({
        inStock: true,
        stockCount: { $lte: 5, $gte: 1 },
      })
        .sort({ stockCount: 1 })
        .limit(10)
        .select('name stockCount price category image')
        .lean(),

      // ── Recent contacts (last 5) ──────────────────────────────────────────
      contactModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ])

    // ── Build response ────────────────────────────────────────────────────────

    const pStats    = productStats[0] || {}
    const oStats    = orderStats[0]   || {}
    const [totalContacts, unreadContacts] = contactData
    const [totalCoupons,  activeCoupons]  = couponData

    // Normalize monthly stats — fill in missing months with 0
    const now        = new Date()
    const last12     = []
    for (let i = 11; i >= 0; i--) {
      const d       = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year    = d.getFullYear()
      const month   = d.getMonth() + 1
      const label   = MONTH_NAMES[month - 1]
      const existing = monthlyAgg.find(
        m => m.year === year && m.month === month
      )
      last12.push({
        year,
        month,
        label: `${label} ${year === now.getFullYear() ? '' : year}`.trim(),
        orders:  existing?.orders  ?? 0,
        revenue: existing?.revenue ?? 0,
      })
    }

    // Normalize orders by status — ensure all statuses have an entry
    const STATUSES = ['placed','confirmed','processing','shipped','delivered','cancelled','refunded']
    const ordersByStatus = STATUSES.map(status => {
      const found = orderByStatus.find(o => o.status === status)
      return {
        status,
        count:   found?.count   ?? 0,
        revenue: found?.revenue ?? 0,
      }
    })

    // Normalize recent orders
    const normalizedRecentOrders = recentOrders.map(o => ({
      _id:          o._id,
      orderNumber:  o.orderNumber,
      grandTotal:   o.grandTotal,
      status:       o.status,
      paymentStatus: o.payment?.status,
      paymentMethod: o.payment?.method,
      customerName: `${o.billing?.firstName ?? ''} ${o.billing?.lastName ?? ''}`.trim() || 'Guest',
      itemCount:    o.items?.length ?? 0,
      date:         o.createdAt,
    }))

    res.json({
      success: true,
      data: {
        // ── KPI cards ──────────────────────────────────────────────────────
        totalProducts:   pStats.totalProducts   || 0,
        totalStockCount: pStats.totalStock      || 0,
        inStockCount:    pStats.inStockCount    || 0,
        featuredCount:   pStats.featuredCount   || 0,
        bestsellerCount: pStats.bestsellerCount || 0,
        totalViews:      pStats.totalViews      || 0,
        avgPrice:        Math.round((pStats.avgPrice || 0) * 100) / 100,
        lowStockCount:   lowStockProducts.length,
        outOfStockCount: (pStats.totalProducts || 0) - (pStats.inStockCount || 0),

        totalOrders:  oStats.totalOrders  || 0,
        totalRevenue: Math.round(oStats.totalRevenue || 0),
        paidOrders:   oStats.paidOrders   || 0,
        codOrders:    oStats.codOrders    || 0,
        mrpTotalAll:  Math.round(oStats.mrpTotalAll || 0),
        totalSaved:   Math.round(oStats.totalSaved || 0),

        totalCustomers: userCount,

        totalCategories:  categoryCount,
        totalBlogs:       blogCount,
        totalContacts:    totalContacts,
        unreadContacts:   unreadContacts,
        totalCoupons:     totalCoupons,
        activeCoupons:    activeCoupons,

        // ── Charts ─────────────────────────────────────────────────────────
        ordersByStatus,
        monthlyStats: last12,

        // ── Recent data ────────────────────────────────────────────────────
        recentOrders:     normalizedRecentOrders,
        lowStockProducts,
        recentContacts,
      },
    })
  } catch (error) {
    console.error('[dashboardStats]', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export { getDashboardStats }
