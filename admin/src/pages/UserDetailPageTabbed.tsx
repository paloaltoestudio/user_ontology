import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  UserNode,
  EventNode,
  GoalNode,
  ActionNode,
  SuggestionNode,
} from '../components/UserJourneyNodes'
import { userJourneyFlow } from '../data/mockUserData'
import { mockUsers } from '../data/mockUsers'
import { useToast } from '../hooks/useToast'
import { leadsApi } from '../api/leads'
import { formsApi } from '../api/forms'
import { actionsApi } from '../api/actions'
import { goalsApi } from '../api/goals'
import { GoalStatus, SuggestionPriority, SuggestionType } from '../types/user'
import { Action } from '../types/action'
import { Goal } from '../types/goal'
import { ConfirmActionModal } from '../components/DeleteGoalConfirmModal'

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'activated' | 'inactive' | 'churned'

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

const nodeTypes = {
  userNode: UserNode,
  eventNode: EventNode,
  goalNode: GoalNode,
  actionNode: ActionNode,
  suggestionNode: SuggestionNode,
}

type TabType = 'journey' | 'details'

export function UserDetailPageTabbed() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('journey')
  const [suggestionTab, setSuggestionTab] = useState<'pending' | 'applied'>('pending')
  const [isDeleting, setIsDeleting] = useState(false)
  const [actions, setActions] = useState<Action[]>([])
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null)
  const [loadingActions, setLoadingActions] = useState(false)
  const [applyingAction, setApplyingAction] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null)
  const [loadingGoals, setLoadingGoals] = useState(false)
  const [assigningGoal, setAssigningGoal] = useState(false)
  const [assignedGoals, setAssignedGoals] = useState<any[]>([])
  const [loadingAssignedGoals, setLoadingAssignedGoals] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [deleteGoalData, setDeleteGoalData] = useState<{ goalId: number; assignmentId: number; goalName: string } | null>(null)
  const [isRemovingGoal, setIsRemovingGoal] = useState(false)

  const [nodes, , onNodesChange] = useNodesState(userJourneyFlow.nodes)
  const [edges, , onEdgesChange] = useEdgesState(userJourneyFlow.edges)

  // Fetch lead from API
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['lead', userId],
    queryFn: () => leadsApi.getLead(Number(userId)),
  })

  // Fetch form to get mapping (when user is loaded)
  const { data: form } = useQuery({
    queryKey: ['form', user?.form_id],
    queryFn: () => formsApi.getForm(user!.form_id),
    enabled: !!user?.form_id,
  })

  if (error) {
    showError('Failed to load lead details')
  }

  // Load available actions
  useEffect(() => {
    const loadActions = async () => {
      try {
        setLoadingActions(true)
        const fetchedActions = await actionsApi.listActions()
        setActions(fetchedActions)
      } catch (error) {
        console.error('Failed to load actions:', error)
      } finally {
        setLoadingActions(false)
      }
    }
    loadActions()
  }, [])

  // Load available goals
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoadingGoals(true)
        const fetchedGoals = await goalsApi.listGoals()
        setGoals(fetchedGoals)
      } catch (error) {
        console.error('Failed to load goals:', error)
      } finally {
        setLoadingGoals(false)
      }
    }
    loadGoals()
  }, [])

  // Load goals assigned to the user
  useEffect(() => {
    if (!user) return

    const loadUserGoals = async () => {
      try {
        setLoadingAssignedGoals(true)
        const fetchedAssignments = await goalsApi.getUserGoalAssignments(user.id)
        setAssignedGoals(fetchedAssignments)
      } catch (error) {
        console.error('Failed to load assigned goals:', error)
      } finally {
        setLoadingAssignedGoals(false)
      }
    }
    loadUserGoals()
  }, [user?.id])

  const handleApplyAction = async () => {
    if (!selectedActionId || !user) return

    try {
      setApplyingAction(true)
      await actionsApi.triggerAction(selectedActionId, [user.id])
      // Reset after successful application
      setSelectedActionId(null)
      showSuccess('Action applied successfully')
    } catch (error) {
      console.error('Failed to apply action:', error)
      showError('Failed to apply action')
    } finally {
      setApplyingAction(false)
    }
  }

  const handleAssignGoal = async () => {
    if (!selectedGoalId || !user) return

    try {
      setAssigningGoal(true)
      await goalsApi.assignGoalToUser(selectedGoalId, user.id)
      // Reset after successful assignment
      setSelectedGoalId(null)
      // Reload assigned goals
      const updatedAssignments = await goalsApi.getUserGoalAssignments(user.id)
      setAssignedGoals(updatedAssignments)
      showSuccess('Goal assigned successfully')
    } catch (error) {
      console.error('Failed to assign goal:', error)
      showError('Failed to assign goal')
    } finally {
      setAssigningGoal(false)
    }
  }

  const handleRemoveGoalAssignment = (goalId: number, assignmentId: number, goalName: string) => {
    setDeleteGoalData({ goalId, assignmentId, goalName })
    setShowDeleteConfirmModal(true)
  }

  const handleConfirmRemoveGoal = async () => {
    if (!user || !deleteGoalData) return

    try {
      setIsRemovingGoal(true)
      await goalsApi.removeAssignment(deleteGoalData.goalId, deleteGoalData.assignmentId)

      // Optimistically remove from UI
      setAssignedGoals(prev => prev.filter(a => a.id !== deleteGoalData.assignmentId))
      showSuccess('Goal assignment removed successfully')

      // Try to reload in background
      try {
        const updatedAssignments = await goalsApi.getUserGoalAssignments(user.id)
        setAssignedGoals(updatedAssignments)
      } catch (reloadError) {
        console.warn('Failed to reload assignments, using optimistic update:', reloadError)
      }
    } catch (error) {
      console.error('Failed to remove goal assignment:', error)
      showError('Failed to remove goal assignment')
    } finally {
      setIsRemovingGoal(false)
      setShowDeleteConfirmModal(false)
      setDeleteGoalData(null)
    }
  }

  // Helper functions from UserOntologyDetailPage
  const getStatusColor = (status: LeadStatus) => {
    const colors: Record<LeadStatus, { bg: string; text: string; icon: string }> = {
      new: { bg: 'bg-amber-500/10', text: 'text-amber-300', icon: 'star' },
      contacted: { bg: 'bg-blue-500/10', text: 'text-blue-300', icon: 'message-circle' },
      qualified: { bg: 'bg-purple-500/10', text: 'text-purple-300', icon: 'check' },
      activated: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', icon: 'check-circle' },
      inactive: { bg: 'bg-slate-500/10', text: 'text-slate-300', icon: 'slash' },
      churned: { bg: 'bg-red-500/10', text: 'text-red-300', icon: 'trending-down' },
    }
    return colors[status]
  }

  const getGoalStatusColor = (status: GoalStatus) => {
    const colors: Record<GoalStatus, { bg: string; text: string; icon: string }> = {
      completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', icon: 'check-circle' },
      in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-300', icon: 'clock' },
      not_started: { bg: 'bg-slate-500/10', text: 'text-slate-300', icon: 'circle' },
    }
    return colors[status]
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      login: 'log-in',
      form_submission: 'file-text',
      goal_completed: 'check-circle',
      profile_updated: 'user',
      feature_accessed: 'zap',
    }
    return icons[type] || 'activity'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusLabel: Record<LeadStatus, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    activated: 'Activated',
    inactive: 'Inactive',
    churned: 'Churned',
  }

  const goalStatusLabel: Record<GoalStatus, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    not_started: 'Not Started',
  }

  // Get mock user data as fallback for development
  const mockUser = useMemo(() => {
    return mockUsers.find((u) => u.id === Number(userId))
  }, [userId])

  // Get unmapped form data (fields that are not mapped to lead properties)
  const getUnmappedFormData = useMemo(() => {
    if (!user?.form_data || !form?.lead_field_mapping) {
      return {}
    }

    const mapping = form.lead_field_mapping
    const mappedValues = new Set<string>()

    // Collect all form field names that are mapped to lead properties
    Object.values(mapping).forEach((fieldName) => {
      if (fieldName) mappedValues.add(fieldName)
    })

    // Filter out mapped fields from form_data
    const unmapped: Record<string, any> = {}
    Object.entries(user.form_data).forEach(([key, value]) => {
      if (!mappedValues.has(key)) {
        unmapped[key] = value
      }
    })

    return unmapped
  }, [user?.form_data, form?.lead_field_mapping])

  // Handle delete lead
  const handleDeleteLead = async () => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      await leadsApi.deleteLead(Number(userId))
      showSuccess('Lead deleted successfully')
      navigate('/users')
    } catch (err) {
      showError('Failed to delete lead')
    } finally {
      setIsDeleting(false)
    }
  }

  const getSuggestionPriorityColor = (priority: SuggestionPriority) => {
    const colors: Record<SuggestionPriority, { bg: string; border: string; badge: string }> = {
      urgent: { bg: 'bg-red-500/10', border: 'border-red-500/30', badge: 'bg-red-500/20 text-red-300' },
      high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300' },
      medium: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' },
      low: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', badge: 'bg-slate-500/20 text-slate-300' },
    }
    return colors[priority]
  }

  const getSuggestionIcon = (type: SuggestionType) => {
    const icons: Record<SuggestionType, { icon: string; color: string }> = {
      email: { icon: 'file-text', color: '#06B6D4' },
      call: { icon: 'zap', color: '#3B82F6' },
      tutorial: { icon: 'info', color: '#8B5CF6' },
      feature: { icon: 'zap', color: '#0582BE' },
      recovery: { icon: 'log-in', color: '#F59E0B' },
      survey: { icon: 'file-text', color: '#EC4899' },
      offer: { icon: 'target', color: '#10B981' },
    }
    return icons[type]
  }

  const getQualificationColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; badgeBg: string }> = {
      qualified: { bg: 'from-emerald-500/20 to-emerald-600/10', text: 'text-emerald-300', badgeBg: 'bg-emerald-500/20 text-emerald-300' },
      warm: { bg: 'from-amber-500/20 to-amber-600/10', text: 'text-amber-300', badgeBg: 'bg-amber-500/20 text-amber-300' },
      cold: { bg: 'from-slate-500/20 to-slate-600/10', text: 'text-slate-300', badgeBg: 'bg-slate-500/20 text-slate-300' },
    }
    return colors[status] || colors.cold
  }

  const getTrendIcon = (trend: string) => {
    const icons: Record<string, { icon: string; color: string }> = {
      up: { icon: 'trending-up', color: '#10B981' },
      down: { icon: 'trending-down', color: '#EF4444' },
      stable: { icon: 'minus', color: '#64748B' },
    }
    return icons[trend] || icons.stable
  }

  const suggestionCounts = useMemo(() => {
    if (!user?.suggestions) return { pending: 0, applied: 0 }
    return {
      pending: user.suggestions.filter((s) => (s.status || 'pending') === 'pending').length,
      applied: user.suggestions.filter((s) => s.status === 'applied').length,
    }
  }, [user?.suggestions])

  const filteredSuggestions = useMemo(() => {
    if (!user?.suggestions) return []
    return user.suggestions.filter((suggestion) => {
      const suggestionStatus = suggestion.status || 'pending'
      return suggestionStatus === suggestionTab
    })
  }, [user?.suggestions, suggestionTab])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 mb-4">Lead not found</p>
              <button
                onClick={() => navigate('/users')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Back to Leads
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-8 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigate('/users')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2"
                >
                  ← Back to Leads
                </button>
              </div>
            </div>
          </div>

          {/* Lead Summary Card - Always Visible (Compact Inline) */}
          <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-8 py-3">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-lg font-bold text-white whitespace-nowrap">
                    {user.name || user.email}
                  </h2>
                  <span className="text-slate-500 text-sm">·</span>
                  <p className="text-slate-400 text-sm truncate">{user.email}</p>
                  {user.company && (
                    <>
                      <span className="text-slate-500 text-sm">·</span>
                      <p className="text-slate-400 text-sm truncate">{user.company}</p>
                    </>
                  )}
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(user.status).bg}`}>
                  <span className={getStatusColor(user.status).text}>{statusLabel[user.status]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('journey')}
                  className={`px-4 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'journey'
                      ? 'text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Journey
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'details'
                      ? 'text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Details
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'journey' ? (
              // Journey Tab - Full width graph only
              <div className="h-full p-6">
                <div className="h-full bg-slate-900/30 border border-slate-700/30 rounded-xl overflow-hidden">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                  >
                    <Background
                      color="#1e293b"
                      gap={16}
                      size={1}
                      style={{
                        backgroundColor: 'rgb(15, 23, 42)',
                      }}
                    />
                    <Controls
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(51, 65, 85, 0.5)',
                      }}
                    />
                  </ReactFlow>
                </div>
              </div>
            ) : (
              // Details Tab - Full ontology view
              <div className="h-full overflow-auto">
                <div className="p-8">
                  <div className="max-w-5xl mx-auto space-y-8">

                    {/* Lead Information Section */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                      <h2 className="text-lg font-bold text-white mb-6">Lead Information</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Submitted</p>
                          <p className="text-white font-semibold text-lg">{formatDate(user.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Last Updated</p>
                          <p className="text-white font-semibold text-lg">{formatDate(user.updated_at)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Lead Status</p>
                          <p className={`font-semibold text-lg ${getStatusColor(user.status).text}`}>
                            {statusLabel[user.status]}
                          </p>
                        </div>
                      </div>
                    </div>


                    {/* Notes Section */}
                    {user.notes && (
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Icon type="sticky-note" size={1.25} color="#0582BE" />
                          Notes
                        </h2>
                        <p className="text-slate-300">{user.notes}</p>
                      </div>
                    )}

{/* Action Dropdown Section */}
                    <div className="flex gap-3 items-center">
                      <select
                        value={selectedActionId || ''}
                        onChange={(e) => setSelectedActionId(e.target.value ? Number(e.target.value) : null)}
                        disabled={loadingActions}
                        className="w-80 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition disabled:opacity-50"
                      >
                        <option value="">
                          {loadingActions ? 'Loading actions...' : 'Select an action...'}
                        </option>
                        {actions.map((action) => (
                          <option key={action.id} value={action.id}>
                            {action.name}
                          </option>
                        ))}
                      </select>
                      {selectedActionId && (
                        <button
                          onClick={handleApplyAction}
                          disabled={applyingAction}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition"
                        >
                          {applyingAction ? 'Applying...' : 'Apply Action'}
                        </button>
                      )}
                      <button
                        onClick={handleDeleteLead}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition ml-auto"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Lead'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Goals Section - Shows assigned goals */}
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                          <Icon type="target" size={1.25} color="#0582BE" />
                          Goals & Milestones
                        </h2>

                        {/* Goal Assignment */}
                        <div className="mb-6 pb-6 border-b border-slate-700/30 flex gap-3 items-center">
                          <select
                            value={selectedGoalId || ''}
                            onChange={(e) => setSelectedGoalId(e.target.value ? Number(e.target.value) : null)}
                            disabled={loadingGoals}
                            className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition disabled:opacity-50"
                          >
                            <option value="">
                              {loadingGoals ? 'Loading goals...' : 'Select a goal to assign...'}
                            </option>
                            {goals.filter((goal) => {
                              const isActive = goal.is_active
                              const isAlreadyAssigned = assignedGoals.some((assignment) => assignment.goal_id === goal.id)
                              return isActive && !isAlreadyAssigned
                            }).map((goal) => (
                              <option key={goal.id} value={goal.id}>
                                {goal.name}
                              </option>
                            ))}
                          </select>
                          {selectedGoalId && (
                            <button
                              onClick={handleAssignGoal}
                              disabled={assigningGoal}
                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition whitespace-nowrap"
                            >
                              {assigningGoal ? 'Assigning...' : 'Assign Goal'}
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          {loadingAssignedGoals ? (
                            <div className="text-center py-6">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                          ) : assignedGoals.length === 0 ? (
                            <p className="text-slate-400 text-center py-6">No goals assigned yet</p>
                          ) : (
                            assignedGoals.map((assignment) => {
                              const goal = assignment.goal || assignment
                              console.log('Goal title:', goal.name, 'Full goal object:', goal)
                              // Determine goal status based on completion or active status
                              const goalStatus = goal.completion_status || (goal.is_active ? 'in_progress' : 'not_started')
                              const statusColor = getGoalStatusColor(goalStatus as GoalStatus)

                              return (
                                <div
                                  key={assignment.id}
                                  className={`p-4 rounded-lg border border-slate-700/30 ${statusColor.bg} relative`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="font-semibold text-white">{goal.name}</p>
                                      <p className="text-sm text-slate-400 mt-1">{goal.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor.bg} ${statusColor.text} whitespace-nowrap`}>
                                        {goalStatusLabel[goalStatus as GoalStatus]}
                                      </span>
                                      <button
                                        onClick={() => handleRemoveGoalAssignment(goal.id, assignment.id, goal.name)}
                                        className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                        title="Remove goal assignment"
                                        disabled={isRemovingGoal}
                                      >
                                        <Icon type="trash-2" size={1} />
                                      </button>
                                    </div>
                                  </div>
                                  {assignment.assigned_at && (
                                    <p className="text-xs text-slate-400 mt-3">Assigned: {formatDate(assignment.assigned_at)}</p>
                                  )}
                                  {assignment.due_date && (
                                    <p className="text-xs text-slate-400 mt-1">Due: {formatDate(assignment.due_date)}</p>
                                  )}
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>

                      {/* User Information Section - Shows Unmapped Form Data Only */}
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                          <Icon type="info" size={1.25} color="#0582BE" />
                          User Information
                        </h2>

                        {Object.keys(getUnmappedFormData).length > 0 ? (
                          <div className="space-y-4">
                            {Object.entries(getUnmappedFormData).map(([key, value]) => {
                              // Format key to be more readable (e.g., "custom_field" -> "Custom Field")
                              const formattedKey = key
                                .split('_')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')

                              return (
                                <div key={key}>
                                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{formattedKey}</p>
                                  <p className="text-white break-words">{String(value) || '—'}</p>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-400">No additional data</p>
                        )}
                      </div>
                    </div>

                    {/* Suggestions Section - Uses mock data for now */}
                    {mockUser?.suggestions && mockUser.suggestions.length > 0 && (
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Icon type="zap" size={1.25} color="#F59E0B" />
                            AI Suggestions
                          </h2>
                        </div>

                        {/* Suggestion Tabs */}
                        <div className="flex gap-4 border-b border-slate-700/30 pb-4 mb-6">
                          <button
                            onClick={() => setSuggestionTab('pending')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                              suggestionTab === 'pending'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            Pending <span className="ml-2 text-xs bg-black/30 px-2 py-0.5 rounded">{suggestionCounts.pending}</span>
                          </button>
                          <button
                            onClick={() => setSuggestionTab('applied')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                              suggestionTab === 'applied'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            Applied <span className="ml-2 text-xs bg-black/30 px-2 py-0.5 rounded">{suggestionCounts.applied}</span>
                          </button>
                        </div>

                        <div className="space-y-4">
                          {filteredSuggestions.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-slate-400">No {suggestionTab} suggestions</p>
                            </div>
                          ) : (
                            filteredSuggestions.map((suggestion) => {
                              const priorityColor = getSuggestionPriorityColor(suggestion.priority)
                              const iconInfo = getSuggestionIcon(suggestion.type)
                              const isApplied = suggestion.status === 'applied'
                              return (
                                <div
                                  key={suggestion.id}
                                  className={`p-4 rounded-lg border transition-all hover:border-slate-600 ${priorityColor.bg} ${priorityColor.border} ${isApplied ? 'opacity-75' : ''}`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center flex-shrink-0">
                                      <Icon type={iconInfo.icon as any} size={1.1} color={iconInfo.color} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3 mb-2">
                                        <div>
                                          <p className="font-semibold text-white">{suggestion.title}</p>
                                          <p className="text-sm text-slate-400 mt-1">{suggestion.description}</p>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${priorityColor.badge}`}>
                                          {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}
                                        </span>
                                      </div>

                                      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                                        <Icon type="info" size={0.75} color="#64748B" />
                                        {suggestion.reason}
                                      </p>

                                      <div className="mt-4 flex items-center justify-between">
                                        {isApplied ? (
                                          <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                              <Icon type="check-circle" size={0.85} color="#10B981" />
                                              <span className="text-xs text-emerald-400 font-medium">
                                                Applied {suggestion.appliedAt ? formatDateTime(suggestion.appliedAt) : 'on unknown date'}
                                              </span>
                                            </div>
                                            <span className="text-xs text-slate-500">
                                              {suggestion.automatable ? 'by system' : 'manually'}
                                            </span>
                                          </div>
                                        ) : (
                                          <>
                                            <span className="text-xs text-slate-500">Suggested {formatDateTime(suggestion.suggestedAt)}</span>
                                            {suggestion.automatable ? (
                                              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                                                Approve
                                              </button>
                                            ) : (
                                              <span className="text-xs text-slate-400 italic">Requires manual action</span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Activity Timeline - Uses mock data for now */}
                    {mockUser?.activities && (
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                          <Icon type="activity" size={1.25} color="#0582BE" />
                          Activity Timeline
                        </h2>

                        <div className="space-y-4">
                          {mockUser.activities.map((activity, index) => (
                            <div key={activity.id} className="flex gap-4">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                  <Icon
                                    type={getActivityIcon(activity.type) as any}
                                    size={1}
                                    color="white"
                                  />
                                </div>
                                {index < mockUser.activities.length - 1 && (
                                  <div className="absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-4 bg-slate-700/50" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="font-semibold text-white">{activity.title}</p>
                                <p className="text-sm text-slate-400 mt-1">{activity.description}</p>
                                <p className="text-xs text-slate-500 mt-2">{formatDateTime(activity.timestamp)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Goal Confirmation Modal */}
      {showDeleteConfirmModal && deleteGoalData && (
        <ConfirmActionModal
          title="Remove goal?"
          message={
            <p>
              <span className="text-slate-300">Remove </span>
              <span className="font-semibold">"{deleteGoalData.goalName}"</span>
              <span className="text-slate-300"> from this user?</span>
            </p>
          }
          confirmText="Remove"
          onConfirm={handleConfirmRemoveGoal}
          onCancel={() => {
            setShowDeleteConfirmModal(false)
            setDeleteGoalData(null)
          }}
          isLoading={isRemovingGoal}
          variant="danger"
        />
      )}
    </div>
  )
}
