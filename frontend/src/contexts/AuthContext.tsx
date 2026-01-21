import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

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

export interface AuthContextValue {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, name: string) => Promise<void>
    loginWithOAuth: (provider: 'google' | 'github') => void
    logout: () => Promise<void>
    refreshToken: () => Promise<boolean>
}

// Create context
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888'

// Token storage
const TOKEN_KEY = 'xkube_access_token'
const REFRESH_TOKEN_KEY = 'xkube_refresh_token'

const getAccessToken = () => localStorage.getItem(TOKEN_KEY)
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)
const setTokens = (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}
const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Fetch current user
    const fetchUser = useCallback(async () => {
        const token = getAccessToken()
        if (!token) {
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.ok) {
                const userData = await response.json()
                setUser(userData)
            } else if (response.status === 401) {
                // Try to refresh token
                const refreshed = await refreshToken()
                if (!refreshed) {
                    clearTokens()
                    setUser(null)
                }
            }
        } catch (error) {
            console.error('Failed to fetch user:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Initialize on mount
    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    // Handle OAuth callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const accessToken = params.get('access_token')
        const refreshTokenValue = params.get('refresh_token')

        if (accessToken && refreshTokenValue) {
            setTokens(accessToken, refreshTokenValue)
            window.history.replaceState({}, '', window.location.pathname)
            fetchUser()
        }
    }, [fetchUser])

    // Login with email/password
    const login = async (email: string, password: string) => {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Login failed')
        }

        const data = await response.json()
        setTokens(data.access_token, data.refresh_token)
        await fetchUser()
    }

    // Register new user
    const register = async (email: string, password: string, name: string) => {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Registration failed')
        }

        const data = await response.json()
        setTokens(data.access_token, data.refresh_token)
        await fetchUser()
    }

    // Login with OAuth
    const loginWithOAuth = (provider: 'google' | 'github') => {
        window.location.href = `${API_URL}/api/auth/oauth/${provider}`
    }

    // Logout
    const logout = async () => {
        const refreshTokenValue = getRefreshToken()
        if (refreshTokenValue) {
            try {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshTokenValue }),
                })
            } catch (error) {
                console.error('Logout error:', error)
            }
        }
        clearTokens()
        setUser(null)
    }

    // Refresh access token
    const refreshToken = async (): Promise<boolean> => {
        const refreshTokenValue = getRefreshToken()
        if (!refreshTokenValue) return false

        try {
            const response = await fetch(`${API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshTokenValue }),
            })

            if (response.ok) {
                const data = await response.json()
                setTokens(data.access_token, data.refresh_token)
                await fetchUser()
                return true
            }
        } catch (error) {
            console.error('Token refresh failed:', error)
        }
        return false
    }

    const value: AuthContextValue = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithOAuth,
        logout,
        refreshToken,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// Export token getter for API calls
export { getAccessToken }
