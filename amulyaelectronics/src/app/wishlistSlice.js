// src/app/wishlistSlice.js
//
// ✅ Wishlist Redux slice with localStorage persistence
//
// State shape:
//   state.wishlist.items → [{ id, name, price, mrp, image, category, subcat, inStock }]
//
// Actions exported:
//   toggleWishlist(item)  → adds if not present, removes if already in wishlist
//   clearWishlist()       → removes all items
//
// Usage in components:
//   const wishlistItems = useSelector((s) => s.wishlist.items)
//   dispatch(toggleWishlist({ id, name, price, mrp, image, category, inStock }))
//   dispatch(clearWishlist())
//
import { createSlice } from '@reduxjs/toolkit'

// ── Load persisted wishlist from localStorage ──────────────────────────────
function loadWishlist() {
  try {
    const raw = localStorage.getItem('wishlist')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ── Persist wishlist to localStorage ──────────────────────────────────────
function saveWishlist(items) {
  try {
    localStorage.setItem('wishlist', JSON.stringify(items))
  } catch {
    // storage full or unavailable — fail silently
  }
}

// ── Initial state ──────────────────────────────────────────────────────────
const initialState = {
  items: loadWishlist(),
}

// ── Slice ──────────────────────────────────────────────────────────────────
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {

    // Toggle: adds item if not present, removes if already in wishlist
    toggleWishlist(state, action) {
      const incoming = action.payload
      const idx = state.items.findIndex((i) => i.id === incoming.id)

      if (idx !== -1) {
        // ── Remove ────────────────────────────────────────────────
        state.items.splice(idx, 1)
      } else {
        // ── Add: normalise image to a string before storing ───────
        // Prevents issues if product.image is an array (Cloudinary returns arrays)
        state.items.push({
          id:       incoming.id,
          name:     incoming.name,
          price:    incoming.price     ?? 0,
          mrp:      incoming.mrp       ?? incoming.price ?? 0,
          image:    Array.isArray(incoming.image) ? incoming.image[0] : (incoming.image || ''),
          category: incoming.category  ?? '',
          subcat:   incoming.subcat    ?? '',
          inStock:  incoming.inStock   ?? true,
        })
      }

      // Persist every change
      saveWishlist(state.items)
    },

    // Clear all wishlist items
    clearWishlist(state) {
      state.items = []
      saveWishlist([])
    },

    // Update stock status of a wishlist item (call when product data refreshes)
    updateWishlistStock(state, action) {
      const { id, inStock } = action.payload
      const item = state.items.find((i) => i.id === id)
      if (item) {
        item.inStock = inStock
        saveWishlist(state.items)
      }
    },
  },
})

export const {
  toggleWishlist,
  clearWishlist,
  updateWishlistStock,
} = wishlistSlice.actions

// ── Selectors ──────────────────────────────────────────────────────────────
export const selectWishlistItems = (state) => state.wishlist.items
export const selectWishlistCount = (state) => state.wishlist.items.length
export const selectIsWishlisted  = (id)    => (state) =>
  state.wishlist.items.some((i) => i.id === id)

export default wishlistSlice.reducer
