// app/categorySlice.js
// Fetches the full category tree from /api/category/tree
// and caches it in Redux so any component can consume it
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ── Thunk ─────────────────────────────────────────────────────────────────────
export const fetchCategoryTree = createAsyncThunk(
  "categories/fetchTree",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/category/tree?activeOnly=true`
      );
      if (data.success) return data.tree; // [{ _id, name, subCategories:[{name}] }]
      return rejectWithValue(data.message || "Failed to load categories");
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Network error");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const categorySlice = createSlice({
  name: "categories",
  initialState: {
    tree:    [],      // full nested tree
    status:  "idle",  // 'idle' | 'loading' | 'succeeded' | 'failed'
    error:   null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoryTree.pending,   (state) => { state.status = "loading"; state.error = null; })
      .addCase(fetchCategoryTree.fulfilled, (state, action) => { state.status = "succeeded"; state.tree = action.payload; })
      .addCase(fetchCategoryTree.rejected,  (state, action) => { state.status = "failed";    state.error = action.payload; });
  },
});

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectCategoryTree    = (state) => state.categories.tree;
export const selectCategoryStatus  = (state) => state.categories.status;
export const selectCategoryNames   = (state) => state.categories.tree.map((c) => c.name);
export const selectSubCategories   = (catName) => (state) =>
  state.categories.tree.find((c) => c.name === catName)?.subCategories ?? [];

export default categorySlice.reducer;