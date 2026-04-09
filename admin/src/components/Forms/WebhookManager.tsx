import { useState, useEffect } from 'react'
import { Form } from '../../types/form'
import { Icon } from '../Icon'

interface WebhookManagerProps {
  form: Form
  onWebhooksUpdate: (webhooks: string[]) => void
  isEditing: boolean
}

export function WebhookManager({ form, onWebhooksUpdate, isEditing }: WebhookManagerProps) {
  const [enableWebhooks, setEnableWebhooks] = useState((form.webhooks && form.webhooks.length > 0) || false)
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [webhooks, setWebhooks] = useState<string[]>(form.webhooks || [])
  const [error, setError] = useState('')

  // Sync webhooks from form prop when it changes
  useEffect(() => {
    const hasWebhooks = form.webhooks && form.webhooks.length > 0
    setEnableWebhooks(hasWebhooks || false)
    setWebhooks(form.webhooks || [])
  }, [form.webhooks])

  const handleAddWebhook = () => {
    if (!newWebhookUrl.trim()) {
      setError('URL is required')
      return
    }

    try {
      new URL(newWebhookUrl)
    } catch {
      setError('Invalid URL format')
      return
    }

    if (webhooks.includes(newWebhookUrl)) {
      setError('This URL is already added')
      return
    }

    const updatedWebhooks = [...webhooks, newWebhookUrl]
    setWebhooks(updatedWebhooks)
    onWebhooksUpdate(updatedWebhooks)
    setNewWebhookUrl('')
    setError('')
  }

  const handleRemoveWebhook = (index: number) => {
    const updatedWebhooks = webhooks.filter((_, i) => i !== index)
    setWebhooks(updatedWebhooks)
    onWebhooksUpdate(updatedWebhooks)
  }

  const handleToggleWebhooks = () => {
    const newState = !enableWebhooks
    setEnableWebhooks(newState)
    if (!newState) {
      setWebhooks([])
      onWebhooksUpdate([])
    }
  }

  if (!isEditing) {
    if (!enableWebhooks || webhooks.length === 0) {
      return (
        <div className="p-4 border border-slate-600 rounded-lg">
          <p className="text-sm text-slate-400">Webhooks are disabled</p>
        </div>
      )
    }

    return (
      <div className="p-4 border border-slate-600 rounded-lg space-y-3">
        <h4 className="font-semibold text-white text-sm">Webhooks</h4>
        <div className="space-y-2">
          {webhooks.map((url, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-slate-900/50 rounded text-sm text-slate-300 font-mono">
              <span className="truncate">{url}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enableWebhooks}
          onChange={handleToggleWebhooks}
          className="w-4 h-4 rounded border-slate-600 bg-slate-800/50 accent-[#0582BE]"
        />
        <span className="text-sm text-slate-300">Send form data to webhooks</span>
      </label>

      {enableWebhooks && (
        <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Webhook URLs
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/webhook"
                value={newWebhookUrl}
                onChange={(e) => {
                  setNewWebhookUrl(e.target.value)
                  setError('')
                }}
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition"
              />
              <button
                onClick={handleAddWebhook}
                className="px-3 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 text-white text-sm rounded transition font-medium"
              >
                Add
              </button>
            </div>
            {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
          </div>

          {webhooks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Added webhooks:</p>
              {webhooks.map((url, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-slate-900/50 rounded text-sm text-slate-300 font-mono"
                >
                  <span className="truncate">{url}</span>
                  <button
                    onClick={() => handleRemoveWebhook(index)}
                    className="ml-2 text-red-400 hover:text-red-300 transition"
                  >
                    <Icon type="copy" size={0.6} color="currentColor" className="rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {webhooks.length === 0 && (
            <p className="text-xs text-slate-500 italic">No webhooks added yet</p>
          )}
        </div>
      )}
    </div>
  )
}
