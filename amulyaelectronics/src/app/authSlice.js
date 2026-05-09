// src/app/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_BACKEND_URL

// ✅ Backend reads req.headers.token — NOT Authorization: Bearer
const authHeader = (token) => ({ token })

// ─── Thunk: fetch profile ─────────────────────────────────────────────────────
// ✅ GET /api/user/get-profile  (matches your backend route)
// ✅ Response fields: data.userData, data.subscription
export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token
            if (!token) return rejectWithValue('No token')

            const { data } = await axios.post(
                `${API_BASE}/api/user/profile`, {}, 
                { headers: authHeader(token) }   // GET — no body, just headers
            )

           // axios.post(`${API_BASE}/api/user/profile`, {}, { headers: { token } })

            
            if (data.success) {
                return {
                    user:         data.user,      // ✅ matches your API: data.userData
                    //subscription: data.subscription,  // ✅ matches your API: data.subscription
                }
            }
            return rejectWithValue(data.message)
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message)
        }
    }
)

// ─── Thunk: update profile ────────────────────────────────────────────────────
// POST /api/user/update-profile
// Body: { name, phone, avatar } — userId comes from JWT, NOT body
export const updateUserProfile = createAsyncThunk(
    'auth/updateUserProfile',
    async ({ name, phone, avatar }, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token
            if (!token) return rejectWithValue('No token')

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
            return { name, phone, avatar }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message)
        }
    }
)

// ─── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        token:         localStorage.getItem('token') || null,
        isLoggedIn:    !!localStorage.getItem('token'),

        user:          null,         // maps to data.userData from API
        subscription:  null,         // maps to data.subscription from API
        loading:       false,
        error:         null,

        updating:      false,
        updateError:   null,
        updateSuccess: false,
    },

    reducers: {
        loginSuccess(state, { payload }) {
            state.token      = payload.token
            state.isLoggedIn = true
            state.error      = null
            localStorage.setItem('token', payload.token)
        },

        logoutUser(state) {
            state.token         = null
            state.user          = null
            state.subscription  = null
            state.isLoggedIn    = false
            state.error         = null
            state.updateError   = null
            state.updateSuccess = false
            localStorage.removeItem('token')
        },

        setUser(state, { payload }) {
            state.user = state.user ? { ...state.user, ...payload } : payload
        },

        clearAuthMessages(state) {
            state.error         = null
            state.updateError   = null
            state.updateSuccess = false
        },
    },

    extraReducers: (builder) => {
        // fetchUserProfile
        builder
            .addCase(fetchUserProfile.pending,   (s) => { s.loading = true; s.error = null })
            .addCase(fetchUserProfile.fulfilled, (s, { payload }) => {
                s.loading      = false
                s.user         = payload.user          // data.userData
                s.subscription = payload.subscription  // data.subscription
            })
            .addCase(fetchUserProfile.rejected,  (s, { payload }) => { s.loading = false; s.error = payload })

        // updateUserProfile
        builder
            .addCase(updateUserProfile.pending,   (s) => { s.updating = true; s.updateError = null; s.updateSuccess = false })
            .addCase(updateUserProfile.fulfilled, (s, { payload }) => {
                s.updating      = false
                s.updateSuccess = true
                if (s.user) {
                    if (payload.name   !== undefined) s.user.name   = payload.name
                    if (payload.phone  !== undefined) s.user.phone  = payload.phone
                    if (payload.avatar !== undefined) s.user.avatar = payload.avatar
                }
            })
            .addCase(updateUserProfile.rejected, (s, { payload }) => { s.updating = false; s.updateError = payload })
    },
})

export const { loginSuccess, logoutUser, setUser, clearAuthMessages } = authSlice.actions
export default authSlice.reducer

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectToken          = (s) => s.auth.token
export const selectIsLoggedIn     = (s) => s.auth.isLoggedIn
export const selectUserProfile    = (s) => s.auth.user
export const selectSubscription   = (s) => s.auth.subscription
export const selectProfileLoading = (s) => s.auth.loading
export const selectProfileError   = (s) => s.auth.error
export const selectUpdating       = (s) => s.auth.updating
export const selectUpdateError    = (s) => s.auth.updateError
export const selectUpdateSuccess  = (s) => s.auth.updateSuccess
