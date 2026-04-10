import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useParams, useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import {
  UserNode,
  EventNode,
  GoalNode,
  ActionNode,
  SuggestionNode,
} from '../components/UserJourneyNodes'
import { mockUser, userJourneyFlow, userQuickActions, aiInsights } from '../data/mockUserData'

const nodeTypes = {
  userNode: UserNode,
  eventNode: EventNode,
  goalNode: GoalNode,
  actionNode: ActionNode,
  suggestionNode: SuggestionNode,
}

export function UserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [nodes, , onNodesChange] = useNodesState(userJourneyFlow.nodes)
  const [edges, , onEdgesChange] = useEdgesState(userJourneyFlow.edges)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/users')}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => navigate(`/users/${userId}/ontology`)}
                    className="text-slate-400 hover:text-slate-300 text-sm font-medium px-3 py-1 rounded border border-slate-700/50 hover:border-slate-600"
                  >
                    View Details
                  </button>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{mockUser.name}</h1>
                  <p className="text-slate-400 mt-1">{mockUser.email}</p>
                </div>
                <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
                  <span className="text-emerald-300 font-semibold text-sm">
                    {mockUser.stage.charAt(0).toUpperCase() + mockUser.stage.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6 pt-4 border-t border-slate-700/30">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Company</p>
                  <p className="text-white font-semibold text-sm">{mockUser.company}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Registered</p>
                  <p className="text-white font-semibold text-sm">{mockUser.registeredDate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Last Active</p>
                  <p className="text-white font-semibold text-sm">{mockUser.lastActive}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Activation Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${mockUser.activationRate}%` }}
                      />
                    </div>
                    <span className="text-white font-semibold text-sm">{mockUser.activationRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex gap-6 overflow-hidden p-6">
            {/* Graph Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl overflow-hidden flex-1">
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
                </ReactFlow>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-72 flex flex-col gap-6 overflow-auto">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-4 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Icon type="zap" size={0.9} color="#F59E0B" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {userQuickActions.map((action) => (
                    <button
                      key={action.id}
                      className="w-full px-3 py-2 rounded-lg border border-slate-600/50 hover:border-slate-500 hover:bg-slate-700/30 transition text-sm text-slate-300 hover:text-white font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Icon type={action.icon as any} size={0.85} color={action.color} />
                        <span>{action.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-4 backdrop-blur-sm flex-1 overflow-auto">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Icon type="lightbulb" size={0.9} color="#A78BFA" />
                  AI Insights
                </h3>
                <div className="space-y-3">
                  {aiInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className={`p-3 rounded-lg border-l-2 ${
                        insight.type === 'positive'
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-amber-500/50 bg-amber-500/10'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: insight.type === 'positive' ? '#10B981' : '#F59E0B',
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white">{insight.title}</p>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{insight.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  insight.type === 'positive' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${insight.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 font-medium">{insight.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
