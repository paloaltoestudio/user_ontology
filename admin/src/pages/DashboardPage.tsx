import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome to Admin Dashboard
                </h2>
                <p className="text-slate-400">
                  Manage your onboarding forms and flows
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => navigate('/forms')}
                  className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 cursor-pointer hover:border-[#0582BE] hover:shadow-xl hover:shadow-blue-500/10 transition"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0582BE] to-blue-600 flex items-center justify-center mb-4">
                    <Icon type="file" size={1.25} color="white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Forms
                  </h3>
                  <p className="text-slate-400">
                    Create and manage onboarding forms and registration flows.
                  </p>
                </div>
                <div
                  onClick={() => navigate('/users')}
                  className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 cursor-pointer hover:border-[#0582BE] hover:shadow-xl hover:shadow-blue-500/10 transition"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0582BE] to-blue-600 flex items-center justify-center mb-4">
                    <Icon type="users" size={1.25} color="white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    User Ontology
                  </h3>
                  <p className="text-slate-400">
                    Track user lifecycle, activation metrics, and engagement patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
