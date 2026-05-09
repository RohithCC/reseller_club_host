import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// ─── Async: fetch footer settings ────────────────────────────────────────────
export const fetchFooterSettings = createAsyncThunk(
  'footer/fetchFooterSettings',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/footer`)
      if (data.success) return data.settings
      return rejectWithValue(data.message)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ─── Footer Slice ─────────────────────────────────────────────────────────────
const footerSlice = createSlice({
  name: 'footer',
  initialState: {
    settings: null,   // null = not loaded yet, fallback to hardcoded defaults
    loading:  false,
    error:    null,
  },
  reducers: {
    // Optimistically update after admin saves
    setFooterSettings(state, action) {
      state.settings = { ...state.settings, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFooterSettings.pending,   (state) => { state.loading = true; state.error = null })
      .addCase(fetchFooterSettings.fulfilled, (state, action) => {
        state.loading  = false
        state.settings = action.payload
      })
      .addCase(fetchFooterSettings.rejected,  (state, action) => {
        state.loading = false
        state.error   = action.payload
      })
  },
})

export const { setFooterSettings } = footerSlice.actions
export default footerSlice.reducer
