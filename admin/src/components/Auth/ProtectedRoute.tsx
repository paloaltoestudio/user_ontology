import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const loadTokensFromStorage = useAuthStore((state) => state.loadTokensFromStorage)

  // If not authenticated but tokens exist in storage, load them
  if (!isAuthenticated) {
    const hasTokens = localStorage.getItem('auth_access_token') && localStorage.getItem('auth_refresh_token')
    if (hasTokens) {
      loadTokensFromStorage()
      return <>{children}</>
    }
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
