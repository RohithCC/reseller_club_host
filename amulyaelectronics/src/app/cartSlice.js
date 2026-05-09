// src/app/cartSlice.js
// ─────────────────────────────────────────────────────────────────────────────
//  ARCHITECTURE
//  ─────────────────────────────────────────────────────────────────────────
//  • Logged-in users  → every mutation calls the backend API and stores the
//    response in Redux.  The server is the source of truth.
//  • Guest users      → state lives only in Redux (in-memory); it is NOT
//    persisted to localStorage so there is no stale-data confusion.
//    On login the caller should dispatch syncGuestCartToServer() to merge.
//  • coupon           → persisted on the server cart document (PUT /api/cart/coupon)
//    for logged-in users; kept only in Redux for guests.
//
//  TOKEN RESOLUTION
//  ─────────────────────────────────────────────────────────────────────────
//  All thunks resolve the auth token from  state.auth.token  at dispatch time
//  so callers never have to pass it explicitly.
//
//  REDUX SHAPE
//  ─────────────────────────────────────────────────────────────────────────
//  state.cart = {
//    items   : CartItem[],   // { id, productId, name, image, price, mrp, subcat, quantity, gstRate? }
//    coupon  : CouponObj | null,
//    loading : boolean,
//    error   : string | null,
//  }
// ─────────────────────────────────────────────────────────────────────────────

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api"; // your axios instance (baseURL already set)

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Grab token from root state (works for every thunk below) */
const getToken = (state) => state.auth?.token ?? null;

/** Normalise a server cart item → Redux item shape */
const normaliseServerItem = (si) => ({
  id:        si.productId ?? si._id ?? si.id,
  productId: si.productId ?? si._id ?? si.id,
  name:      si.name,
  image:     Array.isArray(si.image) ? si.image[0] : (si.image || si.images?.[0] || ""),
  price:     si.price   ?? si.salePrice ?? 0,
  mrp:       si.mrp     ?? si.originalPrice ?? si.price ?? 0,
  subcat:    si.subcat  ?? si.subCategory ?? "",
  quantity:  si.quantity ?? 1,
  gstRate:   si.gstRate ?? si.taxRate ?? undefined,
});

/** Normalise a full server cart response → { items, coupon } */
const normaliseServerCart = (serverCart) => ({
  items:  (serverCart.items || []).map(normaliseServerItem),
  coupon: serverCart.coupon && Object.keys(serverCart.coupon).length > 0
    ? serverCart.coupon
    : null,
});

/** Build the product payload the backend addToCart endpoint expects */
const toServerPayload = (item) => ({
  productId: item.id ?? item.productId,
  name:      item.name,
  image:     Array.isArray(item.image) ? item.image[0] : (item.image || ""),
  price:     item.price   ?? 0,
  mrp:       item.mrp     ?? item.price ?? 0,
  subcat:    item.subcat  ?? item.subCategory ?? "",
  quantity:  item.quantity ?? 1,
  gstRate:   item.gstRate ?? item.taxRate ?? undefined,
});

// ─── async thunks ─────────────────────────────────────────────────────────────

/**
 * loadCart
 * Logged-in  → GET /api/cart   (server is source of truth)
 * Guest      → resolves with null (no-op fetch, Redux state unchanged)
 */
export const loadCart = createAsyncThunk(
  "cart/loadCart",
  async (_, { getState, rejectWithValue }) => {
    const token = getToken(getState());
    if (!token) return null; // guest: nothing to load from server
    try {
      const { data } = await api.get("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) return rejectWithValue(data.message);
      return normaliseServerCart(data.cart);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load cart");
    }
  }
);

/**
 * addToCart
 * Logged-in  → POST /api/cart/add
 * Guest      → handled optimistically in reducer (no API call)
 */
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (product, { getState, rejectWithValue }) => {
    const token = getToken(getState());
    if (!token) return null; // guest path handled by reducer

    try {
      const { data } = await api.post(
        "/api/cart/add",
        toServerPayload(product),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) return rejectWithValue(data.message);
      return normaliseServerCart(data.cart);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add to cart");
    }
  }
);

/**
 * updateItemQty
 * Logged-in  → PUT /api/cart/update  { productId, quantity }
 * Guest      → handled optimistically in reducer
 */
export const updateItemQty = createAsyncThunk(
  "cart/updateItemQty",
  async ({ id, quantity }, { getState, rejectWithValue }) => {
    const token = getToken(getState());
    if (!token) return null;

    try {
      const { data } = await api.put(
        "/api/cart/update",
        { productId: id, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) return rejectWithValue(data.message);
      return normaliseServerCart(data.cart);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update quantity");
    }
  }
);

/**
 * removeItem
 * Logged-in  → DELETE /api/cart/item/:productId
 * Guest      → handled optimistically in reducer
 */
export const removeItem = createAsyncThunk(
  "cart/removeItem",
  async (productId, { getState, rejectWithValue }) => {
    const token = getToken(getState());
    if (!token) return null;

    try {
      const { data } = await api.delete(`/api/cart/item/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) return rejectWithValue(data.message);
      return normaliseServerCart(data.cart);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to remove item");
    }
  }
);

/**
 * clearAll
 * Logged-in  → DELETE /api/cart/clear  (single API call — clears items + coupon server-side)
 * Guest      → handled in reducer (clears items + coupon in Redux)
 *
 * FIX: Previously the Cart component called dispatch(clearAll()) then
 * dispatch(saveCoupon(null)) separately, causing a redundant API call and a
 * potential race condition.  Now clearAll itself is responsible for clearing the
 * coupon on the server.  The Cart component should call ONLY dispatch(clearAll()).
 */
export const clearAll = createAsyncThunk(
  "cart/clearAll",
  async (_, { getState, rejectWithValue }) => {
    const token = getToken(getState());
    if (!token) return null; // guest: reducer handles everything

    try {
      const { data } = await api.delete("/api/cart/clear", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) return rejectWithValue(data.message);
      // Server cleared both items and coupon — reflect that in Redux
      return { items: [], coupon: null };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to clear cart");
    }
  }
);

/**
 * saveCoupon
 * Logged-in  → PUT /api/cart/coupon  { coupon }
 * Guest      → stored only in Redux (handled in reducer)
 */
export const saveCoupon = createAsyncThunk(
  "cart/saveCoupon",
  async (coupon, { getState, rejectWithValue }) => {
    const token = getToken(getState());
    if (!token) return coupon; // guest: just return value for reducer

    try {
      const { data } = await api.put(
        "/api/cart/coupon",
        { coupon: coupon ?? null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) return rejectWithValue(data.message);
      // Return whatever the server echoes back on the cart
      return data.cart?.coupon && Object.keys(data.cart.coupon).length > 0
        ? data.cart.coupon
        : null;
    } catch (err) {
      // Non-fatal: keep the coupon in Redux even if server save fails
      return coupon;
    }
  }
);

/**
 * syncGuestCartToServer
 * Called after login to merge the in-memory guest cart into the user's server cart.
 * POST /api/cart/sync  { items }
 */
export const syncGuestCartToServer = createAsyncThunk(
  "cart/syncGuestCartToServer",
  async (_, { getState, rejectWithValue }) => {
    const token = getToken(getState());
    if (!token) return null;

    const guestItems = getState().cart.items;
    if (!guestItems.length) return null; // nothing to sync

    try {
      const { data } = await api.post(
        "/api/cart/sync",
        { items: guestItems.map(toServerPayload) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) return rejectWithValue(data.message);
      return normaliseServerCart(data.cart);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to sync cart");
    }
  }
);

/**
 * clearCart  (alias used by Checkout after order success)
 * Same as clearAll but exported under the name Checkout currently imports.
 */
export const clearCart = clearAll;

// ─── slice ────────────────────────────────────────────────────────────────────

const initialState = {
  items:   [],
  coupon:  null,
  loading: false,
  error:   null,
};

/** Merge server cart response into state (used by multiple fulfilled handlers) */
function applyServerCart(state, serverCart) {
  if (!serverCart) return; // guest path: server returned null — keep existing Redux state
  state.items  = serverCart.items;
  state.coupon = serverCart.coupon ?? null;
}

// ── optimistic guest helpers ──────────────────────────────────────────────────

function guestAdd(state, product) {
  const id       = product.id ?? product.productId;
  const existing = state.items.find((i) => i.id === id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + (product.quantity ?? 1), 10);
  } else {
    state.items.push({
      id,
      productId: id,
      name:      product.name,
      image:     Array.isArray(product.image) ? product.image[0] : (product.image || ""),
      price:     product.price   ?? 0,
      mrp:       product.mrp     ?? product.price ?? 0,
      subcat:    product.subcat  ?? product.subCategory ?? "",
      quantity:  Math.min(product.quantity ?? 1, 10),
      gstRate:   product.gstRate ?? product.taxRate ?? undefined,
    });
  }
}

function guestUpdateQty(state, id, quantity) {
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  if (quantity <= 0) {
    state.items.splice(idx, 1);
  } else {
    state.items[idx].quantity = Math.min(quantity, 10);
  }
}

function guestRemove(state, id) {
  state.items = state.items.filter((i) => i.id !== id);
}

// ─── the slice ────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: "cart",
  initialState,

  // synchronous actions (none exposed externally — use thunks)
  reducers: {},

  extraReducers: (builder) => {

    // ── loadCart ────────────────────────────────────────────────────────────
    builder
      .addCase(loadCart.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(loadCart.fulfilled, (state, { payload }) => {
        state.loading = false;
        applyServerCart(state, payload); // payload=null for guests → no change
      })
      .addCase(loadCart.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload ?? "Failed to load cart";
      });

    // ── addToCart ───────────────────────────────────────────────────────────
    builder
      .addCase(addToCart.pending,   (state, { meta }) => {
        state.error = null;
        // Optimistic update for BOTH guests and logged-in users
        guestAdd(state, meta.arg);
      })
      .addCase(addToCart.fulfilled, (state, { payload }) => {
        applyServerCart(state, payload); // replace optimistic data with server truth
      })
      .addCase(addToCart.rejected,  (state, { payload, meta }) => {
        // Roll back optimistic add on failure
        guestRemove(state, meta.arg.id ?? meta.arg.productId);
        state.error = payload ?? "Failed to add item";
      });

    // ── updateItemQty ───────────────────────────────────────────────────────
    builder
      .addCase(updateItemQty.pending,   (state, { meta }) => {
        state.error = null;
        guestUpdateQty(state, meta.arg.id, meta.arg.quantity);
      })
      .addCase(updateItemQty.fulfilled, (state, { payload }) => {
        applyServerCart(state, payload);
      })
      .addCase(updateItemQty.rejected,  (state, { payload }) => {
        state.error = payload ?? "Failed to update quantity";
      });

    // ── removeItem ──────────────────────────────────────────────────────────
    builder
      .addCase(removeItem.pending,   (state, { meta }) => {
        state.error = null;
        guestRemove(state, meta.arg);
      })
      .addCase(removeItem.fulfilled, (state, { payload }) => {
        applyServerCart(state, payload);
      })
      .addCase(removeItem.rejected,  (state, { payload }) => {
        state.error = payload ?? "Failed to remove item";
      });

    // ── clearAll / clearCart ─────────────────────────────────────────────────
    // FIX: Optimistic clear covers BOTH items AND coupon in a single action.
    // No separate saveCoupon(null) call is needed anywhere after clearAll.
    builder
      .addCase(clearAll.pending,   (state) => {
        state.error  = null;
        state.items  = [];    // optimistic: empty immediately
        state.coupon = null;  // optimistic: clear coupon immediately
      })
      .addCase(clearAll.fulfilled, (state, { payload }) => {
        // payload = { items: [], coupon: null } for logged-in users
        // payload = null for guests (optimistic already applied above)
        applyServerCart(state, payload);
      })
      .addCase(clearAll.rejected,  (state, { payload }) => {
        // Items + coupon were cleared optimistically — they stay cleared.
        // Log the error but don't re-populate state (clearing is safe to keep).
        state.error = payload ?? "Failed to clear cart";
      });

    // ── saveCoupon ──────────────────────────────────────────────────────────
    builder
      .addCase(saveCoupon.pending,   (state, { meta }) => {
        // Apply immediately so UI updates without waiting for server round-trip
        state.coupon = meta.arg ?? null;
        state.error  = null;
      })
      .addCase(saveCoupon.fulfilled, (state, { payload }) => {
        // Server may return a slightly different coupon object — prefer it
        state.coupon = payload ?? null;
      })
      .addCase(saveCoupon.rejected,  (state, { payload }) => {
        // Non-fatal: coupon stays as set by pending handler
        state.error = payload ?? null;
      });

    // ── syncGuestCartToServer ────────────────────────────────────────────────
    builder
      .addCase(syncGuestCartToServer.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(syncGuestCartToServer.fulfilled, (state, { payload }) => {
        state.loading = false;
        applyServerCart(state, payload);
      })
      .addCase(syncGuestCartToServer.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload ?? "Failed to sync cart";
      });
  },
});

export default cartSlice.reducer;

// ─── selectors ────────────────────────────────────────────────────────────────
export const selectCartItems   = (state) => state.cart.items;
export const selectCartCoupon  = (state) => state.cart.coupon;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError   = (state) => state.cart.error;
export const selectCartCount   = (state) =>
  state.cart.items.reduce((n, i) => n + (i.quantity ?? 1), 0);