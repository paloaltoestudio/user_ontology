import { X } from 'lucide-react'
import { Icon } from './Icon'
import { stageColorMap, stageDetails, Stage } from '../data/mockGraphData'

interface StageDetailModalProps {
  stage: Stage | null
  onClose: () => void
}

export function StageDetailModal({ stage, onClose }: StageDetailModalProps) {
  if (!stage) return null

  const data = stageDetails[stage]
  const colors = stageColorMap[stage]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div
          className="sticky top-0 px-8 py-6 border-b border-slate-700/30 flex items-start justify-between"
          style={{
            background: `linear-gradient(135deg, ${colors.bg}20 0%, ${colors.bg}10 100%)`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                border: `2px solid ${colors.border}`,
                boxShadow: `0 0 20px ${colors.border}40`,
              }}
            >
              <Icon type={colors.icon} size={1.5} color={colors.text} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{data.title}</h2>
              <p className="text-slate-400 text-sm mt-1">{data.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8">
          {/* Metrics */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Key Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon type={metric.icon as any} size={0.9} color={colors.text} />
                    <p className="text-xs text-slate-400 font-medium">{metric.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Recommended Actions
            </h3>
            <div className="space-y-3">
              {data.actions.map((action, idx) => (
                <button
                  key={idx}
                  className="w-full text-left p-4 rounded-lg border border-slate-700/50 hover:border-slate-600 bg-slate-900/30 hover:bg-slate-900/60 transition group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition"
                      style={{
                        background: `${colors.bg}30`,
                        border: `1px solid ${colors.border}50`,
                      }}
                    >
                      <Icon type={action.icon as any} size={1} color={colors.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white group-hover:text-blue-300 transition">
                        {action.label}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">{action.description}</p>
                    </div>
                    <div className="text-slate-500 group-hover:text-slate-300 transition flex-shrink-0">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Data Insights
            </h3>
            <div className="space-y-2">
              {data.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <p
                    className={
                      insight.startsWith('✓')
                        ? 'text-emerald-400'
                        : insight.startsWith('→')
                          ? 'text-amber-400'
                          : 'text-slate-300'
                    }
                  >
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3 pt-4 border-t border-slate-700/30">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
            >
              Close
            </button>
            <button
              className="flex-1 px-4 py-2 text-white font-medium rounded-lg transition"
              style={{
                background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.border} 100%)`,
              }}
            >
              Launch Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
