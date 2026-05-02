import { Handle, Position } from '@xyflow/react'
import { Icon } from './Icon'

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_COLORS: Record<string, string> = {
  new:        '#94A3B8',
  contacted:  '#60A5FA',
  qualified:  '#FBBF24',
  activated:  '#10B981',
  inactive:   '#F97316',
  churned:    '#F43F5E',
}

export function UserNode({ data }: any) {
  const dotColor = STATUS_COLORS[data.status] ?? '#94A3B8'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center shadow-lg">
        <Icon type="user" size={1.5} color="#06B6D4" />
      </div>
      <div className="text-center">
        <div className="font-bold text-white text-sm">{data.name}</div>
        <div className="text-xs text-slate-400">{data.email}</div>
        <div className="text-xs text-slate-500">{data.company}</div>
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: `0 0 6px 2px ${dotColor}66`,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span className="text-xs capitalize" style={{ color: dotColor }}>{data.status}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  )
}

export function EventNode({ data }: any) {
  const color = data.color ?? '#06B6D4'
  const isCurrent: boolean = data.isCurrent ?? false

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} />
      <div
        className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-[160px]"
        style={{
          borderColor: color,
          backgroundColor: `${color}20`,
          boxShadow: isCurrent ? `0 0 0 3px ${color}33, 0 0 16px 4px ${color}44` : undefined,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
            {data.label}
          </span>
          {isCurrent && (
            <span
              className="text-xs font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${color}25`, color, fontSize: 9 }}
            >
              NOW
            </span>
          )}
        </div>
        {data.sublabel && <div className="text-xs text-slate-300 mt-1">{data.sublabel}</div>}
        {data.timestamp && <div className="text-xs text-slate-500 mt-1">{formatDate(data.timestamp)}</div>}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export function GoalNode({ data }: any) {
  const completed: boolean = data.completed
  const border = completed ? '#10B981' : '#FBBF24'
  const bg = completed ? '#064E3B' : '#92400E'

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} />
      <div
        className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-[180px]"
        style={{ borderColor: border, backgroundColor: `${bg}40` }}
      >
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: border }}>
          GOAL {completed ? '✓' : '○'}
        </div>
        <div className="text-sm font-semibold text-white mt-1">◆ {data.name}</div>
        <div className="text-xs text-slate-400 mt-1">
          {completed ? `completed ${formatDate(data.completedAt)}` : 'pending'}
        </div>
        {data.dueDate && !completed && (
          <div className="text-xs text-slate-500 mt-0.5">due {formatDate(data.dueDate)}</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export function ActionNode({ data }: any) {
  const triggered = data.triggeredAt !== null
  const success: boolean | null = data.success

  const dotColor = !triggered ? '#64748B' : success ? '#10B981' : '#F43F5E'
  const dotGlow = !triggered ? 'none' : success
    ? '0 0 6px 2px #10B98166'
    : '0 0 6px 2px #F43F5E66'

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} />
      <div
        className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-[180px]"
        style={{ borderColor: '#A78BFA', backgroundColor: '#2E106520' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-400">ACTION</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: dotGlow,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
        </div>
        <div className="text-sm font-semibold text-white mt-1">{data.name}</div>
        <div className="text-xs text-slate-400 mt-1">
          {triggered ? `sent ${formatDate(data.triggeredAt)}` : 'not triggered'}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export function EntryNode({ data }: any) {
  const SOURCE_LABELS: Record<string, string> = {
    form: 'FORM',
    manual: 'MANUAL',
    api: 'API',
    csv: 'CSV',
  }
  const label = SOURCE_LABELS[data.source] ?? data.source.toUpperCase()

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} />
      <div className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-[160px]" style={{ borderColor: '#06B6D4', backgroundColor: '#0369A140' }}>
        <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">ENTRY · {label}</div>
        {data.formName && <div className="text-xs text-slate-300 mt-1">{data.formName}</div>}
        {data.at && <div className="text-xs text-slate-500 mt-1">{formatDate(data.at)}</div>}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

// Kept for backwards compatibility (unused in new diagram)
export function SuggestionNode({ data }: any) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} />
      <div className="px-3 py-2 rounded-lg border border-dashed shadow-lg min-w-max" style={{ borderColor: '#A78BFA', backgroundColor: '#6D28D920' }}>
        <div className="text-xs font-bold uppercase tracking-wider text-purple-300">💡 {data.label}</div>
        <div className="text-xs font-semibold text-white mt-1">{data.title}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
