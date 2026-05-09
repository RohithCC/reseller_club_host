// routes/searchRoute.js
// ─────────────────────────────────────────────────────────────────────────────
// Mount in server.js:
//   import searchRouter from './routes/searchRoute.js'
//   app.use('/api/search', searchRouter)
//
// Endpoints created:
//   GET /api/search                    → full search with pagination + category filter
//   GET /api/search/suggestions        → live typeahead (name only, max 8)
//   GET /api/search/categories         → all categories with product counts
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express'
import {
  searchProducts,
  getSearchSuggestions,
  getCategories,
} from '../controllers/searchController.js'

const searchRouter = express.Router()

searchRouter.get('/',            searchProducts)
searchRouter.get('/suggestions', getSearchSuggestions)
searchRouter.get('/categories',  getCategories)

export default searchRouter