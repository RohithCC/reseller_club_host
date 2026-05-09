import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './app/store.js'          // ✅ default import (not named)
import { CartProvider } from './context/CartContext'
// ❌ AuthProvider removed — auth is now handled by Redux (authSlice)

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <CartProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CartProvider>
  </Provider>
)
