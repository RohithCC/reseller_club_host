// src/app/orderDetailsSlice.js
//
// ✅ Selectors use optional chaining + fallbacks to prevent
//    "Cannot read properties of undefined" if store key name differs.
//
//    Store registration MUST be:
//      orderDetails: orderDetailsReducer   ← slice name "orderDetails"
//
//    If you use a different key (e.g. "orders"), update selectors accordingly.
//
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL;
const authHeader = (token) => ({ token });

// ═══════════════════════════════════════════════════════════════════════════════
// THUNKS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/orders/my
export const fetchMyOrders = createAsyncThunk(
  "orderDetails/fetchMy",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return rejectWithValue("No token");

      const { data } = await axios.get(
        `${BASE}/api/orders/my`,
        { headers: authHeader(token) }
      );

      if (!data.success) return rejectWithValue(data.message);
      return data.orders;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// GET /api/orders/:orderNumber
export const fetchOrderDetail = createAsyncThunk(
  "orderDetails/fetchDetail",
  async ({ orderNumber }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return rejectWithValue("No token");

      const { data } = await axios.get(
        `${BASE}/api/orders/${orderNumber}`,
        { headers: authHeader(token) }
      );

      if (!data.success) return rejectWithValue(data.message);
      return data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// PATCH /api/orders/:orderNumber/cancel
export const cancelUserOrder = createAsyncThunk(
  "orderDetails/cancel",
  async ({ orderNumber }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return rejectWithValue("No token");

      const { data } = await axios.patch(
        `${BASE}/api/orders/${orderNumber}/cancel`,
        {},
        { headers: authHeader(token) }
      );

      if (!data.success) return rejectWithValue(data.message);
      return orderNumber;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLICE
// ═══════════════════════════════════════════════════════════════════════════════
const orderDetailsSlice = createSlice({
  name: "orderDetails",          // ← slice name = store key expected by selectors below
  initialState: {
    orders:     [],
    loading:    false,
    error:      null,

    currentOrder:  null,
    loadingOrder:  false,
    orderError:    null,

    cancelling:  false,
    cancelError: null,
  },

  reducers: {
    clearCurrentOrder(state) {
      state.currentOrder = null;
      state.orderError   = null;
    },
    clearOrderErrors(state) {
      state.cancelError = null;
      state.orderError  = null;
      state.error       = null;
    },
  },

  extraReducers: (builder) => {
    // fetchMyOrders
    builder
      .addCase(fetchMyOrders.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchMyOrders.fulfilled, (s, { payload }) => { s.loading = false; s.orders = payload; })
      .addCase(fetchMyOrders.rejected,  (s, { payload }) => { s.loading = false; s.error = payload; });

    // fetchOrderDetail
    builder
      .addCase(fetchOrderDetail.pending,   (s) => { s.loadingOrder = true;  s.orderError = null; })
      .addCase(fetchOrderDetail.fulfilled, (s, { payload }) => { s.loadingOrder = false; s.currentOrder = payload; })
      .addCase(fetchOrderDetail.rejected,  (s, { payload }) => { s.loadingOrder = false; s.orderError = payload; });

    // cancelUserOrder
    builder
      .addCase(cancelUserOrder.pending,   (s) => { s.cancelling = true;  s.cancelError = null; })
      .addCase(cancelUserOrder.fulfilled, (s, { payload: orderNumber }) => {
        s.cancelling = false;
        const o = s.orders.find((o) => o.orderNumber === orderNumber);
        if (o) o.status = "cancelled";
        if (s.currentOrder?.orderNumber === orderNumber) {
          s.currentOrder.status    = "cancelled";
          s.currentOrder.canCancel = false;
        }
      })
      .addCase(cancelUserOrder.rejected,  (s, { payload }) => { s.cancelling = false; s.cancelError = payload; });
  },
});

export const { clearCurrentOrder, clearOrderErrors } = orderDetailsSlice.actions;
export default orderDetailsSlice.reducer;

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────
// s.orderDetails = the slice state (store key matches slice name above)
// Optional chaining + fallbacks prevent "Cannot read of undefined" crashes
// if the store key is wrong or state hasn't hydrated yet.
// ═══════════════════════════════════════════════════════════════════════════════
export const selectMyOrders      = (s) => s.orderDetails?.orders      ?? [];
export const selectLoadingOrders = (s) => s.orderDetails?.loading     ?? false;
export const selectOrdersError   = (s) => s.orderDetails?.error       ?? null;

export const selectCurrentOrder  = (s) => s.orderDetails?.currentOrder ?? null;
export const selectLoadingOrder  = (s) => s.orderDetails?.loadingOrder ?? false;
export const selectOrderError    = (s) => s.orderDetails?.orderError   ?? null;

export const selectCancelling    = (s) => s.orderDetails?.cancelling   ?? false;
export const selectCancelError   = (s) => s.orderDetails?.cancelError  ?? null;
