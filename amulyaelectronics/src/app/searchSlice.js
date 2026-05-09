// src/app/searchSlice.js
// ─────────────────────────────────────────────────────────────────────────────
// Redux slice for the search modal:
//   - Live suggestions (debounced typeahead)
//   - Full search results with pagination + category filter
//   - Category list for filter pills
//
// Add to your store:
//   import searchReducer from './searchSlice'
//   // in combineReducers / configureStore:
//   search: searchReducer
// ─────────────────────────────────────────────────────────────────────────────

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const BASE = import.meta.env.VITE_BACKEND_URL;

// ─── THUNKS ───────────────────────────────────────────────────────────────────

// Fetch live suggestions while user types (debounced in component)
export const fetchSuggestions = createAsyncThunk(
  'search/fetchSuggestions',
  async (query, { rejectWithValue }) => {
    try {
      if (!query || query.trim().length < 2) return []
      const { data } = await axios.get(`${BASE}/api/search/suggestions`, {
        params: { q: query.trim() },
      })
      return data.success ? data.suggestions : []
    } catch {
      return rejectWithValue([])
    }
  }
)

// Full search — called on submit or category/page change
export const searchProducts = createAsyncThunk(
  'search/searchProducts',
  async ({ q = '', category = '', page = 1, limit = 12 }, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE}/api/search`, {
        params: { q: q.trim(), category, page, limit },
      })
      if (data.success) return data
      return rejectWithValue({ products: [], total: 0 })
    } catch (err) {
      return rejectWithValue({ products: [], total: 0, message: err.message })
    }
  }
)

// Fetch all categories for the filter pills
export const fetchCategories = createAsyncThunk(
  'search/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE}/api/search/categories`)
      return data.success ? data.categories : []
    } catch {
      return rejectWithValue([])
    }
  }
)

// ─── SLICE ────────────────────────────────────────────────────────────────────
const searchSlice = createSlice({
  name: 'search',
  initialState: {
    // Modal open state
    isOpen: false,

    // Search query and active category filter
    query:           '',
    activeCategory:  '',

    // Live suggestions (typeahead)
    suggestions:     [],
    suggestLoading:  false,

    // Full search results
    results:         [],
    total:           0,
    page:            1,
    totalPages:      1,
    resultsLoading:  false,
    resultsError:    null,

    // Categories for filter pills
    categories:      [],
    categoriesLoaded: false,
  },
  reducers: {
    openSearch:  (state) => { state.isOpen = true  },
    closeSearch: (state) => {
      state.isOpen          = false
      state.query           = ''
      state.activeCategory  = ''
      state.suggestions     = []
      state.results         = []
      state.total           = 0
      state.page            = 1
      state.totalPages      = 1
      state.resultsError    = null
    },
    setQuery:          (state, { payload }) => { state.query          = payload },
    setActiveCategory: (state, { payload }) => { state.activeCategory = payload; state.page = 1 },
    setPage:           (state, { payload }) => { state.page           = payload },
    clearResults:      (state) => {
      state.results      = []
      state.total        = 0
      state.page         = 1
      state.totalPages   = 1
      state.suggestions  = []
      state.resultsError = null
    },
  },
  extraReducers: (builder) => {

    // Suggestions
    builder
      .addCase(fetchSuggestions.pending,   (state) => { state.suggestLoading = true  })
      .addCase(fetchSuggestions.fulfilled, (state, { payload }) => {
        state.suggestLoading = false
        state.suggestions    = payload
      })
      .addCase(fetchSuggestions.rejected,  (state) => { state.suggestLoading = false; state.suggestions = [] })

    // Full search
    builder
      .addCase(searchProducts.pending, (state) => {
        state.resultsLoading = true
        state.resultsError   = null
      })
      .addCase(searchProducts.fulfilled, (state, { payload }) => {
        state.resultsLoading = false
        state.results        = payload.products   ?? []
        state.total          = payload.total      ?? 0
        state.page           = payload.page       ?? 1
        state.totalPages     = payload.totalPages ?? 1
      })
      .addCase(searchProducts.rejected, (state, { payload }) => {
        state.resultsLoading = false
        state.results        = []
        state.resultsError   = payload?.message ?? 'Search failed'
      })

    // Categories
    builder
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        state.categories      = payload
        state.categoriesLoaded = true
      })
  },
})

export const {
  openSearch, closeSearch,
  setQuery, setActiveCategory, setPage, clearResults,
} = searchSlice.actions

// Selectors
export const selectSearchOpen       = (s) => s.search.isOpen
export const selectSearchQuery      = (s) => s.search.query
export const selectActiveCategory   = (s) => s.search.activeCategory
export const selectSuggestions      = (s) => s.search.suggestions
export const selectSuggestLoading   = (s) => s.search.suggestLoading
export const selectSearchResults    = (s) => s.search.results
export const selectSearchTotal      = (s) => s.search.total
export const selectSearchPage       = (s) => s.search.page
export const selectSearchTotalPages = (s) => s.search.totalPages
export const selectResultsLoading   = (s) => s.search.resultsLoading
export const selectResultsError     = (s) => s.search.resultsError
export const selectCategories       = (s) => s.search.categories

export default searchSlice.reducer