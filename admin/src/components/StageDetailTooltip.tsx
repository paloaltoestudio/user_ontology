import { Icon } from './Icon'
import { stageColorMap, stageDetails, Stage } from '../data/mockGraphData'

interface StageDetailTooltipProps {
  stage: Stage
  position: { x: number; y: number }
}

export function StageDetailTooltip({ stage, position }: StageDetailTooltipProps) {
  const data = stageDetails[stage]
  const colors = stageColorMap[stage]

  // Position tooltip to the right of node with offset
  let x = position.x + 120  // offset from node center
  let y = position.y - 40   // offset above node

  // Constrain to viewport
  if (x + 320 > window.innerWidth) {
    x = Math.max(10, window.innerWidth - 320)
  }
  if (y < 10) {
    y = position.y + 100  // shift down if too high
  }
  if (y + 400 > window.innerHeight) {
    y = Math.max(10, window.innerHeight - 400)
  }

  return (
    <div
      className="fixed bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 shadow-2xl z-50 pointer-events-auto animate-fade-in"
      style={{
        width: '300px',
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-slate-700/30"
        style={{
          background: `linear-gradient(135deg, ${colors.bg}20 0%, ${colors.bg}10 100%)`,
        }}
      >
        <h3 className="text-sm font-bold text-white">{data.title}</h3>
        <p className="text-xs text-slate-400 mt-1">{data.description}</p>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Metrics */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Key Metrics
          </h4>
          <div className="space-y-1">
            {data.metrics.map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Icon type={metric.icon as any} size={0.7} color={colors.text} />
                  <span className="text-slate-400">{metric.label}</span>
                </div>
                <span className="font-bold text-white">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Key Insights
          </h4>
          <div className="space-y-1">
            {data.insights.slice(0, 2).map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
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
                  {insight.replace(/^[✓→]\s/, '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
