import { useState } from 'react'

const AVAILABLE_SCOPES = [
  { value: 'goals', label: 'Goals', description: 'Can submit goal completion events' },
  {
    value: 'webhooks',
    label: 'Webhooks',
    description: 'Can trigger webhook endpoints',
  },
  {
    value: 'integrations',
    label: 'Integrations',
    description: 'Can access integration APIs',
  },
]

interface ApiKeyFormProps {
  initialValues?: {
    name: string
    description?: string
    scopes: string[]
  }
  onSubmit: (data: {
    name: string
    description?: string
    scopes: string[]
  }) => void
  isLoading?: boolean
  onCancel?: () => void
}

export function ApiKeyForm({
  initialValues,
  onSubmit,
  isLoading = false,
  onCancel,
}: ApiKeyFormProps) {
  const [formData, setFormData] = useState({
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    scopes: initialValues?.scopes || [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (formData.scopes.length === 0) {
      newErrors.scopes = 'At least one scope must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      scopes: formData.scopes,
    })
  }

  const toggleScope = (scope: string) => {
    setFormData((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          API Key Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Webhook Integration, Goal Tracker"
          className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition ${
            errors.name
              ? 'border-red-500 focus:ring-2 focus:ring-red-500'
              : 'border-slate-600 focus:border-[#0582BE] focus:ring-2 focus:ring-[#0582BE]/20'
          }`}
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Optional: Describe what this API key is used for"
          rows={3}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#0582BE] focus:ring-2 focus:ring-[#0582BE]/20 transition resize-none"
        />
      </div>

      {/* Scopes */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Scopes * (Permissions)
        </label>
        <div className="space-y-3">
          {AVAILABLE_SCOPES.map((scope) => (
            <label
              key={scope.value}
              className="flex items-start gap-3 p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-slate-500 cursor-pointer transition"
            >
              <input
                type="checkbox"
                checked={formData.scopes.includes(scope.value)}
                onChange={() => toggleScope(scope.value)}
                className="mt-1 w-4 h-4 rounded border-slate-500 bg-slate-600 text-[#0582BE] focus:ring-2 focus:ring-[#0582BE]/50 cursor-pointer"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-200">{scope.label}</p>
                <p className="text-xs text-slate-400">{scope.description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.scopes && <p className="text-red-400 text-sm mt-2">{errors.scopes}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#0582BE] to-blue-600 text-white rounded-lg hover:opacity-90 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save API Key'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 font-medium transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
