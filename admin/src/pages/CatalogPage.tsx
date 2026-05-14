import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import { catalogApi, StageDefinition, TagDefinition, PropertyDefinition, EventTypeDefinition, ValueType } from '../api/catalog'

type CatalogTab = 'stages' | 'tags' | 'properties' | 'event-types'

const VALUE_TYPES: ValueType[] = ['string', 'number', 'boolean', 'datetime']

// ---------------------------------------------------------------------------
// Shared delete button
// ---------------------------------------------------------------------------

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 text-slate-500 hover:text-red-400 transition"
      title="Delete"
    >
      <Icon type="trash-2" size={0.75} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Stages tab
// ---------------------------------------------------------------------------

function StagesTab() {
  const qc = useQueryClient()
  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['catalog-stages'],
    queryFn: catalogApi.listStages,
  })
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [color, setColor] = useState('')

  const create = useMutation({
    mutationFn: () => catalogApi.createStage({ name: name.trim(), description: desc.trim() || undefined, color: color.trim() || undefined }),
    onSuccess: () => {
      setName(''); setDesc(''); setColor('')
      qc.invalidateQueries({ queryKey: ['catalog-stages'] })
    },
  })

  const del = useMutation({
    mutationFn: (id: number) => catalogApi.deleteStage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-stages'] }),
  })

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-300">New Stage</p>
        <div className="flex gap-2 flex-wrap">
          <input
            className="flex-1 min-w-[160px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Stage name (e.g. Onboarding)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && create.mutate()}
          />
          <input
            className="flex-1 min-w-[160px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <input
            className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="#color"
            value={color}
            onChange={e => setColor(e.target.value)}
          />
          <button
            onClick={() => name.trim() && create.mutate()}
            disabled={!name.trim() || create.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-lg transition"
          >
            Add
          </button>
        </div>
        {create.isError && <p className="text-xs text-red-400">Failed to create stage.</p>}
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : stages.length === 0 ? (
        <p className="text-slate-500 text-sm">No stages defined yet.</p>
      ) : (
        <div className="space-y-2">
          {stages.map((s: StageDefinition) => (
            <div key={s.id} className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/40 rounded-lg px-4 py-3">
              {s.color && (
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{s.name}</p>
                {s.description && <p className="text-xs text-slate-400 truncate">{s.description}</p>}
              </div>
              <DeleteBtn onClick={() => del.mutate(s.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tags tab
// ---------------------------------------------------------------------------

function TagsTab() {
  const qc = useQueryClient()
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['catalog-tags'],
    queryFn: catalogApi.listTags,
  })
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [color, setColor] = useState('')

  const create = useMutation({
    mutationFn: () => catalogApi.createTag({ name: name.trim(), description: desc.trim() || undefined, color: color.trim() || undefined }),
    onSuccess: () => {
      setName(''); setDesc(''); setColor('')
      qc.invalidateQueries({ queryKey: ['catalog-tags'] })
    },
  })

  const del = useMutation({
    mutationFn: (id: number) => catalogApi.deleteTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-tags'] }),
  })

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-300">New Tag</p>
        <div className="flex gap-2 flex-wrap">
          <input
            className="flex-1 min-w-[160px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Tag name (e.g. vip, at-risk)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && create.mutate()}
          />
          <input
            className="flex-1 min-w-[160px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <input
            className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="#color"
            value={color}
            onChange={e => setColor(e.target.value)}
          />
          <button
            onClick={() => name.trim() && create.mutate()}
            disabled={!name.trim() || create.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-lg transition"
          >
            Add
          </button>
        </div>
        {create.isError && <p className="text-xs text-red-400">Failed to create tag.</p>}
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : tags.length === 0 ? (
        <p className="text-slate-500 text-sm">No tags defined yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t: TagDefinition) => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
              style={t.color
                ? { backgroundColor: t.color + '25', borderColor: t.color + '60', color: t.color }
                : { backgroundColor: 'rgba(51,65,85,0.4)', borderColor: 'rgba(71,85,105,0.5)', color: '#94a3b8' }
              }
            >
              <span>{t.name}</span>
              {t.description && <span className="text-xs opacity-60">— {t.description}</span>}
              <button
                onClick={() => del.mutate(t.id)}
                className="opacity-50 hover:opacity-100 transition ml-1"
              >
                <Icon type="x" size={0.55} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Properties tab
// ---------------------------------------------------------------------------

function PropertiesTab() {
  const qc = useQueryClient()
  const { data: props = [], isLoading } = useQuery({
    queryKey: ['catalog-properties'],
    queryFn: catalogApi.listProperties,
  })
  const [key, setKey] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [desc, setDesc] = useState('')
  const [valueType, setValueType] = useState<ValueType>('string')

  const create = useMutation({
    mutationFn: () => catalogApi.createProperty({
      key: key.trim(),
      display_name: displayName.trim() || undefined,
      description: desc.trim() || undefined,
      value_type: valueType,
    }),
    onSuccess: () => {
      setKey(''); setDisplayName(''); setDesc(''); setValueType('string')
      qc.invalidateQueries({ queryKey: ['catalog-properties'] })
    },
  })

  const del = useMutation({
    mutationFn: (id: number) => catalogApi.deleteProperty(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-properties'] }),
  })

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-300">New Property</p>
        <div className="flex gap-2 flex-wrap">
          <input
            className="w-40 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Key (e.g. plan_tier)"
            value={key}
            onChange={e => setKey(e.target.value)}
          />
          <input
            className="flex-1 min-w-[120px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Display name (optional)"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
          <input
            className="flex-1 min-w-[120px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <select
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            value={valueType}
            onChange={e => setValueType(e.target.value as ValueType)}
          >
            {VALUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={() => key.trim() && create.mutate()}
            disabled={!key.trim() || create.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-lg transition"
          >
            Add
          </button>
        </div>
        {create.isError && <p className="text-xs text-red-400">Failed to create property.</p>}
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : props.length === 0 ? (
        <p className="text-slate-500 text-sm">No properties defined yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase">
              <th className="text-left py-2 pr-4">Key</th>
              <th className="text-left py-2 pr-4">Display Name</th>
              <th className="text-left py-2 pr-4">Type</th>
              <th className="text-left py-2 pr-4">Description</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {props.map((p: PropertyDefinition) => (
              <tr key={p.id} className="hover:bg-slate-800/20">
                <td className="py-2.5 pr-4 font-mono text-blue-300">{p.key}</td>
                <td className="py-2.5 pr-4 text-slate-300">{p.display_name ?? '—'}</td>
                <td className="py-2.5 pr-4">
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-700/50 text-slate-300">{p.value_type}</span>
                </td>
                <td className="py-2.5 pr-4 text-slate-400 text-xs">{p.description ?? '—'}</td>
                <td className="py-2.5"><DeleteBtn onClick={() => del.mutate(p.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Event Types tab
// ---------------------------------------------------------------------------

function EventTypesTab() {
  const qc = useQueryClient()
  const { data: eventTypes = [], isLoading } = useQuery({
    queryKey: ['catalog-event-types'],
    queryFn: catalogApi.listEventTypes,
  })
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const create = useMutation({
    mutationFn: () => catalogApi.createEventType({ name: name.trim(), description: desc.trim() || undefined }),
    onSuccess: () => {
      setName(''); setDesc('')
      qc.invalidateQueries({ queryKey: ['catalog-event-types'] })
    },
  })

  const del = useMutation({
    mutationFn: (id: number) => catalogApi.deleteEventType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-event-types'] }),
  })

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-300">New Event Type</p>
        <div className="flex gap-2 flex-wrap">
          <input
            className="flex-1 min-w-[180px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Name (e.g. ecommerce.purchase)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && create.mutate()}
          />
          <input
            className="flex-1 min-w-[180px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <button
            onClick={() => name.trim() && create.mutate()}
            disabled={!name.trim() || create.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-lg transition"
          >
            Add
          </button>
        </div>
        {create.isError && <p className="text-xs text-red-400">Failed to create event type.</p>}
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : eventTypes.length === 0 ? (
        <p className="text-slate-500 text-sm">No event types defined yet.</p>
      ) : (
        <div className="space-y-2">
          {eventTypes.map((et: EventTypeDefinition) => (
            <div key={et.id} className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/40 rounded-lg px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-blue-300">{et.name}</p>
                {et.description && <p className="text-xs text-slate-400">{et.description}</p>}
              </div>
              <DeleteBtn onClick={() => del.mutate(et.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS: { id: CatalogTab; label: string }[] = [
  { id: 'stages', label: 'Stages' },
  { id: 'tags', label: 'Tags' },
  { id: 'properties', label: 'Properties' },
  { id: 'event-types', label: 'Event Types' },
]

export function CatalogPage() {
  const [tab, setTab] = useState<CatalogTab>('stages')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-700/30 backdrop-blur-sm bg-slate-950/50">
            <h1 className="text-xl font-bold text-white">Catalog</h1>
            <p className="text-sm text-slate-400 mt-0.5">Global definitions shared across all leads in this account.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4 border-b border-slate-700/30">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                  tab === t.id
                    ? 'bg-slate-800 text-white border border-b-slate-800 border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'stages' && <StagesTab />}
            {tab === 'tags' && <TagsTab />}
            {tab === 'properties' && <PropertiesTab />}
            {tab === 'event-types' && <EventTypesTab />}
          </div>
        </main>
      </div>
    </div>
  )
}
