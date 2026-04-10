import { Handle, Position } from '@xyflow/react'
import { Icon } from './Icon'

// User Node - Central profile node
export function UserNode({ data }: any) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center shadow-lg">
        <div className="text-center">
          <Icon type="user" size={1.5} color="#06B6D4" />
        </div>
      </div>
      <div className="text-center">
        <div className="font-bold text-white text-sm">{data.name}</div>
        <div className="text-xs text-slate-400">{data.email}</div>
        <div className="text-xs text-slate-500">{data.company}</div>
      </div>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  )
}

// Event Node - Shows user lifecycle events
export function EventNode({ data }: any) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    registered: { bg: '#0369A1', border: '#06B6D4', text: '#06B6D4' },
    form: { bg: '#064E3B', border: '#10B981', text: '#10B981' },
    activation: { bg: '#7C2D12', border: '#F43F5E', text: '#F43F5E' },
    activated: { bg: '#064E3B', border: '#10B981', text: '#10B981' },
  }

  // Determine color based on label
  let color = colors.registered
  if (data.label.includes('FORM')) color = colors.form
  if (data.label.includes('ACTIVACIÓN')) color = colors.activation
  if (data.label === 'ACTIVATED') color = colors.activated

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} />

      <div
        className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-max"
        style={{
          borderColor: color.border,
          backgroundColor: `${color.bg}40`,
        }}
      >
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: color.text }}>
          {data.label}
        </div>
        <div className="text-xs text-slate-300 mt-1">{data.date || data.status}</div>
        {data.meta && <div className="text-xs text-slate-400 mt-1">{data.meta}</div>}
        {data.risk && <div className="text-xs mt-1">{data.risk}</div>}
        {data.locked && <div className="text-xs text-slate-400 mt-1">{data.locked}</div>}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}

// Goal Node - Shows milestones and goals
export function GoalNode({ data }: any) {
  const isCompleted = data.status?.includes('completed')

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} />

      <div
        className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-max"
        style={{
          borderColor: isCompleted ? '#10B981' : '#FBBF24',
          backgroundColor: isCompleted ? '#064E3B40' : '#92400E40',
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: isCompleted ? '#10B981' : '#FBBF24' }}
        >
          {data.label}
        </div>
        <div className="text-sm font-semibold text-white mt-1">◆ {data.title}</div>
        <div className="text-xs text-slate-400 mt-1">{data.status}</div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}

// Action Node - Shows actions taken or to be taken
export function ActionNode({ data }: any) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} />

      <div
        className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-max"
        style={{
          borderColor: '#A78BFA',
          backgroundColor: '#6D28D940',
        }}
      >
        <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
          {data.label}
        </div>
        <div className="text-sm font-semibold text-white mt-1">{data.title}</div>
        <div className="text-xs text-slate-400 mt-1">{data.status}</div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}

// Suggestion Node - Shows AI suggestions
export function SuggestionNode({ data }: any) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} />

      <div
        className="px-3 py-2 rounded-lg border border-dashed shadow-lg min-w-max"
        style={{
          borderColor: '#A78BFA',
          backgroundColor: '#6D28D920',
        }}
      >
        <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
          💡 {data.label}
        </div>
        <div className="text-xs font-semibold text-white mt-1">{data.title}</div>
        {data.confidence && <div className="text-xs text-purple-300 mt-1">confidence: {data.confidence}</div>}
        {data.phase && <div className="text-xs text-slate-400 mt-1">{data.phase}</div>}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
