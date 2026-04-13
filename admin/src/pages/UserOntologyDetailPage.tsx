import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import { mockUsers } from '../data/mockUsers'
import { UserStatus, GoalStatus, SuggestionPriority, SuggestionType } from '../types/user'
import { Action } from '../types/action'
import { actionsApi } from '../api/actions'

export function UserOntologyDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [suggestionTab, setSuggestionTab] = useState<'pending' | 'applied'>('pending')
  const [actions, setActions] = useState<Action[]>([])
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null)
  const [loadingActions, setLoadingActions] = useState(false)
  const [applyingAction, setApplyingAction] = useState(false)

  const user = useMemo(() => {
    return mockUsers.find((u) => u.id === Number(userId))
  }, [userId])

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

  const handleApplyAction = async () => {
    if (!selectedActionId || !user) return

    try {
      setApplyingAction(true)
      await actionsApi.triggerAction(selectedActionId, [user.id])
      // Reset after successful application
      setSelectedActionId(null)
      // You could show a success message here
    } catch (error) {
      console.error('Failed to apply action:', error)
      // You could show an error message here
    } finally {
      setApplyingAction(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 mb-4">User not found</p>
              <button
                onClick={() => navigate('/users')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Back to Users
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: UserStatus) => {
    const colors: Record<UserStatus, { bg: string; text: string; icon: string }> = {
      activated: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', icon: 'check-circle' },
      in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-300', icon: 'clock' },
      inactive: { bg: 'bg-slate-500/10', text: 'text-slate-300', icon: 'slash' },
      lead_captured: { bg: 'bg-amber-500/10', text: 'text-amber-300', icon: 'star' },
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

  const statusLabel: Record<UserStatus, string> = {
    activated: 'Activated',
    in_progress: 'In Progress',
    inactive: 'Inactive',
    lead_captured: 'Lead Captured',
    churned: 'Churned',
  }

  const goalStatusLabel: Record<GoalStatus, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    not_started: 'Not Started',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-8 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <button
                onClick={() => navigate('/users')}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2"
              >
                ← Back to Users
              </button>
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="max-w-5xl mx-auto space-y-8">
                {/* User Header Card */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-8 backdrop-blur-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-4xl font-bold text-white mb-2">{user.name}</h1>
                      <p className="text-slate-400">{user.email}</p>
                      {user.company && <p className="text-slate-400 text-sm mt-1">Company: {user.company}</p>}
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-semibold ${getStatusColor(user.status).bg}`}>
                      <span className={getStatusColor(user.status).text}>{statusLabel[user.status]}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-700/30">
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Registered</p>
                      <p className="text-white font-semibold">{formatDate(user.registeredAt)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Last Active</p>
                      <p className="text-white font-semibold">{formatDate(user.lastActive)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Activation Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                            style={{ width: `${user.activationRate}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold text-sm">{user.activationRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Qualification Card */}
                {user.qualification && (
                  <div className={`bg-gradient-to-br ${getQualificationColor(user.qualification.status).bg} border border-slate-700/30 rounded-xl p-8 backdrop-blur-sm`}>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                          <Icon type="target" size={1.25} color="#0582BE" />
                          Lead Qualification
                        </h2>
                        <p className="text-slate-400 text-sm">AI-powered assessment</p>
                      </div>
                      <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${getQualificationColor(user.qualification.status).badgeBg}`}>
                        {user.qualification.status.charAt(0).toUpperCase() + user.qualification.status.slice(1)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Gauge & Score */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-40 h-24 mb-4">
                          {/* Semi-circular gauge */}
                          <svg viewBox="0 0 200 120" className="w-full h-full">
                            {/* Background arc */}
                            <path
                              d="M 20 100 A 80 80 0 0 1 180 100"
                              fill="none"
                              stroke="#334155"
                              strokeWidth="12"
                              strokeLinecap="round"
                            />
                            {/* Score arc */}
                            <path
                              d="M 20 100 A 80 80 0 0 1 180 100"
                              fill="none"
                              stroke={
                                user.qualification.status === 'qualified'
                                  ? '#10B981'
                                  : user.qualification.status === 'warm'
                                    ? '#F59E0B'
                                    : '#64748B'
                              }
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeDasharray={`${(user.qualification.score / 100) * 251.2} 251.2`}
                            />
                          </svg>
                          {/* Score text overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-white">{user.qualification.score}</span>
                            <span className="text-xs text-slate-400">/ 100</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 text-center">Confidence: {user.qualification.confidence}%</p>
                      </div>

                      {/* Factors */}
                      <div className="lg:col-span-2">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Qualification Factors</h3>
                        <div className="space-y-3">
                          {user.qualification.factors.map((factor, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-white">{factor.label}</span>
                                  <span className="text-xs text-slate-500">{factor.weight}%</span>
                                </div>
                                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      factor.status === 'positive'
                                        ? 'bg-emerald-500'
                                        : factor.status === 'negative'
                                          ? 'bg-red-500'
                                          : 'bg-slate-500'
                                    }`}
                                    style={{ width: `${factor.weight}%` }}
                                  />
                                </div>
                              </div>
                              <Icon
                                type={factor.status === 'positive' ? 'check-circle' : factor.status === 'negative' ? 'x-circle' : 'minus-circle'}
                                size={0.9}
                                color={
                                  factor.status === 'positive' ? '#10B981' : factor.status === 'negative' ? '#EF4444' : '#64748B'
                                }
                              />
                            </div>
                          ))}
                        </div>

                        {/* AI Insights */}
                        {user.qualification.insights && user.qualification.insights.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-slate-700/30">
                            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">AI Insights</h3>
                            <div className="space-y-2">
                              {user.qualification.insights.map((insight) => {
                                const priorityColor =
                                  insight.priority === 'urgent' ? 'border-red-500/50 bg-red-500/10' :
                                  insight.priority === 'high' ? 'border-amber-500/50 bg-amber-500/10' :
                                  insight.priority === 'medium' ? 'border-blue-500/50 bg-blue-500/10' :
                                  'border-slate-500/50 bg-slate-500/10'

                                const priorityIconColor =
                                  insight.priority === 'urgent' ? '#EF4444' :
                                  insight.priority === 'high' ? '#F59E0B' :
                                  insight.priority === 'medium' ? '#3B82F6' :
                                  '#64748B'

                                return (
                                  <div key={insight.id} className={`border-l-2 rounded px-3 py-2.5 ${priorityColor}`}>
                                    <div className="flex items-start gap-2">
                                      <Icon
                                        type="lightbulb"
                                        size={0.85}
                                        color={priorityIconColor}
                                        className="mt-0.5 flex-shrink-0"
                                      />
                                      <p className="text-sm text-slate-200 leading-snug">{insight.text}</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Trend & Timestamp */}
                        <div className="mt-6 pt-4 border-t border-slate-700/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon
                              type={getTrendIcon(user.qualification.trend).icon as any}
                              size={1}
                              color={getTrendIcon(user.qualification.trend).color}
                            />
                            <span className="text-xs text-slate-400">
                              Trend: {user.qualification.trend.charAt(0).toUpperCase() + user.qualification.trend.slice(1)}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            Assessed {formatDateTime(user.qualification.assessedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Goals Section */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Icon type="target" size={1.25} color="#0582BE" />
                      Goals & Milestones
                    </h2>

                    <div className="space-y-4">
                      {user.goals.map((goal) => (
                        <div
                          key={goal.id}
                          className={`p-4 rounded-lg border border-slate-700/30 ${getGoalStatusColor(goal.status).bg}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-white">{goal.title}</p>
                              <p className="text-sm text-slate-400 mt-1">{goal.description}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getGoalStatusColor(goal.status).bg} ${getGoalStatusColor(goal.status).text} whitespace-nowrap`}>
                              {goalStatusLabel[goal.status]}
                            </span>
                          </div>
                          {goal.dueDate && (
                            <p className="text-xs text-slate-400 mt-3">Due: {formatDate(goal.dueDate)}</p>
                          )}
                          {goal.completedDate && (
                            <p className="text-xs text-emerald-400 mt-3">Completed: {formatDate(goal.completedDate)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata Section */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Icon type="info" size={1.25} color="#0582BE" />
                      User Information
                    </h2>

                    <div className="space-y-4">
                      {user.metadata && (
                        <>
                          {user.metadata.country && (
                            <div>
                              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Country</p>
                              <p className="text-white">{user.metadata.country}</p>
                            </div>
                          )}
                          {user.metadata.industry && (
                            <div>
                              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Industry</p>
                              <p className="text-white">{user.metadata.industry}</p>
                            </div>
                          )}
                          {user.metadata.teamSize && (
                            <div>
                              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Team Size</p>
                              <p className="text-white">{user.metadata.teamSize}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Suggestions Section */}
                {user.suggestions && user.suggestions.length > 0 && (
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
                              {/* Icon */}
                              <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center flex-shrink-0">
                                <Icon type={iconInfo.icon as any} size={1.1} color={iconInfo.color} />
                              </div>

                              {/* Content */}
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

                                {/* Reasoning */}
                                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                                  <Icon type="info" size={0.75} color="#64748B" />
                                  {suggestion.reason}
                                </p>

                                {/* Action based on automatable or applied status */}
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

                {/* Activity Timeline */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Icon type="activity" size={1.25} color="#0582BE" />
                    Activity Timeline
                  </h2>

                  <div className="space-y-4">
                    {user.activities.map((activity, index) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                            <Icon
                              type={getActivityIcon(activity.type) as any}
                              size={1}
                              color="white"
                            />
                          </div>
                          {index < user.activities.length - 1 && (
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
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
