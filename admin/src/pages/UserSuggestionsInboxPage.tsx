import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import { mockUsers } from '../data/mockUsers'
import { SuggestionPriority, SuggestionType } from '../types/user'
import { SuggestionDetailModal } from '../components/SuggestionDetailModal'

export function UserSuggestionsInboxPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'all' | 'pending' | 'applied'>('pending')
  const [priorityFilter, setPriorityFilter] = useState<SuggestionPriority | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<SuggestionType | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedSuggestion, setSelectedSuggestion] = useState<any | null>(null)

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

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    const allIds = new Set(filteredSuggestions.map((s) => `${s.userId}-${s.id}`))
    setSelectedIds(allIds)
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const isAllSelected = filteredSuggestions.length > 0 && selectedIds.size === filteredSuggestions.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredSuggestions.length

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
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Priority</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                    >
                      <option value="all">All Types</option>
                      <option value="email">Email</option>
                      <option value="call">Call</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="feature">Feature</option>
                      <option value="recovery">Recovery</option>
                      <option value="survey">Survey</option>
                      <option value="offer">Offer</option>
                    </select>
                  </div>
                </div>

                {/* Suggestions List */}
                <div className="space-y-4">
                  {/* Selection Controls & Bulk Actions - only show in pending tab */}
                  {filteredSuggestions.length > 0 && tab === 'pending' && (
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-4 backdrop-blur-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isIndeterminate
                            }}
                            onChange={() => (isAllSelected ? deselectAll() : selectAll())}
                            className="w-5 h-5 rounded border-slate-600 bg-slate-700 cursor-pointer accent-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-300">
                            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                          </span>
                        </label>
                        {selectedIds.size > 0 && (
                          <button
                            onClick={deselectAll}
                            className="text-xs text-slate-400 hover:text-slate-300 transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {selectedIds.size > 0 && (
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                          Approve {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Suggestions Items */}
                  <div className="space-y-2">
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
                      const suggestionKey = `${suggestion.userId}-${suggestion.id}`
                      const isSelected = selectedIds.has(suggestionKey)
                      const priorityColor = getSuggestionPriorityColor(suggestion.priority)
                      const isApplied = suggestion.status === 'applied'
                      return (
                        <div
                          key={suggestionKey}
                          className={`p-4 rounded-lg border transition-all cursor-pointer ${
                            isSelected ? 'border-blue-500/50 bg-blue-500/5' : 'hover:border-slate-600/50 hover:bg-slate-800/20'
                          } border-slate-700/30 ${isApplied ? 'opacity-60' : ''}`}
                          onClick={() => setSelectedSuggestion(suggestion)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Left: Checkbox & Priority Dot & Title */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {tab === 'pending' && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelection(suggestionKey)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 cursor-pointer accent-blue-500 flex-shrink-0"
                                />
                              )}
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor.dot}`} />
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-white truncate">{suggestion.title}</h3>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                  <span>{suggestion.userName}</span>
                                  <span>•</span>
                                  <span>{formatDateTime(suggestion.suggestedAt)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Approve Button */}
                            {!isApplied ? (
                              suggestion.automatable ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition flex-shrink-0"
                                >
                                  Approve
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500 italic flex-shrink-0">Manual</span>
                              )
                            ) : (
                              <span className="text-xs text-emerald-400 flex-shrink-0 flex items-center gap-1">
                                <Icon type="check-circle" size={0.7} color="#10B981" />
                                Applied
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                    </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSuggestion && (
        <SuggestionDetailModal
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          onApprove={() => setSelectedSuggestion(null)}
          formatDateTime={formatDateTime}
          getPriorityLabel={getPriorityLabel}
          getTypeLabel={getTypeLabel}
          getSuggestionPriorityColor={getSuggestionPriorityColor}
          getSuggestionIcon={getSuggestionIcon}
        />
      )}
    </div>
  )
}
