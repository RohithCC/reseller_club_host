// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_BACKEND_URL

// Storage keys
const KEY_USER  = 'amulya_user'
const KEY_TOKEN = 'amulya_token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  // ── Initialise from localStorage (persists across page refresh) ────────────
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY_USER)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() =>
    localStorage.getItem(KEY_TOKEN) || null
  )

  const [loading, setLoading] = useState(false)

  // ── Derived state ──────────────────────────────────────────────────────────
  const isLoggedIn = Boolean(token && user)

  // ── Axios default header — all API calls include token automatically ────────
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['token'] = token
    } else {
      delete axios.defaults.headers.common['token']
    }
  }, [token])

  // ── login: save user + token to context and localStorage ──────────────────
  // Called by Login.jsx after a successful /api/user/login or /api/user/register
  // userData shape: { name, email, phone? }
  const login = useCallback((userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem(KEY_USER,  JSON.stringify(userData))
    localStorage.setItem(KEY_TOKEN, authToken)
    axios.defaults.headers.common['token'] = authToken
  }, [])

  // ── logout: clear everything ───────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(KEY_USER)
    localStorage.removeItem(KEY_TOKEN)
    delete axios.defaults.headers.common['token']
  }, [])

  // ── updateUser: patch local user data after profile update ─────────────────
  // Call this after PUT /api/user/update-profile so Navbar shows fresh name
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields }
      localStorage.setItem(KEY_USER, JSON.stringify(merged))
      return merged
    })
  }, [])

  // ── fetchProfile: re-fetch user data from backend ─────────────────────────
  // Useful on app load to get the latest name / avatar from DB
  const fetchProfile = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/api/user/profile`, {})
      if (res.data.success) {
        const fresh = {
          name:   res.data.user.name,
          email:  res.data.user.email,
          phone:  res.data.user.phone  || '',
          avatar: res.data.user.avatar || '',
        }
        setUser(fresh)
        localStorage.setItem(KEY_USER, JSON.stringify(fresh))
      } else {
        // Token is invalid or expired — force logout
        logout()
      }
    } catch {
      // Network error — keep existing local user, don't force logout
    } finally {
      setLoading(false)
    }
  }, [token, logout])

  // ── On mount: validate token by fetching profile ───────────────────────────
  // Catches expired tokens on page refresh without forcing user to re-login
  useEffect(() => {
    if (token) {
      fetchProfile()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])   // only run once on mount

  return (
    <AuthContext.Provider value={{
      user,           // { name, email, phone, avatar }
      token,          // raw JWT string
      isLoggedIn,     // Boolean — use this for conditional rendering
      loading,        // true while fetchProfile is running
      login,          // (userData, token) => void
      logout,         // () => void
      updateUser,     // (partialUserObject) => void
      fetchProfile,   // () => Promise<void>
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
