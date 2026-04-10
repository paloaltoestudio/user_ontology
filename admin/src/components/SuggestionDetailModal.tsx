import { Icon } from './Icon'
import { SuggestionPriority, SuggestionType } from '../types/user'

interface SuggestionDetailModalProps {
  suggestion: any
  onClose: () => void
  onApprove: () => void
  formatDateTime: (dateString: string) => string
  getPriorityLabel: (priority: SuggestionPriority) => string
  getTypeLabel: (type: SuggestionType) => string
  getSuggestionPriorityColor: (priority: SuggestionPriority) => {
    bg: string
    border: string
    badge: string
    dot: string
  }
  getSuggestionIcon: (type: SuggestionType) => { icon: string; color: string }
}

export function SuggestionDetailModal({
  suggestion,
  onClose,
  onApprove,
  formatDateTime,
  getPriorityLabel,
  getTypeLabel,
  getSuggestionPriorityColor,
  getSuggestionIcon,
}: SuggestionDetailModalProps) {
  const priorityColor = getSuggestionPriorityColor(suggestion.priority)
  const iconInfo = getSuggestionIcon(suggestion.type)
  const isApplied = suggestion.status === 'applied'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/30 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`${priorityColor.bg} ${priorityColor.border} border-b p-6 relative flex-shrink-0`}>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded transition"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="flex items-start gap-4 pr-8">
            <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${priorityColor.dot}`} />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white break-words">{suggestion.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-3 ml-8">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityColor.badge}`}>
              {getPriorityLabel(suggestion.priority)}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700/30 text-slate-300">
              {getTypeLabel(suggestion.type)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Description</h3>
            <p className="text-slate-300 leading-relaxed">{suggestion.description}</p>
          </div>

          {/* User Context */}
          <div className="border-t border-slate-700/30 pt-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">User Context</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Name</span>
                <span className="text-white font-medium">{suggestion.userName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email</span>
                <span className="text-white font-medium">{suggestion.userEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Company</span>
                <span className="text-white font-medium">{suggestion.userCompany}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-white font-medium capitalize">{suggestion.userStatus}</span>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="border-t border-slate-700/30 pt-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Reasoning</h3>
            <p className="text-slate-300 flex items-start gap-2">
              <Icon type="info" size={0.9} color="#64748B" className="flex-shrink-0 mt-0.5" />
              <span>{suggestion.reason}</span>
            </p>
          </div>

          {/* Type Details */}
          <div className="border-t border-slate-700/30 pt-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Type Details</h3>
            <div className="flex items-center gap-3 p-3 bg-slate-800/20 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center flex-shrink-0">
                <Icon type={iconInfo.icon as any} size={1} color={iconInfo.color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{getTypeLabel(suggestion.type)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Automatable: {suggestion.automatable ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t border-slate-700/30 pt-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Timeline</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Suggested</span>
                <span className="text-white text-sm">{formatDateTime(suggestion.suggestedAt)}</span>
              </div>
              {isApplied && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Applied</span>
                  <span className="text-emerald-400 text-sm font-medium">
                    {formatDateTime(suggestion.appliedAt)} {suggestion.automatable ? '(system)' : '(manual)'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {!isApplied && suggestion.automatable && (
          <div className="border-t border-slate-700/30 p-6 bg-slate-800/40 flex-shrink-0">
            <button
              onClick={onApprove}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
            >
              Approve Suggestion
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
