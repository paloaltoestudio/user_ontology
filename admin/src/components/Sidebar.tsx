import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const clearTokens = useAuthStore((state) => state.clearTokens)

  const handleLogout = () => {
    clearTokens()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shadow-lg flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0582BE] to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h1 className="text-xl font-bold text-white">Onboarding</h1>
        </div>
      </div>

      <nav className="p-4 space-y-2 flex-1">
        <Link
          to="/dashboard"
          className={`block px-4 py-3 rounded-lg font-medium transition ${
            isActive('/dashboard')
              ? 'bg-gradient-to-r from-[#0582BE] to-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Dashboard
        </Link>
        <Link
          to="/forms"
          className={`block px-4 py-3 rounded-lg font-medium transition ${
            isActive('/forms') || location.pathname.startsWith('/forms/')
              ? 'bg-gradient-to-r from-[#0582BE] to-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Forms
        </Link>
        <Link
          to="/users"
          className={`block px-4 py-3 rounded-lg font-medium transition ${
            isActive('/users') || location.pathname.startsWith('/users/')
              ? 'bg-gradient-to-r from-[#0582BE] to-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          User Ontology
        </Link>
        <Link
          to="/suggestions"
          className={`block px-4 py-3 rounded-lg font-medium transition ${
            isActive('/suggestions')
              ? 'bg-gradient-to-r from-[#0582BE] to-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Suggestions Inbox
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition font-medium border border-red-500/30"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
