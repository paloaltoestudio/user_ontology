import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  UserNode,
  EventNode,
  GoalNode,
  ActionNode,
  EntryNode,
} from '../components/UserJourneyNodes'
import { mockUsers } from '../data/mockUsers'
import { useToast } from '../hooks/useToast'
import { leadsApi, LeadEvent, LeadProperty, LeadTag, LeadStageHistory } from '../api/leads'
import { catalogApi } from '../api/catalog'
import { formsApi } from '../api/forms'
import { actionsApi } from '../api/actions'
import { goalsApi } from '../api/goals'
import { GoalStatus, SuggestionPriority, SuggestionType } from '../types/user'
import { Action } from '../types/action'
import { Goal } from '../types/goal'
import { ConfirmActionModal } from '../components/DeleteGoalConfirmModal'

const nodeTypes = {
  userNode: UserNode,
  eventNode: EventNode,
  goalNode: GoalNode,
  actionNode: ActionNode,
  entryNode: EntryNode,
}

type TabType = 'journey' | 'details' | 'data'

// ---------------------------------------------------------------------------
// Data tab sub-panels
// ---------------------------------------------------------------------------

function StagePanel({ leadId, currentStage }: { leadId: number; currentStage: string | null }) {
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()
  const [editValue, setEditValue] = useState(currentStage ?? '')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: history = [] } = useQuery<LeadStageHistory[]>({
    queryKey: ['lead-stage-history', leadId],
    queryFn: () => leadsApi.getStageHistory(leadId),
  })

  const { data: catalogStages = [] } = useQuery({
    queryKey: ['catalog-stages'],
    queryFn: catalogApi.listStages,
  })

  // Keep edit field in sync when parent lead reloads
  useEffect(() => { setEditValue(currentStage ?? '') }, [currentStage])

  const handleSave = async () => {
    const newStage = editValue.trim() || null
    if (newStage === currentStage) return
    try {
      setSaving(true)
      await leadsApi.setStage(leadId, newStage, note.trim() || undefined)
      queryClient.invalidateQueries({ queryKey: ['lead', String(leadId)] })
      queryClient.invalidateQueries({ queryKey: ['lead-stage-history', leadId] })
      queryClient.invalidateQueries({ queryKey: ['catalog-stages'] })
      setNote('')
      showSuccess('Stage updated')
    } catch {
      showError('Failed to update stage')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (s: string) => new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Icon type="flag" size={1} color="#60A5FA" />
        Stage
      </h3>

      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            list="stage-catalog-list"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="e.g. trial_started, customer, churned…"
            className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
          />
          <datalist id="stage-catalog-list">
            {catalogStages.map(s => <option key={s.id} value={s.name} />)}
          </datalist>
          <button
            onClick={handleSave}
            disabled={saving || editValue.trim() === (currentStage ?? '')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition whitespace-nowrap"
          >
            {saving ? 'Saving…' : 'Set Stage'}
          </button>
        </div>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (reason for change)"
          className="w-full px-3 py-2 bg-slate-700/30 border border-slate-600/30 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
        />
      </div>

      {history.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">History</p>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={h.id} className="flex items-start gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === history.length - 1 ? 'bg-blue-400' : 'bg-slate-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {h.from_stage && <span className="text-slate-400 line-through text-xs">{h.from_stage}</span>}
                    <span className="text-white font-medium">{h.to_stage || <em className="text-slate-500 not-italic">cleared</em>}</span>
                    {h.note && <span className="text-slate-400 text-xs">— {h.note}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{fmt(h.created_at)}{h.changed_by ? ` · ${h.changed_by}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TagsPanel({ leadId }: { leadId: number }) {
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()
  const [newTag, setNewTag] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const { data: tags = [] } = useQuery<LeadTag[]>({
    queryKey: ['lead-tags', leadId],
    queryFn: () => leadsApi.listTags(leadId),
  })

  const { data: catalogTags = [] } = useQuery({
    queryKey: ['catalog-tags'],
    queryFn: catalogApi.listTags,
  })

  const appliedNames = new Set(tags.map(t => t.name))
  const availableCatalogTags = catalogTags.filter(ct => !appliedNames.has(ct.name))

  const handleAdd = async (name?: string) => {
    const tagName = (name ?? newTag).trim()
    if (!tagName) return
    try {
      setAdding(true)
      await leadsApi.applyTag(leadId, tagName)
      queryClient.invalidateQueries({ queryKey: ['lead-tags', leadId] })
      queryClient.invalidateQueries({ queryKey: ['catalog-tags'] })
      if (!name) setNewTag('')
      showSuccess(`Tag "${tagName}" applied`)
    } catch {
      showError('Failed to apply tag')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (name: string) => {
    try {
      setRemoving(name)
      await leadsApi.removeTag(leadId, name)
      queryClient.invalidateQueries({ queryKey: ['lead-tags', leadId] })
    } catch {
      showError(`Failed to remove tag "${name}"`)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Icon type="tag" size={1} color="#A78BFA" />
        Tags
      </h3>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          list="tag-catalog-list"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add tag…"
          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
        />
        <datalist id="tag-catalog-list">
          {availableCatalogTags.map(ct => <option key={ct.id} value={ct.name} />)}
        </datalist>
        <button
          onClick={() => handleAdd()}
          disabled={adding || !newTag.trim()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
        >
          {adding ? '…' : 'Add'}
        </button>
      </div>

      {/* Catalog quick-add */}
      {availableCatalogTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {availableCatalogTags.slice(0, 8).map(ct => (
            <button
              key={ct.id}
              onClick={() => handleAdd(ct.name)}
              className="px-2.5 py-0.5 rounded-full text-xs border border-dashed border-slate-600 text-slate-400 hover:border-purple-500/50 hover:text-purple-300 transition"
            >
              + {ct.name}
            </button>
          ))}
        </div>
      )}

      {tags.length === 0 ? (
        <p className="text-slate-500 text-sm">No tags yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium rounded-full"
            >
              {tag.name}
              <button
                onClick={() => handleRemove(tag.name)}
                disabled={removing === tag.name}
                className="text-purple-400 hover:text-red-400 transition ml-0.5"
              >
                {removing === tag.name ? '…' : '×'}
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const VALUE_TYPES = ['string', 'number', 'boolean', 'datetime'] as const
type ValueType = typeof VALUE_TYPES[number]

function PropertiesPanel({ leadId }: { leadId: number }) {
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newType, setNewType] = useState<ValueType>('string')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editType, setEditType] = useState<ValueType>('string')
  const [deleting, setDeleting] = useState<string | null>(null)

  const { data: props = [] } = useQuery<LeadProperty[]>({
    queryKey: ['lead-properties', leadId],
    queryFn: () => leadsApi.listProperties(leadId),
  })

  const { data: catalogProps = [] } = useQuery({
    queryKey: ['catalog-properties'],
    queryFn: catalogApi.listProperties,
  })

  const catalogPropByKey = new Map(catalogProps.map(p => [p.key, p]))

  const handleAdd = async () => {
    const key = newKey.trim()
    const val = newValue.trim()
    if (!key || !val) return
    try {
      setAdding(true)
      await leadsApi.upsertProperty(leadId, key, { value: val, value_type: newType })
      queryClient.invalidateQueries({ queryKey: ['lead-properties', leadId] })
      queryClient.invalidateQueries({ queryKey: ['catalog-properties'] })
      setNewKey(''); setNewValue(''); setNewType('string')
      showSuccess(`Property "${key}" saved`)
    } catch {
      showError('Failed to save property')
    } finally {
      setAdding(false)
    }
  }

  const handleKeyChange = (k: string) => {
    setNewKey(k)
    const catalogDef = catalogPropByKey.get(k)
    if (catalogDef) setNewType(catalogDef.value_type)
  }

  const startEdit = (p: LeadProperty) => {
    setEditing(p.key)
    setEditValue(p.value)
    setEditType(p.value_type)
  }

  const handleUpdate = async (key: string) => {
    try {
      await leadsApi.upsertProperty(leadId, key, { value: editValue, value_type: editType })
      queryClient.invalidateQueries({ queryKey: ['lead-properties', leadId] })
      setEditing(null)
    } catch {
      showError('Failed to update property')
    }
  }

  const handleDelete = async (key: string) => {
    try {
      setDeleting(key)
      await leadsApi.deleteProperty(leadId, key)
      queryClient.invalidateQueries({ queryKey: ['lead-properties', leadId] })
    } catch {
      showError(`Failed to delete "${key}"`)
    } finally {
      setDeleting(null)
    }
  }

  const typeBadge: Record<ValueType, string> = {
    string: 'bg-slate-600/50 text-slate-300',
    number: 'bg-blue-500/20 text-blue-300',
    boolean: 'bg-amber-500/20 text-amber-300',
    datetime: 'bg-emerald-500/20 text-emerald-300',
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Icon type="sliders" size={1} color="#34D399" />
        Properties
      </h3>

      {/* Add row */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          list="prop-catalog-list"
          value={newKey}
          onChange={(e) => handleKeyChange(e.target.value)}
          placeholder="key"
          className="w-36 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
        />
        <datalist id="prop-catalog-list">
          {catalogProps.map(p => <option key={p.id} value={p.key} label={p.display_name ?? p.key} />)}
        </datalist>
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="value"
          className="flex-1 min-w-0 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as ValueType)}
          className="px-2 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
        >
          {VALUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={handleAdd}
          disabled={adding || !newKey.trim() || !newValue.trim()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
        >
          {adding ? '…' : 'Add'}
        </button>
      </div>

      {props.length === 0 ? (
        <p className="text-slate-500 text-sm">No properties yet</p>
      ) : (
        <div className="divide-y divide-slate-700/30">
          {props.map((p) => (
            <div key={p.key} className="py-2.5 flex items-center gap-3">
              <span className="font-mono text-sm text-slate-300 w-36 flex-shrink-0 truncate" title={p.key}>{p.key}</span>
              {editing === p.key ? (
                <>
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(p.key); if (e.key === 'Escape') setEditing(null) }}
                    className="flex-1 px-2 py-1 bg-slate-700/50 border border-blue-500/40 rounded text-white text-sm focus:outline-none"
                  />
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as ValueType)}
                    className="px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm focus:outline-none"
                  >
                    {VALUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => handleUpdate(p.key)} className="text-xs text-emerald-400 hover:text-emerald-300">Save</button>
                  <button onClick={() => setEditing(null)} className="text-xs text-slate-400 hover:text-slate-300">Cancel</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-white font-mono truncate">{p.value}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeBadge[p.value_type]}`}>{p.value_type}</span>
                  <button onClick={() => startEdit(p)} className="text-slate-400 hover:text-blue-400 transition p-1">
                    <Icon type="edit-2" size={0.85} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.key)}
                    disabled={deleting === p.key}
                    className="text-slate-400 hover:text-red-400 transition p-1"
                  >
                    <Icon type="trash-2" size={0.85} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EventsPanel({ leadId }: { leadId: number }) {
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [eventType, setEventType] = useState('')
  const [payloadText, setPayloadText] = useState('{}')
  const [payloadError, setPayloadError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const { data: events = [] } = useQuery<LeadEvent[]>({
    queryKey: ['lead-events', leadId],
    queryFn: () => leadsApi.listEvents(leadId),
  })

  const { data: catalogEventTypes = [] } = useQuery({
    queryKey: ['catalog-event-types'],
    queryFn: catalogApi.listEventTypes,
  })

  const validatePayload = (text: string) => {
    try { JSON.parse(text); setPayloadError(null); return true }
    catch { setPayloadError('Invalid JSON'); return false }
  }

  const handleAdd = async () => {
    const type = eventType.trim()
    if (!type) return
    if (!validatePayload(payloadText)) return
    try {
      setAdding(true)
      await leadsApi.createEvent(leadId, { event_type: type, payload: JSON.parse(payloadText) })
      queryClient.invalidateQueries({ queryKey: ['lead-events', leadId] })
      queryClient.invalidateQueries({ queryKey: ['catalog-event-types'] })
      setEventType(''); setPayloadText('{}'); setShowForm(false)
      showSuccess('Event recorded')
    } catch {
      showError('Failed to record event')
    } finally {
      setAdding(false)
    }
  }

  const fmt = (s: string) => new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Icon type="activity" size={1} color="#FBBF24" />
          Events
        </h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition"
        >
          <Icon type="plus" size={0.85} />
          Record Event
        </button>
      </div>

      {showForm && (
        <div className="mb-5 p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-3">
          <input
            type="text"
            list="event-type-catalog-list"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="event_type  e.g. ecommerce.purchase"
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono"
          />
          <datalist id="event-type-catalog-list">
            {catalogEventTypes.map(et => <option key={et.id} value={et.name} />)}
          </datalist>
          <div>
            <textarea
              value={payloadText}
              onChange={(e) => { setPayloadText(e.target.value); validatePayload(e.target.value) }}
              rows={3}
              placeholder='{ "key": "value" }'
              className={`w-full px-3 py-2 bg-slate-700/50 border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none font-mono resize-none ${payloadError ? 'border-red-500/50 focus:ring-1 focus:ring-red-500/20' : 'border-slate-600/50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20'}`}
            />
            {payloadError && <p className="text-xs text-red-400 mt-1">{payloadError}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding || !eventType.trim() || !!payloadError}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              {adding ? 'Recording…' : 'Record'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-300 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-slate-500 text-sm">No events yet</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev, i) => (
            <div key={ev.id} className="flex gap-3 items-start">
              <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-slate-600'}`} />
                {i < events.length - 1 && <div className="w-px flex-1 bg-slate-700/50 mt-1" style={{ minHeight: 16 }} />}
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-white font-medium">{ev.event_type}</span>
                  <span className="text-xs text-slate-500">{fmt(ev.created_at)}</span>
                  <span className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">{ev.source}</span>
                </div>
                {Object.keys(ev.payload).length > 0 && (
                  <pre className="mt-1 text-xs text-slate-400 bg-slate-900/50 rounded p-2 overflow-x-auto">{JSON.stringify(ev.payload, null, 2)}</pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function UserDetailPageTabbed() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('journey')
  const [suggestionTab, setSuggestionTab] = useState<'pending' | 'applied'>('pending')
  const [isDeleting, setIsDeleting] = useState(false)
  const [actions, setActions] = useState<Action[]>([])
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null)
  const [loadingActions, setLoadingActions] = useState(false)
  const [applyingAction, setApplyingAction] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null)
  const [loadingGoals, setLoadingGoals] = useState(false)
  const [assigningGoal, setAssigningGoal] = useState(false)
  const [assignedGoals, setAssignedGoals] = useState<Record<string, any>[]>([])
  const [loadingAssignedGoals, setLoadingAssignedGoals] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [deleteGoalData, setDeleteGoalData] = useState<{ goalId: number; assignmentId: number; goalName: string } | null>(null)
  const [isRemovingGoal, setIsRemovingGoal] = useState(false)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const { data: journey, refetch: refetchJourney } = useQuery({
    queryKey: ['lead-journey', userId],
    queryFn: () => leadsApi.getJourney(Number(userId)),
    enabled: !!userId,
  })

  useEffect(() => {
    if (activeTab === 'journey') refetchJourney()
  }, [activeTab])

  useEffect(() => {
    if (!journey) return

    const newNodes: any[] = []
    const newEdges: any[] = []

    const CX = 500
    const CY = 380
    const RADIUS = 300
    const toRad = (deg: number) => (deg * Math.PI) / 180

    const radialPos = (spokeDeg: number, index: number, total: number, radius = RADIUS) => {
      const spread = total <= 1 ? 0 : Math.min(60, (total - 1) * 22)
      const start = spokeDeg - spread / 2
      const angle = total === 1 ? spokeDeg : start + (index / (total - 1)) * spread
      return {
        x: CX + radius * Math.cos(toRad(angle)),
        y: CY + radius * Math.sin(toRad(angle)),
      }
    }

    const edge = (id: string, source: string, target: string, color: string, animated = false) => ({
      id, source, target, animated,
      style: { stroke: color, strokeDasharray: '6,3', strokeWidth: 1.5, opacity: 0.5 },
    })

    newNodes.push({
      id: 'user', type: 'userNode', position: { x: CX - 48, y: CY - 60 },
      data: { name: `${journey.lead.name} ${journey.lead.last_name}`, email: journey.lead.email, company: journey.lead.company, stage: journey.lead.stage },
    })

    const entryPos = radialPos(270, 0, 1)
    newNodes.push({
      id: 'entry', type: 'entryNode', position: entryPos,
      data: { source: journey.entry.source, formName: journey.entry.form_name, at: journey.entry.at },
    })
    newEdges.push(edge('e-user-entry', 'user', 'entry', '#06B6D4'))

    journey.goals.forEach((g, i) => {
      const id = `goal-${g.id}`
      newNodes.push({
        id, type: 'goalNode', position: radialPos(0, i, journey.goals.length),
        data: { name: g.name, completed: g.completed, completedAt: g.completed_at, dueDate: g.due_date },
      })
      newEdges.push(edge(`e-user-${id}`, 'user', id, g.completed ? '#10B981' : '#FBBF24', g.completed))
    })

    journey.actions.forEach((a, i) => {
      const id = `action-${a.id}`
      newNodes.push({
        id, type: 'actionNode', position: radialPos(180, i, journey.actions.length),
        data: { name: a.name, success: a.last_success, triggeredAt: a.last_triggered_at },
      })
      const color = a.last_triggered_at === null ? '#A78BFA' : a.last_success ? '#10B981' : '#F43F5E'
      newEdges.push(edge(`e-user-${id}`, 'user', id, color))
    })

    const lastStageIdx = journey.stage_history.length - 1
    journey.stage_history.forEach((h, i) => {
      const id = `stage-${h.id}`
      newNodes.push({
        id, type: 'eventNode', position: radialPos(90, i, journey.stage_history.length),
        data: { label: h.to_stage.toUpperCase(), sublabel: h.from_stage ? `← ${h.from_stage}` : 'initial stage', timestamp: h.created_at, color: '#60A5FA', isCurrent: i === lastStageIdx },
      })
      newEdges.push(edge(`e-user-${id}`, 'user', id, '#60A5FA'))
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [journey, setNodes, setEdges])

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['lead', userId],
    queryFn: () => leadsApi.getLead(Number(userId)),
  })

  const { data: form } = useQuery({
    queryKey: ['form', user?.form_id],
    queryFn: () => formsApi.getForm(user!.form_id),
    enabled: !!user?.form_id,
  })

  if (error) showError('Failed to load lead details')

  useEffect(() => {
    const loadActions = async () => {
      try {
        setLoadingActions(true)
        setActions(await actionsApi.listActions())
      } catch { console.error('Failed to load actions') }
      finally { setLoadingActions(false) }
    }
    loadActions()
  }, [])

  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoadingGoals(true)
        setGoals(await goalsApi.listGoals())
      } catch { console.error('Failed to load goals') }
      finally { setLoadingGoals(false) }
    }
    loadGoals()
  }, [])

  useEffect(() => {
    if (!user) return
    const loadUserGoals = async () => {
      try {
        setLoadingAssignedGoals(true)
        setAssignedGoals(await goalsApi.getUserGoalAssignments(user.id))
      } catch { console.error('Failed to load assigned goals') }
      finally { setLoadingAssignedGoals(false) }
    }
    loadUserGoals()
  }, [user?.id])

  const handleApplyAction = async () => {
    if (!selectedActionId || !user) return
    try {
      setApplyingAction(true)
      await actionsApi.triggerAction(selectedActionId, [user.id])
      setSelectedActionId(null)
      showSuccess('Action applied successfully')
    } catch { showError('Failed to apply action') }
    finally { setApplyingAction(false) }
  }

  const handleAssignGoal = async () => {
    if (!selectedGoalId || !user) return
    try {
      setAssigningGoal(true)
      await goalsApi.assignGoalToUser(selectedGoalId, user.id)
      setSelectedGoalId(null)
      setAssignedGoals(await goalsApi.getUserGoalAssignments(user.id))
      showSuccess('Goal assigned successfully')
    } catch { showError('Failed to assign goal') }
    finally { setAssigningGoal(false) }
  }

  const handleRemoveGoalAssignment = (goalId: number, assignmentId: number, goalName: string) => {
    setDeleteGoalData({ goalId, assignmentId, goalName })
    setShowDeleteConfirmModal(true)
  }

  const handleConfirmRemoveGoal = async () => {
    if (!user || !deleteGoalData) return
    try {
      setIsRemovingGoal(true)
      await goalsApi.removeAssignment(deleteGoalData.goalId, deleteGoalData.assignmentId)
      setAssignedGoals((prev) => prev.filter((a) => a.id !== deleteGoalData.assignmentId))
      showSuccess('Goal assignment removed successfully')
      try { setAssignedGoals(await goalsApi.getUserGoalAssignments(user.id)) } catch {}
    } catch { showError('Failed to remove goal assignment') }
    finally {
      setIsRemovingGoal(false)
      setShowDeleteConfirmModal(false)
      setDeleteGoalData(null)
    }
  }

  const getGoalStatusColor = (status: GoalStatus) => {
    const colors: Record<GoalStatus, { bg: string; text: string; icon: string }> = {
      completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', icon: 'check-circle' },
      in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-300', icon: 'clock' },
      not_started: { bg: 'bg-slate-500/10', text: 'text-slate-300', icon: 'circle' },
    }
    return colors[status]
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      login: 'log-in',
      form_submission: 'file-text',
      goal_completed: 'check-circle',
      profile_updated: 'user',
      feature_accessed: 'zap',
    }
    return icons[type] || 'activity'
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const goalStatusLabel: Record<GoalStatus, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    not_started: 'Not Started',
  }

  const mockUser = useMemo(() => mockUsers.find((u) => u.id === Number(userId)), [userId])

  const getUnmappedFormData = useMemo(() => {
    if (!user?.form_data || !form?.lead_field_mapping) return {}
    const mappedValues = new Set<string>(Object.values(form.lead_field_mapping).filter(Boolean) as string[])
    const unmapped: Record<string, any> = {}
    Object.entries(user.form_data).forEach(([key, value]) => {
      if (!mappedValues.has(key)) unmapped[key] = value
    })
    return unmapped
  }, [user?.form_data, form?.lead_field_mapping])

  const handleDeleteLead = async () => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return
    try {
      setIsDeleting(true)
      await leadsApi.deleteLead(Number(userId))
      showSuccess('Lead deleted successfully')
      navigate('/users')
    } catch { showError('Failed to delete lead') }
    finally { setIsDeleting(false) }
  }

  const getSuggestionPriorityColor = (priority: SuggestionPriority) => {
    const colors: Record<SuggestionPriority, { bg: string; border: string; badge: string }> = {
      urgent: { bg: 'bg-red-500/10', border: 'border-red-500/30', badge: 'bg-red-500/20 text-red-300' },
      high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300' },
      medium: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' },
      low: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', badge: 'bg-slate-500/20 text-slate-300' },
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

  const suggestionCounts = useMemo(() => {
    if (!mockUser?.suggestions) return { pending: 0, applied: 0 }
    return {
      pending: mockUser.suggestions.filter((s) => (s.status || 'pending') === 'pending').length,
      applied: mockUser.suggestions.filter((s) => s.status === 'applied').length,
    }
  }, [mockUser])

  const filteredSuggestions = useMemo(() => {
    if (!mockUser?.suggestions) return []
    return mockUser.suggestions.filter((s) => (s.status || 'pending') === suggestionTab)
  }, [mockUser, suggestionTab])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 mb-4">Lead not found</p>
              <button onClick={() => navigate('/users')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                Back to Leads
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'journey', label: 'Journey' },
    { id: 'details', label: 'Details' },
    { id: 'data', label: 'Data' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-8 py-4">
            <div className="max-w-7xl mx-auto">
              <button onClick={() => navigate('/users')} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2">
                ← Back to Leads
              </button>
            </div>
          </div>

          {/* Lead Summary Card */}
          <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-8 py-3">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-lg font-bold text-white whitespace-nowrap">{user.name || user.email}</h2>
                  <span className="text-slate-500 text-sm">·</span>
                  <p className="text-slate-400 text-sm truncate">{user.email}</p>
                  {user.company && (
                    <>
                      <span className="text-slate-500 text-sm">·</span>
                      <p className="text-slate-400 text-sm truncate">{user.company}</p>
                    </>
                  )}
                </div>
                {user.stage ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300 whitespace-nowrap flex-shrink-0">
                    {user.stage}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 whitespace-nowrap flex-shrink-0">
                    No stage
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 px-8">
            <div className="max-w-7xl mx-auto flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'journey' && (
              <div className="h-full p-6">
                <div className="h-full bg-slate-900/30 border border-slate-700/30 rounded-xl overflow-hidden">
                  <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView>
                    <Background color="#1e293b" gap={16} size={1} style={{ backgroundColor: 'rgb(15, 23, 42)' }} />
                    <Controls style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.5)' }} />
                  </ReactFlow>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="h-full overflow-auto">
                <div className="p-8">
                  <div className="max-w-5xl mx-auto space-y-8">

                    {/* Lead Information */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                      <h2 className="text-lg font-bold text-white mb-6">Lead Information</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Submitted</p>
                          <p className="text-white font-semibold text-lg">{formatDate(user.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Last Updated</p>
                          <p className="text-white font-semibold text-lg">{formatDate(user.updated_at)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Stage</p>
                          <p className="text-white font-semibold text-lg">{user.stage || <span className="text-slate-500 text-base font-normal">—</span>}</p>
                        </div>
                      </div>
                    </div>

                    {user.notes && (
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Icon type="sticky-note" size={1.25} color="#0582BE" />
                          Notes
                        </h2>
                        <p className="text-slate-300">{user.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 items-center">
                      <select
                        value={selectedActionId || ''}
                        onChange={(e) => setSelectedActionId(e.target.value ? Number(e.target.value) : null)}
                        disabled={loadingActions}
                        className="w-80 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition disabled:opacity-50"
                      >
                        <option value="">{loadingActions ? 'Loading actions...' : 'Select an action...'}</option>
                        {actions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      {selectedActionId && (
                        <button onClick={handleApplyAction} disabled={applyingAction} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition">
                          {applyingAction ? 'Applying...' : 'Apply Action'}
                        </button>
                      )}
                      <button onClick={handleDeleteLead} disabled={isDeleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition ml-auto">
                        {isDeleting ? 'Deleting...' : 'Delete Lead'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Goals */}
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                          <Icon type="target" size={1.25} color="#0582BE" />
                          Goals & Milestones
                        </h2>
                        <div className="mb-6 pb-6 border-b border-slate-700/30 flex gap-3 items-center">
                          <select
                            value={selectedGoalId || ''}
                            onChange={(e) => setSelectedGoalId(e.target.value ? Number(e.target.value) : null)}
                            disabled={loadingGoals}
                            className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition disabled:opacity-50"
                          >
                            <option value="">{loadingGoals ? 'Loading goals...' : 'Select a goal to assign...'}</option>
                            {goals.filter((g) => g.is_active && !assignedGoals.some((a) => a.goal_id === g.id)).map((g) => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                          {selectedGoalId && (
                            <button onClick={handleAssignGoal} disabled={assigningGoal} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition whitespace-nowrap">
                              {assigningGoal ? 'Assigning...' : 'Assign Goal'}
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          {loadingAssignedGoals ? (
                            <div className="text-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto" /></div>
                          ) : assignedGoals.length === 0 ? (
                            <p className="text-slate-400 text-center py-6">No goals assigned yet</p>
                          ) : assignedGoals.map((assignment) => {
                            const goal = assignment.goal || assignment
                            const goalStatus = goal.completion_status || (goal.is_active ? 'in_progress' : 'not_started')
                            const statusColor = getGoalStatusColor(goalStatus as GoalStatus)
                            return (
                              <div key={assignment.id} className={`p-4 rounded-lg border border-slate-700/30 ${statusColor.bg} relative`}>
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-semibold text-white">{goal.name}</p>
                                    <p className="text-sm text-slate-400 mt-1">{goal.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor.bg} ${statusColor.text} whitespace-nowrap`}>
                                      {goalStatusLabel[goalStatus as GoalStatus]}
                                    </span>
                                    <button onClick={() => handleRemoveGoalAssignment(goal.id, assignment.id, goal.name)} disabled={isRemovingGoal} className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors">
                                      <Icon type="trash-2" size={1} />
                                    </button>
                                  </div>
                                </div>
                                {assignment.assigned_at && <p className="text-xs text-slate-400 mt-3">Assigned: {formatDate(assignment.assigned_at)}</p>}
                                {assignment.due_date && <p className="text-xs text-slate-400 mt-1">Due: {formatDate(assignment.due_date)}</p>}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* User Information (unmapped form data) */}
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                          <Icon type="info" size={1.25} color="#0582BE" />
                          User Information
                        </h2>
                        {Object.keys(getUnmappedFormData).length > 0 ? (
                          <div className="space-y-4">
                            {Object.entries(getUnmappedFormData).map(([key, value]) => (
                              <div key={key}>
                                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">
                                  {key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </p>
                                <p className="text-white break-words">{String(value) || '—'}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400">No additional data</p>
                        )}
                      </div>
                    </div>

                    {/* Suggestions */}
                    {mockUser?.suggestions && mockUser.suggestions.length > 0 && (
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Icon type="zap" size={1.25} color="#F59E0B" />
                            AI Suggestions
                          </h2>
                        </div>
                        <div className="flex gap-4 border-b border-slate-700/30 pb-4 mb-6">
                          {(['pending', 'applied'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setSuggestionTab(tab)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${suggestionTab === tab ? (tab === 'pending' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white') : 'text-slate-400 hover:text-slate-300'}`}
                            >
                              {tab.charAt(0).toUpperCase() + tab.slice(1)}{' '}
                              <span className="ml-2 text-xs bg-black/30 px-2 py-0.5 rounded">{suggestionCounts[tab]}</span>
                            </button>
                          ))}
                        </div>
                        <div className="space-y-4">
                          {filteredSuggestions.length === 0 ? (
                            <div className="text-center py-8"><p className="text-slate-400">No {suggestionTab} suggestions</p></div>
                          ) : filteredSuggestions.map((suggestion) => {
                            const priorityColor = getSuggestionPriorityColor(suggestion.priority)
                            const iconInfo = getSuggestionIcon(suggestion.type)
                            const isApplied = suggestion.status === 'applied'
                            return (
                              <div key={suggestion.id} className={`p-4 rounded-lg border transition-all hover:border-slate-600 ${priorityColor.bg} ${priorityColor.border} ${isApplied ? 'opacity-75' : ''}`}>
                                <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center flex-shrink-0">
                                    <Icon type={iconInfo.icon as any} size={1.1} color={iconInfo.color} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div>
                                        <p className="font-semibold text-white">{suggestion.title}</p>
                                        <p className="text-sm text-slate-400 mt-1">{suggestion.description}</p>
                                      </div>
                                      <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${priorityColor.badge}`}>
                                        {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                                      <Icon type="info" size={0.75} color="#64748B" />{suggestion.reason}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                      {isApplied ? (
                                        <div className="flex items-center gap-3">
                                          <Icon type="check-circle" size={0.85} color="#10B981" />
                                          <span className="text-xs text-emerald-400 font-medium">Applied {suggestion.appliedAt ? formatDateTime(suggestion.appliedAt) : ''}</span>
                                          <span className="text-xs text-slate-500">{suggestion.automatable ? 'by system' : 'manually'}</span>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="text-xs text-slate-500">Suggested {formatDateTime(suggestion.suggestedAt)}</span>
                                          {suggestion.automatable ? (
                                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">Approve</button>
                                          ) : (
                                            <span className="text-xs text-slate-400 italic">Requires manual action</span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Activity Timeline */}
                    {mockUser?.activities && (
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                          <Icon type="activity" size={1.25} color="#0582BE" />
                          Activity Timeline
                        </h2>
                        <div className="space-y-4">
                          {mockUser.activities.map((activity, index) => (
                            <div key={activity.id} className="flex gap-4">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                  <Icon type={getActivityIcon(activity.type) as any} size={1} color="white" />
                                </div>
                                {index < mockUser.activities.length - 1 && (
                                  <div className="absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-4 bg-slate-700/50" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="font-semibold text-white">{activity.title}</p>
                                <p className="text-sm text-slate-400 mt-1">{activity.description}</p>
                                <p className="text-xs text-slate-500 mt-2">{formatDateTime(activity.timestamp)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="h-full overflow-auto">
                <div className="p-8">
                  <div className="max-w-5xl mx-auto space-y-6">
                    {/* Stage + Tags side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <StagePanel leadId={Number(userId)} currentStage={user.stage} />
                      <TagsPanel leadId={Number(userId)} />
                    </div>
                    {/* Properties full width */}
                    <PropertiesPanel leadId={Number(userId)} />
                    {/* Events full width */}
                    <EventsPanel leadId={Number(userId)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {showDeleteConfirmModal && deleteGoalData && (
        <ConfirmActionModal
          title="Remove goal?"
          message={
            <p>
              <span className="text-slate-300">Remove </span>
              <span className="font-semibold">"{deleteGoalData.goalName}"</span>
              <span className="text-slate-300"> from this user?</span>
            </p>
          }
          confirmText="Remove"
          onConfirm={handleConfirmRemoveGoal}
          onCancel={() => { setShowDeleteConfirmModal(false); setDeleteGoalData(null) }}
          isLoading={isRemovingGoal}
          variant="danger"
        />
      )}
    </div>
  )
}
