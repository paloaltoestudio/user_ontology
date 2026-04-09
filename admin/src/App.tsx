import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { FormsPage } from './pages/FormsPage'
import { FormDetailPage } from './pages/FormDetailPage'
import { PublicFormPage } from './pages/PublicFormPage'
import { UserOntologySummaryPage } from './pages/UserOntologySummaryPage'
import { UserOntologyDetailPage } from './pages/UserOntologyDetailPage'
import { UserSuggestionsInboxPage } from './pages/UserSuggestionsInboxPage'
import { ProtectedRoute } from './components/Auth/ProtectedRoute'
import { ToastProvider, ToastContainer } from './components/Toast/ToastContainer'

function App() {
  const loadTokensFromStorage = useAuthStore(
    (state) => state.loadTokensFromStorage
  )

  // Load tokens from localStorage on app start
  useEffect(() => {
    loadTokensFromStorage()
  }, [loadTokensFromStorage])

  return (
    <ToastProvider>
      <Router>
        <ToastContainer />
        <Routes>
        {/* Public form route - no authentication required */}
        <Route path="/forms/public/:formId" element={<PublicFormPage />} />

        <Route path="/login" element={<LoginPage />} />
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
              <UserOntologyDetailPage />
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App
