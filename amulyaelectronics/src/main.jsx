// src/main.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  ✅ GoogleOAuthProvider wraps the entire app
//  ✅ VITE_GOOGLE_CLIENT_ID read from .env
//  ✅ Provider (Redux) is outermost — so all thunks can access the store
//  ✅ BrowserRouter, ScrollToTop order preserved
//  ✅ StrictMode added — catches side-effect bugs in development
// ─────────────────────────────────────────────────────────────────────────────

import React                           from 'react'
import ReactDOM                        from 'react-dom/client'
import { BrowserRouter }               from 'react-router-dom'
import { Provider }                    from 'react-redux'
import { GoogleOAuthProvider }         from '@react-oauth/google'

import App                             from './App.jsx'
import store                           from './app/store.js'
import ScrollToTop                     from './ScrollToTop'
import './index.css'

// ── Google OAuth — warn if missing, but don't crash the app ──────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
if (!GOOGLE_CLIENT_ID) {
  console.warn(
    '[main.jsx] VITE_GOOGLE_CLIENT_ID is not set. Google Login will be disabled.\n' +
    'Add: VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com in your .env file'
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Redux store — outermost so every child (incl. thunks) can access it */}
    <Provider store={store}>

      {/* Google OAuth — only wrap if client ID is configured */}
      {(() => {
        const router = <BrowserRouter><ScrollToTop /><App /></BrowserRouter>
        return GOOGLE_CLIENT_ID
          ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{router}</GoogleOAuthProvider>
          : router
      })()}
    </Provider>
  </React.StrictMode>
)
