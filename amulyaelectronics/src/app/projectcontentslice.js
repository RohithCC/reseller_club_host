// src/app/projectcontentslice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

// ─── Async Thunk ──────────────────────────────────────────────────────────────
export const fetchProjects = createAsyncThunk(
  "projectContent/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/api/projects`);
      if (!data.success)
        return rejectWithValue(data.message || "Failed to fetch projects.");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const projectContentSlice = createSlice({
  name: "projectContent",
  initialState: {
    projects:        [],
    projectsLoading: false,
    projectsError:   null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.projectsLoading = true;
        state.projectsError   = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projectsLoading = false;
        state.projects        = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.projectsLoading = false;
        state.projectsError   = action.payload;
        state.projects        = [];
      });
  },
});

export default projectContentSlice.reducer;