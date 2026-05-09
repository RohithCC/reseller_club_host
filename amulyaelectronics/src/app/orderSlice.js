// src/app/orderSlice.js
// ─────────────────────────────────────────────────────────────────────────────
// MATCHED TO BACKEND ROUTES (orderRoute.js):
//
//  POST /api/order/razorpay        → placeOrderRazorpay  (creates RZP order + DB record)
//  POST /api/order/verify-payment  → verifyRazorpay      (HMAC verify + marks payment paid)
//  POST /api/order/place           → placeOrder          (COD)
//
// REQUEST BODY SHAPES (matched to orderController.js exactly):
//  razorpay:       { userId, items, address, couponCode, customerNote }
//  verify-payment: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
//  place (COD):    { userId, items, address, couponCode, customerNote }
//
// On SUCCESS (either method): orderStatus → "success"
//   Checkout.jsx useEffect fires: clearCart() + resetOrder() + navigate("/orders")
// ─────────────────────────────────────────────────────────────────────────────

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api"; // shared axios instance — correct baseURL + auth header

// ─────────────────────────────────────────────────────────────────────────────
// THUNK: Create Razorpay Order
// Route:  POST /api/order/razorpay   (placeOrderRazorpay controller)
// Returns from controller: { success, orderId, razorpayOrderId, amount, currency, key }
// Normalised return:        { id (= razorpayOrderId), amount, currency, orderId }
// ─────────────────────────────────────────────────────────────────────────────
export const createRazorpayOrder = createAsyncThunk(
  "order/createRazorpayOrder",
  async ({ userId, items, address, couponCode, customerNote }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/order/razorpay", {
        userId,
        items,
        address,
        couponCode:   couponCode   || "",
        customerNote: customerNote || "",
      });

      if (!data?.success) {
        return rejectWithValue(data?.message || "Failed to create payment order. Please try again.");
      }

      // Normalise to what Checkout.jsx expects: { id, amount, currency, orderId }
      // id      = razorpayOrderId  → passed to Razorpay SDK as order_id
      // orderId = MongoDB _id      → forwarded to verify-payment
      return {
        id:       data.razorpayOrderId,
        amount:   data.amount,           // already in paise from controller
        currency: data.currency || "INR",
        orderId:  data.orderId,          // MongoDB _id
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
        "Failed to create payment order. Check your connection and try again."
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// THUNK: Verify Razorpay Payment
// Route:  POST /api/order/verify-payment   (verifyRazorpay controller)
// Body:   { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
// orderId here is the MongoDB _id returned by createRazorpayOrder above.
// ─────────────────────────────────────────────────────────────────────────────
export const verifyRazorpayPayment = createAsyncThunk(
  "order/verifyRazorpayPayment",
  async (
    { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post("/api/order/verify-payment", {
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!data?.success) {
        return rejectWithValue(data?.message || "Payment verification failed. Please contact support.");
      }

      return {
        orderId,
        paymentId: razorpay_payment_id,
        method:    "razorpay",
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
        "Network error during payment verification. Your payment may have succeeded — " +
        "please check your email or contact support before retrying."
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// THUNK: Place COD Order
// Route:  POST /api/order/place   (placeOrder controller)
// ─────────────────────────────────────────────────────────────────────────────
export const placeCODOrder = createAsyncThunk(
  "order/placeCODOrder",
  async (
    { userId, items, address, couponCode, customerNote },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post("/api/order/place", {
        userId,
        items,
        address,
        couponCode:   couponCode   || "",
        customerNote: customerNote || "",
      });

      if (!data?.success) {
        return rejectWithValue(data?.message || "Failed to place order. Please try again.");
      }

      return {
        orderId: data.orderId,
        method:  "cod",
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
        "Failed to place order. Please check your connection and try again."
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────────────────────────────────────
const orderSlice = createSlice({
  name: "order",
  initialState: {
    status:        "idle",      // "idle"|"creatingOrder"|"verifying"|"placingCOD"|"success"|"failed"
    error:         null,
    orderId:       null,        // MongoDB _id of confirmed order
    paymentId:     null,        // Razorpay payment_id (null for COD)
    paymentMethod: "razorpay",  // persisted selection across steps
    orders:        [],
  },
  reducers: {
    setPaymentMethod: (state, { payload }) => {
      state.paymentMethod = payload;
    },
    setOrderError: (state, { payload }) => {
      state.error  = payload;
      state.status = "failed";
    },
    clearOrderError: (state) => {
      state.error = null;
      if (state.status === "failed") state.status = "idle";
    },
    resetOrder: (state) => {
      state.status    = "idle";
      state.error     = null;
      state.orderId   = null;
      state.paymentId = null;
      // Note: paymentMethod is intentionally NOT reset so the user's
      // preference is remembered if they place another order.
    },
  },
  extraReducers: (builder) => {

    // ── createRazorpayOrder ───────────────────────────────────────────────
    builder
      .addCase(createRazorpayOrder.pending, (state) => {
        state.status = "creatingOrder";
        state.error  = null;
      })
      .addCase(createRazorpayOrder.fulfilled, (state) => {
        // Don't mark "success" yet — the Razorpay popup still has to open
        // and the user still has to pay. Component controls spinner via rzpLoading.
        state.status = "idle";
        state.error  = null;
      })
      .addCase(createRazorpayOrder.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error  = payload ?? "Failed to initiate payment.";
      });

    // ── verifyRazorpayPayment ─────────────────────────────────────────────
    builder
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.status = "verifying";
        state.error  = null;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state, { payload }) => {
        state.status        = "success";
        state.orderId       = payload.orderId;
        state.paymentId     = payload.paymentId;
        state.paymentMethod = payload.method;
        state.error         = null;
      })
      .addCase(verifyRazorpayPayment.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error  = payload ?? "Payment verification failed.";
      });

    // ── placeCODOrder ─────────────────────────────────────────────────────
    builder
      .addCase(placeCODOrder.pending, (state) => {
        state.status = "placingCOD";
        state.error  = null;
      })
      .addCase(placeCODOrder.fulfilled, (state, { payload }) => {
        state.status        = "success";
        state.orderId       = payload.orderId;
        state.paymentMethod = payload.method;
        state.paymentId     = null;    // COD has no payment ID
        state.error         = null;
      })
      .addCase(placeCODOrder.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error  = payload ?? "Failed to place COD order.";
      });
  },
});

export const {
  setPaymentMethod,
  setOrderError,
  clearOrderError,
  resetOrder,
} = orderSlice.actions;

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────
export const selectOrderStatus    = (s) => s.order.status;
export const selectOrderError     = (s) => s.order.error;
export const selectOrderId        = (s) => s.order.orderId;
export const selectPaymentId      = (s) => s.order.paymentId;
export const selectPaymentMethod  = (s) => s.order.paymentMethod;
export const selectAllOrders      = (s) => s.order.orders;

export const selectIsPlacingOrder = (s) =>
  ["creatingOrder", "verifying", "placingCOD"].includes(s.order.status);

export default orderSlice.reducer;