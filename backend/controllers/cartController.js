// ─────────────────────────────────────────────────────────────────────
//  backend/controllers/cartController.js
// ─────────────────────────────────────────────────────────────────────
import Cart from "../models/Cart.js";

// ── Auth helper ───────────────────────────────────────────────────────
// Accepts userId from EITHER pattern:
//   • req.user._id   (set by passport / jwt middleware that populates req.user)
//   • req.userId     (set by older middleware that only sets req.userId)
function getUserId(req) {
  return req.user?._id ?? req.user?.id ?? req.userId ?? null;
}

// ── Cart helper ───────────────────────────────────────────────────────
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [], coupon: {} });
  return cart;
}

// ── mergeItems helper (safe fallback if Cart model lacks the method) ──
// Merges guest items into the existing server cart.
// If `cart.mergeItems` is defined on the model, uses it.
// Otherwise falls back to the inline logic below.
function mergeItemsIntoCart(cart, guestItems = []) {
  if (typeof cart.mergeItems === "function") {
    cart.mergeItems(guestItems);
    return;
  }

  // Inline merge: if item already exists → add quantities (cap at 10);
  //               otherwise push the new item.
  for (const gi of guestItems) {
    const pid = gi.productId ?? gi.id;
    if (!pid) continue;

    const existing = cart.items.find((i) => String(i.productId) === String(pid));
    if (existing) {
      existing.quantity = Math.min(existing.quantity + (gi.quantity ?? 1), 10);
    } else {
      cart.items.push({
        productId: pid,
        name:      gi.name      || "",
        image:     Array.isArray(gi.image) ? gi.image[0] : (gi.image || ""),
        price:     gi.price     ?? 0,
        mrp:       gi.mrp       ?? gi.price ?? 0,
        subcat:    gi.subcat    ?? gi.subCategory ?? "",
        quantity:  Math.min(gi.quantity ?? 1, 10),
        gstRate:   gi.gstRate   ?? gi.taxRate ?? undefined,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// GET /api/cart
// Returns the current user's cart (creates one if missing)
// ─────────────────────────────────────────────────────────────────────
export const getCart = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Not authenticated" });

    const cart = await getOrCreateCart(userId);
    res.json({ success: true, cart });
  } catch (err) {
    console.error("getCart:", err);
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/cart/add
// Body: { productId, name, image, price, mrp, subcat, gstRate?, quantity? }
// ─────────────────────────────────────────────────────────────────────
export const addToCart = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Not authenticated" });

    const {
      productId,
      name,
      image    = "",
      price,
      mrp,
      subcat   = "",
      gstRate,
      taxRate,
      quantity = 1,
    } = req.body;

    if (!productId || !name || typeof price !== "number") {
      return res.status(400).json({
        success: false,
        message: "productId, name, and price (number) are required.",
      });
    }

    const cart     = await getOrCreateCart(userId);
    const existing = cart.items.find((i) => String(i.productId) === String(productId));

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, 10);
    } else {
      const newItem = {
        productId,
        name,
        image:    Array.isArray(image) ? image[0] : image,
        price,
        mrp:      mrp ?? price,
        subcat,
        quantity: Math.min(quantity, 10),
      };
      // Store gstRate only when provided — avoids overriding the product default
      const rate = gstRate ?? taxRate;
      if (rate !== undefined) newItem.gstRate = rate;

      cart.items.push(newItem);
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("addToCart:", err);
    res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// PUT /api/cart/update
// Body: { productId, quantity }
// Sets quantity exactly (1..10). quantity <= 0 → removes item.
// ─────────────────────────────────────────────────────────────────────
export const updateQuantity = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Not authenticated" });

    const { productId, quantity } = req.body;
    if (!productId || typeof quantity !== "number") {
      return res.status(400).json({
        success: false,
        message: "productId and quantity (number) are required.",
      });
    }

    const cart = await getOrCreateCart(userId);
    const idx  = cart.items.findIndex((i) => String(i.productId) === String(productId));

    if (idx === -1)
      return res.status(404).json({ success: false, message: "Item not in cart" });

    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = Math.min(quantity, 10);
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("updateQuantity:", err);
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/cart/item/:productId
// ─────────────────────────────────────────────────────────────────────
export const removeItem = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Not authenticated" });

    const { productId } = req.params;
    const cart = await getOrCreateCart(userId);
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => String(i.productId) !== String(productId));

    if (cart.items.length === before)
      return res.status(404).json({ success: false, message: "Item not found in cart" });

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("removeItem:", err);
    res.status(500).json({ success: false, message: "Failed to remove item" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/cart/clear
// ─────────────────────────────────────────────────────────────────────
export const clearCart = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Not authenticated" });

    const cart  = await getOrCreateCart(userId);
    cart.items  = [];
    cart.coupon = {};
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("clearCart:", err);
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/cart/sync
// Merges guest cart items (from Redux / localStorage) into server cart on login.
// Body: { items: CartItem[] }
// ─────────────────────────────────────────────────────────────────────
export const syncGuestCart = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Not authenticated" });

    const { items = [] } = req.body;
    const cart = await getOrCreateCart(userId);
    mergeItemsIntoCart(cart, items);
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("syncGuestCart:", err);
    res.status(500).json({ success: false, message: "Failed to sync cart" });
  }
};

// ─────────────────────────────────────────────────────────────────────
// PUT /api/cart/coupon
// Body: { coupon: { code, label, type, value, maxDiscount, discount } | null }
// ─────────────────────────────────────────────────────────────────────
export const setCoupon = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(401).json({ success: false, message: "Not authenticated" });

    const { coupon } = req.body;
    const cart  = await getOrCreateCart(userId);
    cart.coupon = coupon && Object.keys(coupon).length > 0 ? coupon : {};
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("setCoupon:", err);
    res.status(500).json({ success: false, message: "Failed to save coupon" });
  }
};