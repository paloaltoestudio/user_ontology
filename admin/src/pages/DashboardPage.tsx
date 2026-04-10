import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import { StageNode } from '../components/GraphNodes'
import { kpiData, userJourneyData, stageColorMap } from '../data/mockGraphData'

const nodeTypes = {
  custom: StageNode,
}

export function DashboardPage() {
  const [nodes, , onNodesChange] = useNodesState(userJourneyData.nodes)
  const [edges, , onEdgesChange] = useEdgesState(userJourneyData.edges)

  const kpis: Array<{
    label: string
    value: string
    change: string
    icon: 'user-plus' | 'zap' | 'check-circle' | 'trending-down'
    color: typeof stageColorMap['registered']
  }> = [
    {
      label: 'TOTAL REGISTRADOS',
      value: kpiData.totalRegistered.toLocaleString(),
      change: '+18% vs mes anterior',
      icon: 'user-plus',
      color: stageColorMap.registered,
    },
    {
      label: 'EN ACTIVACIÓN',
      value: kpiData.inActivation.toLocaleString(),
      change: '39.3% del total',
      icon: 'zap',
      color: stageColorMap.in_activation,
    },
    {
      label: 'ACTIVADOS',
      value: kpiData.activated.toLocaleString(),
      change: '25.6% tasa activación',
      icon: 'check-circle',
      color: stageColorMap.activated,
    },
    {
      label: 'DROPPED / INACTIVOS',
      value: kpiData.droppedInactivos.toLocaleString(),
      change: '35.1% → punto crítico',
      icon: 'trending-down',
      color: stageColorMap.dropped,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* KPI Cards */}
          <div className="p-6 border-b border-slate-700/30 backdrop-blur-sm bg-slate-950/50">
            <div className="mb-4">
              {/* <h1 className="text-3xl font-bold text-white">User Engagement Dashboard</h1> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm"
                  style={{
                    background: `linear-gradient(135deg, ${kpi.color.bg}20 0%, ${kpi.color.bg}10 100%)`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                        {kpi.label}
                      </p>
                      <p className="text-2xl font-bold text-white mt-2">{kpi.value}</p>
                    </div>
                    <Icon type={kpi.icon} size={1.2} color={kpi.color.text} />
                  </div>
                  <p className="text-xs text-slate-400">{kpi.change}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Graph Visualization */}
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background
                color="#1e293b"
                gap={16}
                size={1}
                style={{
                  backgroundColor: 'rgb(15, 23, 42)',
                }}
              />
              <Controls
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                }}
              />
              <MiniMap
                style={{
                  backgroundColor: '#0f1729',
                  border: '1px solid #334155',
                }}
                maskColor="rgba(0, 0, 0, 0.5)"
              />
            </ReactFlow>

            {/* Legend */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#06B6D4' }} />
                  <span className="text-slate-300">Registered Users</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FBBF24' }} />
                  <span className="text-slate-300">In Activation</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
                  <span className="text-slate-300">Activated</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F43F5E' }} />
                  <span className="text-slate-300">Dropped / Inactive</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
