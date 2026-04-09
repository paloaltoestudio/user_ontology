import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formsApi } from '../../api/forms'
import { Form } from '../../types/form'
import { EmptyState } from '../EmptyState'
import { Icon } from '../Icon'

interface FormListProps {
  onSelectForm: (form: Form) => void
  onCreateNew: () => void
}

export function FormList({ onSelectForm, onCreateNew }: FormListProps) {
  const { data: forms = [], isLoading, error } = useQuery({
    queryKey: ['forms'],
    queryFn: formsApi.listForms,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0582BE]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
        <p className="text-red-300">Failed to load forms</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Forms</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 text-white rounded-lg transition font-medium"
        >
          + New Form
        </button>
      </div>

      {forms.length === 0 ? (
        <EmptyState
          icon={<Icon type="file" size={2.5} color="currentColor" className="text-slate-500" />}
          title="No forms yet"
          description="Create your first onboarding form to get started"
          action={{
            label: 'Create Your First Form',
            onClick: onCreateNew,
          }}
        />
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              onClick={() => onSelectForm(form)}
              className="p-6 bg-slate-800 border border-slate-700 rounded-xl hover:border-[#0582BE] hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition duration-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {form.name}
                  </h3>
                  {form.description && (
                    <p className="text-slate-400 text-sm mt-1">
                      {form.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {form.steps.length} steps • Created{' '}
                    {new Date(form.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      form.is_active
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {form.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
