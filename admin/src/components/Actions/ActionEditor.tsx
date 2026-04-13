import { useState, useEffect } from 'react'
import { Action, ActionCreateRequest } from '../../types/action'
import { actionsApi } from '../../api/actions'

interface ActionEditorProps {
  action?: Action
  onSave: () => void
  onCancel: () => void
}

export function ActionEditor({ action, onSave, onCancel }: ActionEditorProps) {
  const [formData, setFormData] = useState<ActionCreateRequest>({
    name: '',
    description: '',
    webhook_url: '',
    auto_send: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (action) {
      setFormData({
        name: action.name,
        description: action.description || '',
        webhook_url: action.webhook_url,
        auto_send: action.auto_send || false,
      })
    }
  }, [action])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (action) {
        await actionsApi.updateAction(action.id, formData)
      } else {
        await actionsApi.createAction(formData)
      }
      onSave()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save action')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Action Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., Welcome Flow"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-[#0582BE] focus:outline-none focus:ring-1 focus:ring-[#0582BE]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g., Send onboarding emails"
          rows={3}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-[#0582BE] focus:outline-none focus:ring-1 focus:ring-[#0582BE]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Webhook URL *
        </label>
        <input
          type="url"
          name="webhook_url"
          value={formData.webhook_url}
          onChange={handleChange}
          required
          placeholder="https://your-n8n.com/webhook/welcome"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-[#0582BE] focus:outline-none focus:ring-1 focus:ring-[#0582BE]"
        />
        <p className="text-xs text-slate-400 mt-1">
          The URL where this action will send webhook requests
        </p>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="auto_send"
            checked={formData.auto_send || false}
            onChange={handleChange}
            className="w-4 h-4 bg-slate-700 border border-slate-600 rounded cursor-pointer accent-[#0582BE]"
          />
          <span className="text-sm font-medium text-white">
            Auto-send action when assigned to user
          </span>
        </label>
        <p className="text-xs text-slate-400 mt-2 ml-7">
          If enabled, this action will execute immediately when assigned to a user
        </p>
      </div>

      <div className="flex gap-3 justify-end pt-6 border-t border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 text-white rounded-lg transition disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : action ? 'Update Action' : 'Create Action'}
        </button>
      </div>
    </form>
  )
}
