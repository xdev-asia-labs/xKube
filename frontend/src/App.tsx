import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, ToastProvider, Box, VStack, Spinner } from '@xdev-asia/x-ui-react'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from '@/store'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchClusters } from '@/store/slices/clusterSlice'
import { fetchCurrentUser } from '@/store/slices/authSlice'
import { PremiumLayout } from '@/components/layout/PremiumLayout'
import { ClusterOnboarding } from '@/components/onboarding'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClustersPage } from '@/pages/ClustersPage'
import { ClusterDetailPage } from '@/pages/ClusterDetailPage'
import { PodsPage } from '@/pages/PodsPage'
import '@/index.css'

const queryClient = new QueryClient()

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
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
      window.location.reload()
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
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Main App Content with Cluster Check
function AppWithClusterCheck() {
  const dispatch = useAppDispatch()
  const { clusters, loading, error } = useAppSelector(state => state.clusters)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    dispatch(fetchClusters())

    // Timeout after 5 seconds to prevent infinite loading
    const timeout = setTimeout(() => {
      setTimedOut(true)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [dispatch])

  // Show loading while checking clusters (max 5 seconds)
  if (loading && !timedOut) {
    return (
      <Box className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <VStack spacing={4}>
          <Spinner size="lg" className="border-t-blue-500 border-r-blue-500" />
          <p className="text-slate-400 animate-pulse">Loading xKube...</p>
        </VStack>
      </Box>
    )
  }

  // If timed out or error, show main app anyway
  if (timedOut || error) {
    console.error('Failed to load clusters:', error)
    // Show main app with empty clusters - user can add manually
  }

  // Show onboarding if no clusters
  if (!timedOut && !error && clusters.length === 0) {
    return <ClusterOnboarding />
  }

  // Show main app with routing
  return (
    <Routes>
      {/* Main Dashboard Routes - Uses PremiumLayout */}
      <Route path="/" element={
        <PremiumLayout>
          <DashboardPage />
        </PremiumLayout>
      } />
      <Route path="/pods" element={
        <PremiumLayout>
          <PodsPage />
        </PremiumLayout>
      } />
      <Route path="/deployments" element={
        <PremiumLayout>
          <PlaceholderPage title="Deployments" />
        </PremiumLayout>
      } />
      <Route path="/services" element={
        <PremiumLayout>
          <PlaceholderPage title="Services" />
        </PremiumLayout>
      } />
      <Route path="/namespaces" element={
        <PremiumLayout>
          <PlaceholderPage title="Namespaces" />
        </PremiumLayout>
      } />

      {/* Cluster Management Routes - Separate layout */}
      <Route path="/clusters" element={<ClustersPage />} />
      <Route path="/clusters/:clusterId" element={<ClusterDetailPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Placeholder Page Component
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <p className="text-slate-400">This page is under development</p>
    </div>
  )
}

// App with Providers and Router
export default function App() {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider defaultTheme="dark">
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppWithClusterCheck />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </QueryClientProvider>
        </ToastProvider>
      </ThemeProvider>
    </ReduxProvider>
  )
}
