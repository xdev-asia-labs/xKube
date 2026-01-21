import { useEffect, type ReactNode } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { fetchCurrentUser } from '@/store/slices/authSlice'
import { LoginPage } from '@/pages/LoginPage'
import { Spinner } from '@xdev-asia/x-ui-react'

interface ProtectedRouteProps {
    children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const dispatch = useAppDispatch()
    const { user, accessToken, isLoading } = useAppSelector((state) => state.auth)
    const isAuthenticated = !!user

    // Fetch user on mount if we have a token but no user
    useEffect(() => {
        if (accessToken && !user && !isLoading) {
            dispatch(fetchCurrentUser())
        }
    }, [accessToken, user, isLoading, dispatch])

    // Handle OAuth callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('access_token')
        const refreshTokenParam = params.get('refresh_token')

        if (token && refreshTokenParam) {
            localStorage.setItem('xkube_access_token', token)
            localStorage.setItem('xkube_refresh_token', refreshTokenParam)
            window.history.replaceState({}, '', window.location.pathname)
            window.location.reload() // Reload to trigger Redux state update
        }
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black">
                <Spinner size="lg" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <LoginPage />
    }

    return <>{children}</>
}
