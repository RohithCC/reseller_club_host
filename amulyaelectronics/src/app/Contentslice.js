import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const fetchTestimonials = createAsyncThunk(
  "content/fetchTestimonials",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/api/testimonials`);
      if (!data.success) return rejectWithValue(data.message || "Failed to fetch testimonials.");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchBlogs = createAsyncThunk(
  "content/fetchBlogs",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/api/blogs`);
      if (!data.success) return rejectWithValue(data.message || "Failed to fetch blogs.");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const contentSlice = createSlice({
  name: "content",
  initialState: {
    testimonials:        [],
    testimonialsLoading: false,
    testimonialsError:   null,

    blogs:        [],
    blogsLoading: false,
    blogsError:   null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Testimonials
    builder
      .addCase(fetchTestimonials.pending, (state) => {
        state.testimonialsLoading = true;
        state.testimonialsError   = null;
      })
      .addCase(fetchTestimonials.fulfilled, (state, action) => {
        state.testimonialsLoading = false;
        state.testimonials        = action.payload;
      })
      .addCase(fetchTestimonials.rejected, (state, action) => {
        state.testimonialsLoading = false;
        state.testimonialsError   = action.payload;
      });

    // Blogs
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.blogsLoading = true;
        state.blogsError   = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.blogsLoading = false;
        state.blogs        = action.payload;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.blogsLoading = false;
        state.blogsError   = action.payload;
      });
  },
});

export default contentSlice.reducer;