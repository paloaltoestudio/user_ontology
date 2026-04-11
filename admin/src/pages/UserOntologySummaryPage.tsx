import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import { useToast } from '../hooks/useToast'
import { leadsApi } from '../api/leads'

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'activated' | 'inactive' | 'churned'
type FilterStatus = LeadStatus | 'all'

interface Lead {
  id: number
  form_id: number
  email: string
  name?: string
  last_name?: string
  phone?: string
  company?: string
  company_url?: string
  status: LeadStatus
  form_data: Record<string, any>
  notes: string | null
  webhook_deliveries: any[]
  created_at: string
  updated_at: string
}

export function UserOntologySummaryPage() {
  const navigate = useNavigate()
  const { error: showError } = useToast()
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch leads from API
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.listLeads(),
  })

  // Handle API errors
  if (error) {
    showError('Failed to load leads')
  }

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = leads.length
    const activated = leads.filter((u) => u.status === 'activated').length
    const inProgress = leads.filter((u) => u.status === 'contacted' || u.status === 'qualified').length
    const inactive = leads.filter((u) => u.status === 'inactive').length
    const churned = leads.filter((u) => u.status === 'churned').length

    return {
      total,
      activated,
      inProgress,
      inactive,
      churned,
      activationRate: total > 0 ? Math.round((activated / total) * 100) : 0,
    }
  }, [leads])

  // Filter and search leads
  const filteredUsers = useMemo(() => {
    return leads
      .filter((lead) => {
        if (selectedFilter === 'all') return true
        return lead.status === selectedFilter
      })
      .filter((lead) => {
        const searchLower = searchQuery.toLowerCase()
        return (
          lead.email.toLowerCase().includes(searchLower) ||
          (lead.name && lead.name.toLowerCase().includes(searchLower)) ||
          (lead.company && lead.company.toLowerCase().includes(searchLower))
        )
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }, [leads, selectedFilter, searchQuery])

  const getStatusColor = (status: LeadStatus) => {
    const colors: Record<LeadStatus, { bg: string; text: string; badge: string }> = {
      new: { bg: 'bg-amber-500/10', text: 'text-amber-300', badge: 'bg-amber-500/20' },
      contacted: { bg: 'bg-blue-500/10', text: 'text-blue-300', badge: 'bg-blue-500/20' },
      qualified: { bg: 'bg-purple-500/10', text: 'text-purple-300', badge: 'bg-purple-500/20' },
      activated: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', badge: 'bg-emerald-500/20' },
      inactive: { bg: 'bg-slate-500/10', text: 'text-slate-300', badge: 'bg-slate-500/20' },
      churned: { bg: 'bg-red-500/10', text: 'text-red-300', badge: 'bg-red-500/20' },
    }
    return colors[status]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 0) return 'Today'
    if (daysDiff === 1) return 'Yesterday'
    if (daysDiff < 7) return `${daysDiff} days ago`
    if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`
    return `${Math.floor(daysDiff / 30)} months ago`
  }

  const statusLabels: Record<FilterStatus, string> = {
    all: 'All Leads',
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    activated: 'Activated',
    inactive: 'Inactive',
    churned: 'Churned',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-white mb-2">User Ontology</h1>
              <p className="text-slate-400">Track user lifecycle and activation metrics</p>
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="max-w-7xl mx-auto space-y-8">
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {!isLoading && (
                  <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <MetricCard
                    label="Total Users"
                    value={metrics.total}
                    icon="users"
                    color="blue"
                  />
                  <MetricCard
                    label="Activated"
                    value={metrics.activated}
                    subtext={`${metrics.activationRate}% rate`}
                    icon="check-circle"
                    color="emerald"
                  />
                  <MetricCard
                    label="In Progress"
                    value={metrics.inProgress}
                    icon="clock"
                    color="blue"
                  />
                  <MetricCard
                    label="Inactive"
                    value={metrics.inactive}
                    icon="slash"
                    color="slate"
                  />
                  <MetricCard
                    label="Churned"
                    value={metrics.churned}
                    icon="trending-down"
                    color="red"
                  />
                </div>

                {/* Filters and Search */}
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'new', 'contacted', 'qualified', 'activated', 'inactive', 'churned'] as const).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => setSelectedFilter(status)}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            selectedFilter === status
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                              : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                          }`}
                        >
                          {statusLabels[status]}
                        </button>
                      )
                    )}
                  </div>

                  <div className="relative">
                    <Icon
                      type="search"
                      size={1}
                      color="#94a3b8"
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                    />
                    <input
                      type="text"
                      placeholder="Search by name, email, or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/30 bg-slate-800/20">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                          Activation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                          Last Active
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-b border-slate-700/20 hover:bg-slate-800/20 transition"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-white">
                                {lead.name || '—'}
                              </p>
                              <p className="text-xs text-slate-400">{lead.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-300">{lead.company || '—'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status).badge}`}>
                              <span className={getStatusColor(lead.status).text}>
                                {statusLabels[lead.status as FilterStatus]}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                  style={{ width: `${lead.status === 'activated' ? 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{lead.status === 'activated' ? 100 : 0}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-400">{formatDate(lead.updated_at)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(`/users/${lead.id}`)}
                              className="px-3 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition"
                            >
                              View Details →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredUsers.length === 0 && (
                    <div className="px-6 py-12 text-center">
                      <p className="text-slate-400">No leads found</p>
                    </div>
                  )}
                </div>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: number
  subtext?: string
  icon: string
  color: 'blue' | 'emerald' | 'slate' | 'red'
}

function MetricCard({ label, value, subtext, icon, color }: MetricCardProps) {
  const colorClass: Record<typeof color, string> = {
    blue: 'from-blue-600 to-cyan-600',
    emerald: 'from-emerald-600 to-teal-600',
    slate: 'from-slate-600 to-slate-500',
    red: 'from-red-600 to-pink-600',
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-lg p-6 backdrop-blur-sm hover:border-slate-600/50 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass[color]} flex items-center justify-center`}>
          <Icon type={icon as any} size={1.25} color="white" />
        </div>
      </div>
    </div>
  )
}
