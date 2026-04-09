import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import { mockUsers } from '../data/mockUsers'
import { SuggestionPriority, SuggestionType } from '../types/user'

export function UserSuggestionsInboxPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'pending' | 'applied'>('pending')
  const [priorityFilter, setPriorityFilter] = useState<SuggestionPriority | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<SuggestionType | 'all'>('all')

  // Flatten all suggestions with user context
  const allSuggestions = useMemo(() => {
    const suggestions: any[] = []
    mockUsers.forEach((user) => {
      if (user.suggestions) {
        user.suggestions.forEach((suggestion) => {
          suggestions.push({
            ...suggestion,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userCompany: user.company,
            userStatus: user.status,
          })
        })
      }
    })
    return suggestions.sort((a, b) => new Date(b.suggestedAt).getTime() - new Date(a.suggestedAt).getTime())
  }, [])

  // Apply filters
  const filteredSuggestions = useMemo(() => {
    return allSuggestions.filter((suggestion) => {
      const suggestionStatus = suggestion.status || 'pending'
      if (tab !== 'all' && suggestionStatus !== tab) return false
      if (priorityFilter !== 'all' && suggestion.priority !== priorityFilter) return false
      if (typeFilter !== 'all' && suggestion.type !== typeFilter) return false
      return true
    })
  }, [allSuggestions, tab, priorityFilter, typeFilter])

  const getSuggestionPriorityColor = (priority: SuggestionPriority) => {
    const colors: Record<SuggestionPriority, { bg: string; border: string; badge: string; dot: string }> = {
      urgent: { bg: 'bg-red-500/10', border: 'border-red-500/30', badge: 'bg-red-500/20 text-red-300', dot: 'bg-red-500' },
      high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300', dot: 'bg-orange-500' },
      medium: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300', dot: 'bg-blue-500' },
      low: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', badge: 'bg-slate-500/20 text-slate-300', dot: 'bg-slate-500' },
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPriorityLabel = (priority: SuggestionPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const getTypeLabel = (type: SuggestionType) => {
    const labels: Record<SuggestionType, string> = {
      email: 'Email',
      call: 'Call',
      tutorial: 'Tutorial',
      feature: 'Feature',
      recovery: 'Recovery',
      survey: 'Survey',
      offer: 'Offer',
    }
    return labels[type]
  }

  const tabCounts = useMemo(() => {
    return {
      pending: allSuggestions.filter((s) => (s.status || 'pending') === 'pending').length,
      applied: allSuggestions.filter((s) => s.status === 'applied').length,
    }
  }, [allSuggestions])

  const priorityCounts = useMemo(() => {
    const tabSuggestions = allSuggestions.filter((s) => (s.status || 'pending') === tab)
    return {
      urgent: tabSuggestions.filter((s) => s.priority === 'urgent').length,
      high: tabSuggestions.filter((s) => s.priority === 'high').length,
      medium: tabSuggestions.filter((s) => s.priority === 'medium').length,
      low: tabSuggestions.filter((s) => s.priority === 'low').length,
    }
  }, [allSuggestions, tab])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Icon type="zap" size={1.5} color="#F59E0B" />
                    Suggestions Inbox
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">{filteredSuggestions.length} items</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 border-t border-slate-800/50 pt-4">
                <button
                  onClick={() => setTab('pending')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    tab === 'pending'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Pending <span className="ml-2 text-xs bg-black/30 px-2 py-0.5 rounded">{tabCounts.pending}</span>
                </button>
                <button
                  onClick={() => setTab('applied')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    tab === 'applied'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Applied <span className="ml-2 text-xs bg-black/30 px-2 py-0.5 rounded">{tabCounts.applied}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="max-w-5xl mx-auto space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    onClick={() => setPriorityFilter('all')}
                    className={`p-4 rounded-lg border cursor-pointer transition ${
                      priorityFilter === 'all'
                        ? 'bg-slate-800/50 border-blue-500/50'
                        : 'bg-slate-800/20 border-slate-700/30 hover:border-slate-600/50'
                    }`}
                  >
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total</p>
                    <p className="text-2xl font-bold text-white">{allSuggestions.length}</p>
                  </div>
                  <div
                    onClick={() => setPriorityFilter('urgent')}
                    className={`p-4 rounded-lg border cursor-pointer transition ${
                      priorityFilter === 'urgent'
                        ? 'bg-red-500/10 border-red-500/50'
                        : 'bg-slate-800/20 border-slate-700/30 hover:border-slate-600/50'
                    }`}
                  >
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Urgent</p>
                    <p className="text-2xl font-bold text-red-300">{priorityCounts.urgent}</p>
                  </div>
                  <div
                    onClick={() => setPriorityFilter('high')}
                    className={`p-4 rounded-lg border cursor-pointer transition ${
                      priorityFilter === 'high'
                        ? 'bg-orange-500/10 border-orange-500/50'
                        : 'bg-slate-800/20 border-slate-700/30 hover:border-slate-600/50'
                    }`}
                  >
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">High</p>
                    <p className="text-2xl font-bold text-orange-300">{priorityCounts.high}</p>
                  </div>
                  <div
                    onClick={() => setPriorityFilter('medium')}
                    className={`p-4 rounded-lg border cursor-pointer transition ${
                      priorityFilter === 'medium'
                        ? 'bg-blue-500/10 border-blue-500/50'
                        : 'bg-slate-800/20 border-slate-700/30 hover:border-slate-600/50'
                    }`}
                  >
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Medium</p>
                    <p className="text-2xl font-bold text-blue-300">{priorityCounts.medium}</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Filters</h3>
                  <div className="space-y-4">
                    {/* Priority Filter */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Priority</p>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'urgent', 'high', 'medium', 'low'].map((priority) => (
                          <button
                            key={priority}
                            onClick={() => setPriorityFilter(priority as any)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                              priorityFilter === priority
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700/30 text-slate-300 hover:bg-slate-600/30'
                            }`}
                          >
                            {priority === 'all' ? 'All' : getPriorityLabel(priority as SuggestionPriority)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Type</p>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'email', 'call', 'tutorial', 'feature', 'recovery', 'survey', 'offer'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setTypeFilter(type as any)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                              typeFilter === type
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700/30 text-slate-300 hover:bg-slate-600/30'
                            }`}
                          >
                            {type === 'all' ? 'All' : getTypeLabel(type as SuggestionType)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggestions List */}
                <div className="space-y-3">
                  {filteredSuggestions.length === 0 ? (
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-12 backdrop-blur-sm text-center">
                      <p className="text-slate-400 mb-4">No suggestions matching your filters</p>
                      <button
                        onClick={() => {
                          setPriorityFilter('all')
                          setTypeFilter('all')
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    filteredSuggestions.map((suggestion) => {
                      const priorityColor = getSuggestionPriorityColor(suggestion.priority)
                      const iconInfo = getSuggestionIcon(suggestion.type)
                      const isApplied = suggestion.status === 'applied'
                      return (
                        <div
                          key={`${suggestion.userId}-${suggestion.id}`}
                          className={`p-5 rounded-lg border transition-all hover:border-slate-600 cursor-pointer ${priorityColor.bg} ${priorityColor.border} ${isApplied ? 'opacity-75' : ''}`}
                          onClick={() => navigate(`/users/${suggestion.userId}`)}
                        >
                          <div className="flex items-start gap-4">
                            {/* Priority Dot & Icon */}
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                              <div className={`w-3 h-3 rounded-full ${priorityColor.dot}`} />
                              <div className="w-9 h-9 rounded-lg bg-slate-700/30 flex items-center justify-center">
                                <Icon type={iconInfo.icon as any} size={1} color={iconInfo.color} />
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <h3 className="font-semibold text-white">{suggestion.title}</h3>
                                  <p className="text-sm text-slate-400 mt-0.5">{suggestion.description}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${priorityColor.badge}`}>
                                    {getPriorityLabel(suggestion.priority)}
                                  </span>
                                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-700/30 text-slate-300">
                                    {getTypeLabel(suggestion.type)}
                                  </span>
                                </div>
                              </div>

                              {/* User Context */}
                              <div className="flex items-center gap-3 mt-3 mb-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Icon type="user" size={0.9} color="#64748B" />
                                  <span className="text-slate-300 font-medium">{suggestion.userName}</span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-slate-400">{suggestion.userEmail}</span>
                                </div>
                              </div>

                              {/* Reasoning */}
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-3 mb-3">
                                <Icon type="info" size={0.75} color="#64748B" />
                                {suggestion.reason}
                              </p>

                              <div className="flex items-center justify-between">
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
                                    <p className="text-xs text-slate-500">{formatDateTime(suggestion.suggestedAt)}</p>
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
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
