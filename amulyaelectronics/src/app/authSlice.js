// src/app/authSlice.js
// ─────────────────────────────────────────────────────────────────────────────
//  ✅ googleLogin thunk added        POST /api/user/google  { idToken }
//  ✅ fetchUserProfile               POST /api/user/profile  (header: token)
//  ✅ updateUserProfile              POST /api/user/update-profile
//  ✅ token header key fixed         backend reads req.headers.token (not Bearer)
//  ✅ initialState hydrates token    from localStorage on page refresh
//  ✅ logoutUser clears everything   incl. Google state
//  ✅ All selectors exported
// ─────────────────────────────────────────────────────────────────────────────

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'

// ── Header helper — backend reads req.headers.token (NOT Authorization: Bearer)
const authHeader = (token) => ({ token })

// ─────────────────────────────────────────────────────────────────────────────
// THUNK: Google Login
// ─────────────────────────────────────────────────────────────────────────────
// Call from Login component AFTER @react-oauth/google gives you a credential:
//   const { credential } = googleResponse   // from useGoogleLogin or GoogleLogin
//   dispatch(googleLogin(credential))
// ─────────────────────────────────────────────────────────────────────────────
export const googleLogin = createAsyncThunk(
    'auth/googleLogin',
    async (idToken, { rejectWithValue }) => {
        try {
            if (!idToken) return rejectWithValue('No Google ID token provided')

            const { data } = await axios.post(`${API_BASE}/api/user/google`, { idToken })

            if (!data.success) return rejectWithValue(data.message || 'Google login failed')

            // Persist token so page-refresh doesn't log the user out
            localStorage.setItem('amulya_token', data.token)
            return { token: data.token }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Google login failed')
        }
    }
)

// ─────────────────────────────────────────────────────────────────────────────
// THUNK: Fetch User Profile
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/profile  (backend uses POST, passes userId via JWT)
// Returns: { success, user }
// ─────────────────────────────────────────────────────────────────────────────
export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token
            if (!token) return rejectWithValue('No token — user not logged in')

            const { data } = await axios.post(
                `${API_BASE}/api/user/profile`,
                {},                                   // empty body — userId from JWT
                { headers: authHeader(token) }
            )

            if (!data.success) return rejectWithValue(data.message)

            return { user: data.user }               // shape: { _id, name, email, … }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message)
        }
    }
)

// ─────────────────────────────────────────────────────────────────────────────
// THUNK: Update User Profile
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/update-profile
// Accepts any subset of { name, phone, avatar }
// userId is read from JWT server-side — never sent in body
// ─────────────────────────────────────────────────────────────────────────────
export const updateUserProfile = createAsyncThunk(
    'auth/updateUserProfile',
    async ({ name, phone, avatar } = {}, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token
            if (!token) return rejectWithValue('No token — user not logged in')

            // Build body with only defined fields (don't overwrite with undefined)
            const body = {}
            if (name   !== undefined) body.name   = name
            if (phone  !== undefined) body.phone  = phone
            if (avatar !== undefined) body.avatar = avatar

            const { data } = await axios.post(
                `${API_BASE}/api/user/update-profile`,
                body,
                { headers: authHeader(token) }
            )

            if (!data.success) return rejectWithValue(data.message)

            // Return the full updated user from backend so Redux stays in sync
            return { user: data.user }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message)
        }
    }
)

// ─────────────────────────────────────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        // Hydrate from localStorage so refresh doesn't log user out
        token:      localStorage.getItem('amulya_token') || null,
        isLoggedIn: !!localStorage.getItem('amulya_token'),

        user:          null,
        loading:       false,     // fetchUserProfile / googleLogin in flight
        error:         null,      // fetchUserProfile / googleLogin error

        updating:      false,     // updateUserProfile in flight
        updateError:   null,
        updateSuccess: false,
    },

    reducers: {
        // ── Called by Login page after local email/password success ────────────
        loginSuccess(state, { payload }) {
            state.token      = payload.token
            state.isLoggedIn = true
            state.error      = null
            localStorage.setItem('amulya_token', payload.token)
        },

        // ── Full logout — clears all auth state ───────────────────────────────
        logoutUser(state) {
            state.token         = null
            state.user          = null
            state.isLoggedIn    = false
            state.loading       = false
            state.error         = null
            state.updating      = false
            state.updateError   = null
            state.updateSuccess = false
            localStorage.removeItem('amulya_token')
        },

        // ── Optimistic partial user update (e.g. avatar preview) ──────────────
        setUser(state, { payload }) {
            state.user = state.user ? { ...state.user, ...payload } : payload
        },

        // ── Clear transient messages (call on component unmount / tab switch) ──
        clearAuthMessages(state) {
            state.error         = null
            state.updateError   = null
            state.updateSuccess = false
        },
    },

    extraReducers: (builder) => {
        // ── googleLogin ────────────────────────────────────────────────────────
        builder
            .addCase(googleLogin.pending, (state) => {
                state.loading = true
                state.error   = null
            })
            .addCase(googleLogin.fulfilled, (state, { payload }) => {
                state.loading    = false
                state.token      = payload.token
                state.isLoggedIn = true
            })
            .addCase(googleLogin.rejected, (state, { payload }) => {
                state.loading = false
                state.error   = payload
            })

        // ── fetchUserProfile ───────────────────────────────────────────────────
        builder
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = true
                state.error   = null
            })
            .addCase(fetchUserProfile.fulfilled, (state, { payload }) => {
                state.loading = false
                state.user    = payload.user
            })
            .addCase(fetchUserProfile.rejected, (state, { payload }) => {
                state.loading = false
                state.error   = payload
            })

        // ── updateUserProfile ──────────────────────────────────────────────────
        builder
            .addCase(updateUserProfile.pending, (state) => {
                state.updating      = true
                state.updateError   = null
                state.updateSuccess = false
            })
            .addCase(updateUserProfile.fulfilled, (state, { payload }) => {
                state.updating      = false
                state.updateSuccess = true
                // Replace full user object from backend (authoritative)
                if (payload.user) state.user = payload.user
            })
            .addCase(updateUserProfile.rejected, (state, { payload }) => {
                state.updating    = false
                state.updateError = payload
            })
    },
})

export const { loginSuccess, logoutUser, setUser, clearAuthMessages } = authSlice.actions
export default authSlice.reducer

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────
export const selectToken          = (s) => s.auth.token
export const selectIsLoggedIn     = (s) => s.auth.isLoggedIn
export const selectUserProfile    = (s) => s.auth.user
export const selectProfileLoading = (s) => s.auth.loading
export const selectProfileError   = (s) => s.auth.error
export const selectUpdating       = (s) => s.auth.updating
export const selectUpdateError    = (s) => s.auth.updateError
export const selectUpdateSuccess  = (s) => s.auth.updateSuccess