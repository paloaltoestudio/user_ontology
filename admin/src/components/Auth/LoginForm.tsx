import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { LoginFormData } from '../../types/auth'

export function LoginForm() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((state) => state.setTokens)
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  })
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authApi.login(formData)
      setTokens(response.access_token, response.refresh_token)
      navigate('/dashboard')
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || 'Login failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="w-full max-w-md px-4">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0582BE] to-blue-600 mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              User Vision
            </h1>
            <p className="text-slate-400">Sign in to manage your forms</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="username"
                name="username"
                type="email"
                placeholder="admin@example.com"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-500">
            <p>Demo: admin@example.com / SecurePass123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
