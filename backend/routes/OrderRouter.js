// backend/routes/OrderRouter.js
//
// USER ORDER API — all routes require login via userAuth
//
// Route map:
//   POST   /api/orders/place                → Place COD order
//   GET    /api/orders/my                   → All orders for logged-in user (with filter + pagination)
//   GET    /api/orders/my/stats             → Order counts by status (for dashboard)
//   GET    /api/orders/:orderNumber         → Full order detail (enriched)
//   GET    /api/orders/:orderNumber/track   → Tracking info only
//   PATCH  /api/orders/:orderNumber/cancel  → Cancel order
//   POST   /api/orders/:orderNumber/reorder → Get items in cartSlice format
//
import express from "express";
import Order   from "../models/Order.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// cartSlice stores { id } — Order model requires { productId }
const normalizeItems = (items) =>
  items.map((item) => ({
    productId: item.productId || item.id || item._id || "unknown",
    name:      item.name      || "Product",
    image:     item.image     || "",
    price:     Number(item.price)            || 0,
    mrp:       Number(item.mrp || item.price) || 0,
    quantity:  Number(item.quantity)         || 1,
    subcat:    item.subcat || "",
  }));

const normalizeBilling = (b) => ({
  firstName:  b.firstName  || "",
  lastName:   b.lastName   || "",
  email:      b.email      || "",
  phone:      b.phone      || "",
  address:    b.address    || "",
  apartment:  b.apartment  || "",
  city:       b.city       || "",
  state:      b.state      || "",
  pincode:    b.pincode    || "",
  country:    b.country    || "India",
  orderNotes: b.orderNotes || "",
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/place
// Place a Cash on Delivery order.
// Body: { items, billing, grandTotal, deliveryCharge }
// Returns: { success, orderId, message }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/place", userAuth, async (req, res) => {
  try {
    const userId = req.userId || null;
    const { items, billing, grandTotal, deliveryCharge } = req.body;

    if (!items?.length)
      return res.status(400).json({ success: false, message: "items must not be empty" });
    if (!billing)
      return res.status(400).json({ success: false, message: "billing is required" });
    if (!grandTotal)
      return res.status(400).json({ success: false, message: "grandTotal is required" });

    const normalized = normalizeItems(items);
    const subtotal   = normalized.reduce((s, i) => s + i.price * i.quantity, 0);
    const mrpTotal   = normalized.reduce((s, i) => s + i.mrp   * i.quantity, 0);

    const order = new Order({
      userId,
      items:          normalized,
      billing:        normalizeBilling(billing),
      payment:        { method: "cod", status: "pending" },
      subtotal,
      deliveryCharge: Number(deliveryCharge) || 0,
      grandTotal:     Number(grandTotal),
      savedAmount:    Math.max(0, mrpTotal - subtotal),
      status:         "placed",
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await order.save();
    console.log("[orders/place] Saved:", order.orderNumber);

    return res.status(201).json({
      success: true,
      orderId: order.orderNumber,
      message: "COD order placed successfully",
    });
  } catch (err) {
    console.error("[orders/place]", err.message);
    if (err.errors) {
      Object.keys(err.errors).forEach((f) =>
        console.error(`  Validation → ${f}:`, err.errors[f].message)
      );
    }
    return res.status(500).json({
      success: false,
      message: "Failed to place order",
      ...(process.env.NODE_ENV !== "production" && {
        debug: {
          error: err.message,
          validationErrors: err.errors
            ? Object.keys(err.errors).map((f) => ({
                field: f,
                msg:   err.errors[f].message,
              }))
            : undefined,
        },
      }),
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/my
// All orders for the logged-in user, newest first.
//
// Query params (all optional):
//   ?status=placed,confirmed     filter by comma-separated statuses
//   ?payment=paid                filter by payment.status
//   ?page=1&limit=10             pagination (default limit 50, max 50)
//
// Returns: { success, orders[], count, total, page, totalPages }
// ─────────────────────────────────────────────────────────────────────────────
router.get("/my", userAuth, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // Build query filter
    const filter = { userId };

    if (req.query.status) {
      const statuses = req.query.status.split(",").map((s) => s.trim());
      filter.status = { $in: statuses };
    }

    if (req.query.payment) {
      filter["payment.status"] = req.query.payment.trim();
    }

    // Pagination
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    // Run count + data fetch in parallel
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        // Only send fields the MyOrders page needs — keeps payload small
        .select(
          "orderNumber status payment.status payment.method " +
          "grandTotal deliveryCharge savedAmount items " +
          "estimatedDelivery createdAt tracking"
        )
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success:    true,
      orders,
      count:      orders.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[orders/my]", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/my/stats
// Order count per status for the logged-in user.
// Used by profile/dashboard pages to show badges like "3 active orders".
//
// Returns: { success, stats: { placed, confirmed, processing, shipped, delivered, cancelled, refunded, total } }
//
// ⚠ This route MUST be defined BEFORE /:orderNumber — otherwise Express
//   will match "my/stats" as an orderNumber param.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/my/stats", userAuth, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const statusKeys = [
      "placed", "confirmed", "processing",
      "shipped", "delivered", "cancelled", "refunded",
    ];

    // Single aggregation — far faster than 7 separate count queries
    const agg = await Order.aggregate([
      { $match: { userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats = statusKeys.reduce((acc, s) => ({ ...acc, [s]: 0 }), { total: 0 });
    agg.forEach(({ _id, count }) => {
      if (_id in stats) stats[_id] = count;
      stats.total += count;
    });

    // Derived convenience fields
    stats.active   = stats.placed + stats.confirmed + stats.processing + stats.shipped;
    stats.completed = stats.delivered;

    return res.status(200).json({ success: true, stats });
  } catch (err) {
    console.error("[orders/my/stats]", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:orderNumber
// Full order detail with all fields + computed convenience properties.
// Only the owner can access.
//
// Returns: { success, order } — order includes canCancel, isPaid, hasTracking etc.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:orderNumber", userAuth, async (req, res) => {
  try {
    const userId          = req.userId;
    const { orderNumber } = req.params;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const order = await Order.findOne({ orderNumber }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order "${orderNumber}" not found`,
      });
    }

    // Security — only owner can view their order
    if (order.userId?.toString() !== userId?.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Enrich with computed fields so frontend doesn't need to re-derive them
    const enriched = {
      ...order,

      // Convenience booleans
      canCancel:   ["placed", "confirmed"].includes(order.status),
      isPaid:      order.payment?.status === "paid",
      isCOD:       order.payment?.method === "cod",
      hasTracking: !!(order.tracking?.trackingId),
      isActive:    ["placed", "confirmed", "processing", "shipped"].includes(order.status),

      // Human-readable formatted dates (en-IN locale)
      formattedDate: new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      }),
      formattedEstDelivery: order.estimatedDelivery
        ? new Date(order.estimatedDelivery).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
          })
        : null,
      formattedPaidAt: order.payment?.paidAt
        ? new Date(order.payment.paidAt).toLocaleString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })
        : null,
    };

    return res.status(200).json({ success: true, order: enriched });
  } catch (err) {
    console.error("[orders/:orderNumber]", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:orderNumber/track
// Lightweight — returns only tracking + status fields.
// Call this to refresh tracking without re-fetching the full order.
//
// Returns: { success, orderNumber, status, estimatedDelivery, tracking, hasTracking }
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:orderNumber/track", userAuth, async (req, res) => {
  try {
    const userId          = req.userId;
    const { orderNumber } = req.params;

    const order = await Order
      .findOne({ orderNumber })
      .select("userId status tracking estimatedDelivery")
      .lean();

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.userId?.toString() !== userId?.toString())
      return res.status(403).json({ success: false, message: "Access denied" });

    return res.status(200).json({
      success:           true,
      orderNumber,
      status:            order.status,
      estimatedDelivery: order.estimatedDelivery,
      tracking:          order.tracking || {},
      hasTracking:       !!(order.tracking?.trackingId),
    });
  } catch (err) {
    console.error("[orders/track]", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch tracking" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/orders/:orderNumber/cancel
// Cancel an order — only if status is "placed" or "confirmed".
// Only the owner can cancel.
//
// Returns: { success, message, orderNumber, status }
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/:orderNumber/cancel", userAuth, async (req, res) => {
  try {
    const userId          = req.userId;
    const { orderNumber } = req.params;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const order = await Order.findOne({ orderNumber });

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.userId?.toString() !== userId?.toString())
      return res.status(403).json({ success: false, message: "Access denied" });

    if (!["placed", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success:       false,
        message:       `Cannot cancel — order is already "${order.status}"`,
        currentStatus: order.status,
      });
    }

    order.status = "cancelled";
    await order.save();

    console.log("[orders/cancel] Cancelled:", orderNumber);

    return res.status(200).json({
      success:     true,
      message:     "Order cancelled successfully",
      orderNumber: order.orderNumber,
      status:      "cancelled",
    });
  } catch (err) {
    console.error("[orders/cancel]", err.message);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/:orderNumber/reorder
// Returns previous order items in cartSlice format so frontend can add to cart.
// Frontend dispatches addToCart for each returned item.
//
// Returns: { success, items[], message }
//   items: [{ id, name, price, mrp, image, quantity, subcat }]
// ─────────────────────────────────────────────────────────────────────────────
router.post("/:orderNumber/reorder", userAuth, async (req, res) => {
  try {
    const userId          = req.userId;
    const { orderNumber } = req.params;

    const order = await Order
      .findOne({ orderNumber })
      .select("userId items")
      .lean();

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.userId?.toString() !== userId?.toString())
      return res.status(403).json({ success: false, message: "Access denied" });

    // Convert from Order schema back to cartSlice format
    const cartItems = order.items.map((item) => ({
      id:       item.productId,   // cartSlice uses { id }
      name:     item.name,
      price:    item.price,
      mrp:      item.mrp,
      image:    item.image,
      quantity: item.quantity,
      subcat:   item.subcat,
    }));

    return res.status(200).json({
      success: true,
      items:   cartItems,
      message: `${cartItems.length} item${cartItems.length !== 1 ? "s" : ""} ready to add to cart`,
    });
  } catch (err) {
    console.error("[orders/reorder]", err.message);
    return res.status(500).json({ success: false, message: "Failed to get reorder items" });
  }
});

export default router;
