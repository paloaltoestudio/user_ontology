import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { ApiKeyManager } from '../components/Settings/ApiKeyManager'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api-keys')

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`px-4 py-3 font-medium transition border-b-2 ${
                activeTab === 'api-keys'
                  ? 'border-[#0582BE] text-[#0582BE]'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              API Keys
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'api-keys' && <ApiKeyManager />}
        </div>
      </main>
    </div>
  )
}
