import { Handle, Position } from '@xyflow/react'
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { stageColorMap, Stage } from '../data/mockGraphData'
import { StageDetailTooltip } from './StageDetailTooltip'

interface StageNodeProps {
  data: {
    label: string
    count: number
    percentage: number
    stage: 'registered' | 'in_activation' | 'activated' | 'dropped'
  }
}

export function StageNode({ data }: StageNodeProps) {
  const colors = stageColorMap[data.stage]
  const [isHovered, setIsHovered] = useState(false)
  const [nodePos, setNodePos] = useState({ x: 0, y: 0 })
  const nodeRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect()
      setNodePos({ x: rect.left, y: rect.top })
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    <div ref={nodeRef} className="relative cursor-pointer" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Handle type="target" position={Position.Left} />

      <div className="flex flex-col items-center gap-2 transition-transform hover:scale-105">
        {/* Outer circle */}
        <div
          className="w-24 h-24 rounded-full flex flex-col items-center justify-center relative transition-all"
          style={{
            border: `2px solid ${colors.border}`,
            boxShadow: `0 0 20px ${colors.border}40`,
          }}
        >
          {/* Inner content */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.count}</div>
            <div className="text-xs text-slate-300">{data.stage === 'in_activation' ? 'ACTIVATING' : data.stage.toUpperCase().replace('_', ' ')}</div>
          </div>
        </div>

        {/* Percentage indicator */}
        <div className="text-xs text-center">
          <div style={{ color: colors.text }} className="font-semibold">
            {data.percentage}%
          </div>
          <div className="text-slate-400 text-xs">{data.label}</div>
        </div>
      </div>

      {/* Tooltip - rendered in portal */}
      {isHovered && createPortal(
        <StageDetailTooltip stage={data.stage as Stage} position={nodePos} />,
        document.body
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  )
}

interface CompanyNodeProps {
  data: {
    name: string
    count: number
    stage: 'registered' | 'in_activation' | 'activated' | 'dropped'
  }
  isSelected?: boolean
}

export function CompanyNode({ data, isSelected }: CompanyNodeProps) {
  const colors = stageColorMap[data.stage]

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 transition-all ${
        isSelected
          ? 'shadow-lg'
          : 'shadow'
      }`}
      style={{
        borderColor: colors.border,
        backgroundColor: `${colors.bg}20`,
        boxShadow: isSelected
          ? `0 0 20px ${colors.border}60`
          : `0 0 10px ${colors.border}30`,
      }}
    >
      <div className="flex items-center gap-2">
        <Icon type={colors.icon} size={0.9} color={colors.text} />
        <div>
          <div className="text-sm font-semibold text-white">{data.name}</div>
          <div style={{ color: colors.text }} className="text-xs font-medium">
            {data.count} users • {data.stage.replace('_', ' ')}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
    </div>
  )
}
