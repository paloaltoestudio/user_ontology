import { useEffect } from 'react'
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react'
import { useQuery } from '@tanstack/react-query'
import '@xyflow/react/dist/style.css'
import { Sidebar } from '../components/Sidebar'
import { StageNode } from '../components/GraphNodes'
import { leadsApi } from '../api/leads'

const nodeTypes = { custom: StageNode }

const PALETTE = [
  { bg: '#0369A1', border: '#06B6D4', text: '#06B6D4' },
  { bg: '#92400E', border: '#FBBF24', text: '#FBBF24' },
  { bg: '#064E3B', border: '#10B981', text: '#10B981' },
  { bg: '#500724', border: '#F43F5E', text: '#F43F5E' },
  { bg: '#3B0764', border: '#A78BFA', text: '#A78BFA' },
  { bg: '#1C1917', border: '#A8A29E', text: '#A8A29E' },
]

const EDGE_COLORS = ['#FBBF24', '#10B981', '#F43F5E', '#A78BFA', '#06B6D4']

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: leadsApi.getStats,
  })

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (!stats) return

    const { by_status, total } = stats
    const spacing = 320
    const startX = 80

    const newNodes = by_status.map((s, i) => {
      const color = PALETTE[i % PALETTE.length]
      return {
        id: s.status,
        type: 'custom',
        position: { x: startX + i * spacing, y: 250 },
        data: {
          label: s.status,
          count: s.count,
          percentage: s.percentage,
          stage: s.status,
          color,
        },
      }
    })

    const newEdges = by_status.slice(0, -1).map((s, i) => ({
      id: `e-${s.status}-${by_status[i + 1].status}`,
      source: s.status,
      target: by_status[i + 1].status,
      animated: true,
      style: { stroke: EDGE_COLORS[i % EDGE_COLORS.length], strokeWidth: 2 },
    }))

    setNodes(newNodes)
    setEdges(newEdges)
  }, [stats, setNodes, setEdges])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* KPI Cards */}
          <div className="p-6 border-b border-slate-700/30 backdrop-blur-sm bg-slate-950/50">
            {isLoading ? (
              <div className="text-slate-400 text-sm">Loading...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Total card */}
                <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 col-span-1">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Leads</p>
                  <p className="text-2xl font-bold text-white mt-2">{stats?.total.toLocaleString()}</p>
                </div>

                {/* Per-status cards */}
                {stats?.by_status.map((s, i) => {
                  const color = PALETTE[i % PALETTE.length]
                  return (
                    <div
                      key={s.status}
                      className="p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm"
                      style={{ background: `linear-gradient(135deg, ${color.bg}30 0%, ${color.bg}10 100%)` }}
                    >
                      <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: color.text }}>
                        {s.status}
                      </p>
                      <p className="text-2xl font-bold text-white mt-2">{s.count.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 mt-1">{s.percentage}% of total</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Graph */}
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background color="#1e293b" gap={16} size={1} style={{ backgroundColor: 'rgb(15, 23, 42)' }} />
              <Controls style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.5)' }} />
              <MiniMap style={{ backgroundColor: '#0f1729', border: '1px solid #334155' }} maskColor="rgba(0,0,0,0.5)" />
            </ReactFlow>

            {/* Legend */}
            {!isLoading && stats && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4">
                <div className="flex items-center gap-6 flex-wrap">
                  {stats.by_status.map((s, i) => {
                    const color = PALETTE[i % PALETTE.length]
                    return (
                      <div key={s.status} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.border }} />
                        <span className="text-slate-300 capitalize">{s.status}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
