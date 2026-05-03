import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formsApi } from '../../api/forms'
import { Form, ExternalFieldMapping, ExternalSubmission, ProcessResult } from '../../types/form'
import { Icon } from '../Icon'
import { useToast } from '../../hooks/useToast'

const LEAD_FIELD_LABELS: Record<keyof ExternalFieldMapping, string> = {
  email: 'Email *',
  name: 'First Name',
  last_name: 'Last Name',
  phone: 'Phone',
  company: 'Company',
  company_url: 'Company URL',
}

type InboxTab = 'pending' | 'failed' | 'processed'

interface Props {
  form: Form
}

export function ExternalIntegrationsPanel({ form }: Props) {
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()

  const webhookUrl = `${import.meta.env.VITE_API_URL || ''}/api/v1/inbound/${form.webhook_token}`

  const [copiedUrl, setCopiedUrl] = useState(false)
  const [activeTab, setActiveTab] = useState<InboxTab>('pending')
  const [selectedSubmission, setSelectedSubmission] = useState<ExternalSubmission | null>(null)
  const [mapping, setMapping] = useState<ExternalFieldMapping>(form.external_field_mapping || {})
  const [lastResult, setLastResult] = useState<ProcessResult | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['external-submission-stats', form.id],
    queryFn: () => formsApi.getExternalSubmissionStats(form.id),
    refetchInterval: 10000,
  })

  const { data: submissions } = useQuery({
    queryKey: ['external-submissions', form.id, activeTab],
    queryFn: () => formsApi.getExternalSubmissions(form.id, activeTab),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['external-submission-stats', form.id] })
    queryClient.invalidateQueries({ queryKey: ['external-submissions', form.id] })
    queryClient.invalidateQueries({ queryKey: ['form', String(form.id)] })
  }

  const mapAndProcessMutation = useMutation({
    mutationFn: () => formsApi.mapAndProcess(form.id, selectedSubmission!.id, mapping),
    onSuccess: (result) => {
      setLastResult(result)
      invalidate()
      setSelectedSubmission(null)
      if (result.stopped_at) {
        showError(result.message)
      } else {
        showSuccess(result.message)
      }
    },
    onError: () => showError('Failed to process submission'),
  })

  const reprocessMutation = useMutation({
    mutationFn: () => formsApi.reprocessExternalSubmissions(form.id),
    onSuccess: (result) => {
      setLastResult(result)
      invalidate()
      if (result.stopped_at) {
        showError(result.message)
      } else {
        showSuccess(result.message)
      }
    },
    onError: () => showError('Failed to reprocess submissions'),
  })

  const handleSelectSubmission = (sub: ExternalSubmission) => {
    setSelectedSubmission(sub)
    setLastResult(null)
    // Populate mapping dropdowns from this submission's keys when no mapping exists
    // Keep existing mapping so admin can adjust it
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const tabCount = (tab: InboxTab) => {
    if (!stats) return 0
    return stats[tab]
  }

  const templateKeys = selectedSubmission ? Object.keys(selectedSubmission.raw_payload) : []
  const hasMapping = !!mapping.email

  return (
    <div className="space-y-8">

      {/* Webhook URL */}
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Inbound Webhook URL</h3>
        <p className="text-slate-400 text-sm mb-3">
          Point your external form to POST to this URL. Accepts JSON and form-encoded bodies.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 font-mono truncate">
            {webhookUrl}
          </code>
          <button
            onClick={handleCopyUrl}
            className={`px-3 py-2 rounded text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
              copiedUrl ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            <Icon type="copy" size={0.75} color={copiedUrl ? '#10b981' : 'currentColor'} />
            {copiedUrl ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Last process result banner */}
      {lastResult && (
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
          lastResult.stopped_at
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <span className={lastResult.stopped_at ? 'text-red-400' : 'text-emerald-400'}>
            {lastResult.stopped_at ? '✕' : '✓'}
          </span>
          <p className={`text-sm ${lastResult.stopped_at ? 'text-red-300' : 'text-emerald-300'}`}>
            {lastResult.message}
          </p>
          <button onClick={() => setLastResult(null)} className="ml-auto text-slate-500 hover:text-slate-400 text-xs">
            dismiss
          </button>
        </div>
      )}

      {/* Submission inbox */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Submissions</h3>
          {hasMapping && (tabCount('pending') > 0 || tabCount('failed') > 0) && (
            <button
              onClick={() => reprocessMutation.mutate()}
              disabled={reprocessMutation.isPending}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded transition font-medium"
            >
              {reprocessMutation.isPending ? 'Processing...' : 'Reprocess all pending'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-4">
          {(['pending', 'failed', 'processed'] as InboxTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedSubmission(null); setLastResult(null) }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition capitalize flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-[#0582BE] text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab}
              {tabCount(tab) > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  tab === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                  tab === 'failed'  ? 'bg-red-500/20 text-red-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {tabCount(tab)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Submission list */}
        {!submissions || submissions.length === 0 ? (
          <p className="text-slate-500 text-sm italic py-4">
            {activeTab === 'pending' && 'No pending submissions. Send a test payload to get started.'}
            {activeTab === 'failed' && 'No failed submissions.'}
            {activeTab === 'processed' && 'No processed submissions yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {submissions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => activeTab !== 'processed' ? handleSelectSubmission(sub) : undefined}
                disabled={activeTab === 'processed'}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedSubmission?.id === sub.id
                    ? 'border-[#0582BE] bg-blue-500/10'
                    : activeTab === 'processed'
                    ? 'border-slate-700 bg-slate-900/50 cursor-default'
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 w-2 h-2 rounded-full ${
                      sub.status === 'pending'   ? 'bg-amber-400' :
                      sub.status === 'failed'    ? 'bg-red-400' :
                      'bg-emerald-400'
                    }`} />
                    <span className="text-xs text-slate-500 shrink-0">#{sub.id}</span>
                    <span className="text-sm text-slate-300 font-mono truncate">
                      {Object.keys(sub.raw_payload).slice(0, 4).join(', ')}
                      {Object.keys(sub.raw_payload).length > 4 && '…'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {new Date(sub.created_at).toLocaleString()}
                  </span>
                </div>
                {sub.error_message && (
                  <p className="text-xs text-red-400 mt-1.5 ml-5">{sub.error_message}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contextual mapping panel — shown when a pending/failed submission is selected */}
      {selectedSubmission && activeTab !== 'processed' && (
        <div className="border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">
              Map submission #{selectedSubmission.id}
            </h3>
            <button
              onClick={() => setSelectedSubmission(null)}
              className="text-slate-500 hover:text-slate-400 text-sm"
            >
              close
            </button>
          </div>

          {/* Raw payload */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Raw payload</p>
            <pre className="text-xs text-slate-300 font-mono bg-slate-900 border border-slate-700 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(selectedSubmission.raw_payload, null, 2)}
            </pre>
          </div>

          {/* Mapping rows */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Field mapping — select which payload key maps to each lead field
            </p>
            <div className="space-y-3">
              {(Object.keys(LEAD_FIELD_LABELS) as Array<keyof ExternalFieldMapping>).map((leadField) => (
                <div key={leadField} className="flex items-center gap-4">
                  <div className="w-32 shrink-0">
                    <span className="text-sm text-slate-300">{LEAD_FIELD_LABELS[leadField]}</span>
                  </div>
                  <span className="text-slate-600 text-sm">←</span>
                  <select
                    value={mapping[leadField] || ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [leadField]: e.target.value || undefined }))}
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-white focus:ring-2 focus:ring-[#0582BE] outline-none transition"
                  >
                    <option value="">— not mapped —</option>
                    {templateKeys.map((key) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => mapAndProcessMutation.mutate()}
              disabled={!mapping.email || mapAndProcessMutation.isPending}
              className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white text-sm rounded transition font-medium"
            >
              {mapAndProcessMutation.isPending ? 'Processing...' : 'Map & Process'}
            </button>
            {!mapping.email && (
              <span className="text-xs text-slate-500">Email mapping is required</span>
            )}
          </div>
        </div>
      )}

      {/* Empty state when no submission selected */}
      {!selectedSubmission && activeTab !== 'processed' && submissions && submissions.length > 0 && (
        <p className="text-slate-500 text-sm italic">
          Select a submission above to configure the field mapping and process it.
        </p>
      )}

    </div>
  )
}
