// src/app/userProfileSlice.js
//
// ✅ Aligned to:
//   GET profile → POST /api/user/profile       (userAuth middleware → req.userId)
//   Edit profile→ POST /api/user/update-profile (userAuth middleware → req.userId)
//   Fields: name, email, phone, avatar
//   Read-only: _id, isVerified, isBlocked, walletBalance, loyaltyPoints, date, addresses
//
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL;

// Backend reads req.userId from JWT — never send userId in body
const authHeader = (token) => ({ token });

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchUserProfile = createAsyncThunk(
  "userProfile/fetch",
  async ({ token }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${BASE}/api/user/profile`,
        {},                             // empty body — server reads req.userId
        { headers: authHeader(token) }
      );
      console.log(data)
      if (!data.success) return rejectWithValue(data.message);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "userProfile/update",
  async ({ token, name, phone, avatar }, { rejectWithValue }) => {
    try {
      const body = {};
      if (name   !== undefined) body.name   = name;
      if (phone  !== undefined) body.phone  = phone;
      if (avatar !== undefined) body.avatar = avatar;

      const { data } = await axios.post(
        `${BASE}/api/user/update-profile`,
        body,                           // userId not needed — middleware sets req.userId
        { headers: authHeader(token) }
      );
      if (!data.success) return rejectWithValue(data.message);
      // Return the updated fields so we can patch state without a re-fetch
      return { name, phone, avatar };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState: {
    user:          null,
    loading:       false,
    error:         null,
    updating:      false,
    updateError:   null,
    updateSuccess: false,
  },
  reducers: {
    clearProfileMessages(state) {
      state.error         = null;
      state.updateError   = null;
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // fetch
    builder
      .addCase(fetchUserProfile.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchUserProfile.fulfilled, (s, { payload }) => { s.loading = false; s.user = payload; })
      .addCase(fetchUserProfile.rejected,  (s, { payload }) => { s.loading = false; s.error = payload; });

    // update
    builder
      .addCase(updateUserProfile.pending,   (s) => { s.updating = true; s.updateError = null; s.updateSuccess = false; })
      .addCase(updateUserProfile.fulfilled, (s, { payload }) => {
        s.updating      = false;
        s.updateSuccess = true;
        // Patch the cached user object
        if (s.user) {
          if (payload.name   !== undefined) s.user.name   = payload.name;
          if (payload.phone  !== undefined) s.user.phone  = payload.phone;
          if (payload.avatar !== undefined) s.user.avatar = payload.avatar;
        }
      })
      .addCase(updateUserProfile.rejected, (s, { payload }) => { s.updating = false; s.updateError = payload; });
  },
});

export const { clearProfileMessages } = userProfileSlice.actions;
export default userProfileSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUserProfile    = (s) => s.userProfile.user;
export const selectProfileLoading = (s) => s.userProfile.loading;
export const selectProfileError   = (s) => s.userProfile.error;
export const selectUpdating       = (s) => s.userProfile.updating;
export const selectUpdateError    = (s) => s.userProfile.updateError;
export const selectUpdateSuccess  = (s) => s.userProfile.updateSuccess;
