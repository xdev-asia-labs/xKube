import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'

// Types
export interface User {
    id: string
    email: string
    name: string
    avatar_url?: string
    auth_provider: string
    is_verified: boolean
    created_at: string
}

interface AuthState {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    isLoading: boolean
    error: string | null
}

interface LoginCredentials {
    email: string
    password: string
}

interface RegisterData {
    email: string
    password: string
    name: string
}

interface TokenResponse {
    access_token: string
    refresh_token: string
}

// API URL from env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888'

// Initial state
const initialState: AuthState = {
    user: null,
    accessToken: localStorage.getItem('xkube_access_token'),
    refreshToken: localStorage.getItem('xkube_refresh_token'),
    isLoading: false,
    error: null,
}

// Async thunks
export const login = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            })

            if (!response.ok) {
                const error = await response.json()
                return rejectWithValue(error.detail || 'Login failed')
            }

            return await response.json() as TokenResponse
        } catch (error) {
            return rejectWithValue('Network error')
        }
    }
)

export const register = createAsyncThunk(
    'auth/register',
    async (data: RegisterData, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                return rejectWithValue(error.detail || 'Registration failed')
            }

            return await response.json() as TokenResponse
        } catch (error) {
            return rejectWithValue('Network error')
        }
    }
)

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as { auth: AuthState }
        const token = state.auth.accessToken

        if (!token) {
            return rejectWithValue('No access token')
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!response.ok) {
                return rejectWithValue('Failed to fetch user')
            }

            return await response.json() as User
        } catch (error) {
            return rejectWithValue('Network error')
        }
    }
)

export const refreshAccessToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as { auth: AuthState }
        const refreshToken = state.auth.refreshToken

        if (!refreshToken) {
            return rejectWithValue('No refresh token')
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            })

            if (!response.ok) {
                return rejectWithValue('Token refresh failed')
            }

            return await response.json() as TokenResponse
        } catch (error) {
            return rejectWithValue('Network error')
        }
    }
)

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { getState }) => {
        const state = getState() as { auth: AuthState }
        const refreshToken = state.auth.refreshToken

        if (refreshToken) {
            try {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                })
            } catch (error) {
                console.error('Logout error:', error)
            }
        }
    }
)

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
            state.accessToken = action.payload.accessToken
            state.refreshToken = action.payload.refreshToken
            localStorage.setItem('xkube_access_token', action.payload.accessToken)
            localStorage.setItem('xkube_refresh_token', action.payload.refreshToken)
        },
        clearError: (state) => {
            state.error = null
        },
    },
    extraReducers: (builder) => {
        // Login
        builder.addCase(login.pending, (state) => {
            state.isLoading = true
            state.error = null
        })
        builder.addCase(login.fulfilled, (state, action) => {
            state.isLoading = false
            state.accessToken = action.payload.access_token
            state.refreshToken = action.payload.refresh_token
            localStorage.setItem('xkube_access_token', action.payload.access_token)
            localStorage.setItem('xkube_refresh_token', action.payload.refresh_token)
        })
        builder.addCase(login.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.payload as string
        })

        // Register
        builder.addCase(register.pending, (state) => {
            state.isLoading = true
            state.error = null
        })
        builder.addCase(register.fulfilled, (state, action) => {
            state.isLoading = false
            state.accessToken = action.payload.access_token
            state.refreshToken = action.payload.refresh_token
            localStorage.setItem('xkube_access_token', action.payload.access_token)
            localStorage.setItem('xkube_refresh_token', action.payload.refresh_token)
        })
        builder.addCase(register.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.payload as string
        })

        // Fetch user
        builder.addCase(fetchCurrentUser.pending, (state) => {
            state.isLoading = true
        })
        builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
            state.isLoading = false
            state.user = action.payload
        })
        builder.addCase(fetchCurrentUser.rejected, (state) => {
            state.isLoading = false
            state.accessToken = null
            state.refreshToken = null
            localStorage.removeItem('xkube_access_token')
            localStorage.removeItem('xkube_refresh_token')
        })

        // Refresh token
        builder.addCase(refreshAccessToken.fulfilled, (state, action) => {
            state.accessToken = action.payload.access_token
            state.refreshToken = action.payload.refresh_token
            localStorage.setItem('xkube_access_token', action.payload.access_token)
            localStorage.setItem('xkube_refresh_token', action.payload.refresh_token)
        })
        builder.addCase(refreshAccessToken.rejected, (state) => {
            state.accessToken = null
            state.refreshToken = null
            state.user = null
            localStorage.removeItem('xkube_access_token')
            localStorage.removeItem('xkube_refresh_token')
        })

        // Logout
        builder.addCase(logout.fulfilled, (state) => {
            state.user = null
            state.accessToken = null
            state.refreshToken = null
            localStorage.removeItem('xkube_access_token')
            localStorage.removeItem('xkube_refresh_token')
        })
    },
})

export const { setTokens, clearError } = authSlice.actions
export default authSlice.reducer
