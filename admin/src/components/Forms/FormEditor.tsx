import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formsApi } from '../../api/forms'
import { Form, FormCreateRequest, FieldType } from '../../types/form'

interface FormEditorProps {
  onSave: () => void
  onCancel: () => void
}

export function FormEditor({ onSave, onCancel }: FormEditorProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<FormCreateRequest>({
    name: '',
    description: '',
    is_active: false,
    steps: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string>('')

  const getErrorMessage = (error: any): string => {
    // Handle validation errors array
    if (Array.isArray(error.response?.data?.detail)) {
      return error.response.data.detail
        .map((e: any) => `${e.loc?.[1] || 'Field'}: ${e.msg}`)
        .join(', ')
    }
    // Handle single error message
    if (typeof error.response?.data?.detail === 'string') {
      return error.response.data.detail
    }
    return error.message || 'An error occurred'
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => formsApi.createForm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      onSave()
    },
    onError: (error: any) => {
      setApiError(getErrorMessage(error))
    },
  })


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Form name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      is_active: formData.is_active,
    }

    createMutation.mutate(payload)
  }

  const isLoading = createMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && (
        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-red-300">{apiError}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Form Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] focus:border-transparent outline-none transition disabled:opacity-50"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-red-400 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] focus:border-transparent outline-none transition disabled:opacity-50"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.checked })
            }
            disabled={isLoading}
            className="w-4 h-4 rounded border-slate-600 bg-slate-700/50 accent-[#0582BE]"
          />
          <span className="text-sm font-medium text-slate-300">
            Make form active
          </span>
        </label>
      </div>

      <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 Create basic form details here. You can add steps and fields after
          creating the form.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white rounded-lg transition font-medium disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Form'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-lg transition font-medium disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
