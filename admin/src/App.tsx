import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { getCurrentUser, getMyAccounts } from './api/accounts'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { FormsPage } from './pages/FormsPage'
import { FormDetailPage } from './pages/FormDetailPage'
import { PublicFormPage } from './pages/PublicFormPage'
import { ActionsPage } from './pages/ActionsPage'
import { GoalsPage } from './pages/GoalsPage'
import { UserOntologySummaryPage } from './pages/UserOntologySummaryPage'
import { UserDetailPageTabbed } from './pages/UserDetailPageTabbed'
import { UserSuggestionsInboxPage } from './pages/UserSuggestionsInboxPage'
import { SettingsPage } from './pages/SettingsPage'
import { CatalogPage } from './pages/CatalogPage'
import { CreateAccountPage } from './pages/CreateAccountPage'
import { ProtectedRoute } from './components/Auth/ProtectedRoute'
import { ToastProvider, ToastContainer } from './components/Toast/ToastContainer'

function App() {
  const { loadTokensFromStorage, isAuthenticated, setCurrentUser, setAccounts } = useAuthStore()

  useEffect(() => {
    loadTokensFromStorage()
  }, [])

  // After auth is established, eagerly load user profile and account memberships
  useEffect(() => {
    if (!isAuthenticated) return

    Promise.all([getCurrentUser(), getMyAccounts()])
      .then(([userRes, accountsRes]) => {
        setCurrentUser(userRes.data)
        setAccounts(accountsRes.data)
      })
      .catch(() => {
        // Tokens may be expired — ProtectedRoute + 401 interceptor will handle redirect
      })
  }, [isAuthenticated])

  return (
    <ToastProvider>
      <Router>
        <ToastContainer />
        <Routes>
          {/* Public routes */}
          <Route path="/forms/public/:formId" element={<PublicFormPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* No-account onboarding */}
          <Route
            path="/create-account"
            element={
              <ProtectedRoute>
                <CreateAccountPage />
              </ProtectedRoute>
            }
          />

          {/* Protected app routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forms"
            element={
              <ProtectedRoute>
                <FormsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forms/:formId"
            element={
              <ProtectedRoute>
                <FormDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/actions"
            element={
              <ProtectedRoute>
                <ActionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <GoalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserOntologySummaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:userId"
            element={
              <ProtectedRoute>
                <UserDetailPageTabbed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suggestions"
            element={
              <ProtectedRoute>
                <UserSuggestionsInboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalog"
            element={
              <ProtectedRoute>
                <CatalogPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App
