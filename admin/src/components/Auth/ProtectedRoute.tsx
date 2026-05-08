import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const currentUser = useAuthStore((state) => state.currentUser)
  const accounts = useAuthStore((state) => state.accounts)
  const loadTokensFromStorage = useAuthStore((state) => state.loadTokensFromStorage)
  const location = useLocation()

  // If not authenticated but tokens exist in storage, load them
  if (!isAuthenticated) {
    const hasTokens = localStorage.getItem('auth_access_token') && localStorage.getItem('auth_refresh_token')
    if (hasTokens) {
      loadTokensFromStorage()
      return <>{children}</>
    }
    return <Navigate to="/login" replace />
  }

  // User is loaded but has no account memberships — redirect to create-account
  // Skip if already there to prevent an infinite redirect loop
  if (currentUser !== null && accounts.length === 0 && location.pathname !== '/create-account') {
    return <Navigate to="/create-account" replace />
  }

  return <>{children}</>
}
