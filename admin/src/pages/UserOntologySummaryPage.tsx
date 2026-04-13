import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import { useToast } from '../hooks/useToast'
import { UserFilters, type FilterState } from '../components/UserFilters'
import { leadsApi } from '../api/leads'
import { actionsApi } from '../api/actions'
import { Action } from '../types/action'

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
  const { success: showSuccess, error: showError } = useToast()
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)
  const [selectedAction, setSelectedAction] = useState<number | null>(null)
  const [isApplyingAction, setIsApplyingAction] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({})

  // Fetch leads from API
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.listLeads(),
  })

  // Fetch available actions
  const { data: availableActions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: () => actionsApi.listActions(),
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

  const toggleSelection = (userId: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    const allIds = new Set(filteredUsers.map((lead) => lead.id))
    setSelectedIds(allIds)
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const isAllSelected = filteredUsers.length > 0 && selectedIds.size === filteredUsers.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredUsers.length

  const handleApplyAction = async () => {
    if (!selectedAction || selectedIds.size === 0) return

    setIsApplyingAction(true)
    try {
      await leadsApi.applyActionToLeads(Array.from(selectedIds), selectedAction)
      showSuccess(`Action applied to ${selectedIds.size} user(s)`)
      setSelectedIds(new Set())
      setSelectedAction(null)
      setShowConfirmModal(false)
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to apply action'
      showError(errorMsg)
    } finally {
      setIsApplyingAction(false)
    }
  }

  const getSelectedActionName = () => {
    if (!selectedAction) return ''
    return availableActions.find((a) => a.id === selectedAction)?.name || ''
  }

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

                {/* Filters and Search - Integrated */}
                <UserFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onFilterChange={setAdvancedFilters}
                />

                {/* Users Table */}
                {filteredUsers.length > 0 && (
                  <div className="space-y-4">
                    {/* Selection Control Bar */}
                    <div className="flex items-center justify-between gap-4 bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                      <div className="flex items-center gap-4">
                        <input
                          ref={selectAllCheckboxRef}
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={() => (isAllSelected ? deselectAll() : selectAll())}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-slate-300">
                          {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                        </span>
                        {selectedIds.size > 0 && (
                          <button
                            onClick={deselectAll}
                            className="text-xs text-slate-400 hover:text-slate-300 transition"
                          >
                            Clear selection
                          </button>
                        )}
                      </div>

                      {/* Apply Action Controls */}
                      {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-slate-400 font-medium">Apply Action:</div>
                          <select
                            value={selectedAction || ''}
                            onChange={(e) => setSelectedAction(e.target.value ? Number(e.target.value) : null)}
                            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-[#0582BE] focus:outline-none focus:ring-1 focus:ring-[#0582BE]"
                          >
                            <option value="">Select an action...</option>
                            {availableActions.map((action) => (
                              <option key={action.id} value={action.id}>
                                {action.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={!selectedAction || isApplyingAction}
                            className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white text-sm rounded transition font-medium whitespace-nowrap"
                          >
                            {isApplyingAction ? 'Applying...' : 'Apply Action'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Table */}
                    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/30 bg-slate-800/20">
                            <th className="px-6 py-3 text-left">
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={() => (isAllSelected ? deselectAll() : selectAll())}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </th>
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
                              className={`border-b border-slate-700/20 transition ${
                                selectedIds.has(lead.id)
                                  ? 'bg-blue-900/30'
                                  : 'hover:bg-slate-800/20'
                              }`}
                            >
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(lead.id)}
                                  onChange={() => toggleSelection(lead.id)}
                                  className="w-4 h-4 cursor-pointer"
                                />
                              </td>
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
                    </div>
                  </div>
                )}

                {filteredUsers.length === 0 && (
                  <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl px-6 py-12 text-center">
                    <p className="text-slate-400">No leads found</p>
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-2">
              Apply Action?
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              This will apply <span className="font-medium">"{getSelectedActionName()}"</span> to{' '}
              <span className="font-medium">{selectedIds.size} user{selectedIds.size !== 1 ? 's' : ''}</span>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isApplyingAction}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyAction}
                disabled={isApplyingAction}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 rounded transition disabled:opacity-50"
              >
                {isApplyingAction ? 'Applying...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
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
