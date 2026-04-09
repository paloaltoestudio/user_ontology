import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Form, FormStep } from '../../types/form'
import { formsApi } from '../../api/forms'
import { FieldBuilder } from './FieldBuilder'
import { EmptyState } from '../EmptyState'
import { Icon } from '../Icon'

interface StepBuilderProps {
  form: Form
  onFormUpdate: (form: Form) => void
}

export function StepBuilder({ form, onFormUpdate }: StepBuilderProps) {
  const queryClient = useQueryClient()
  const [expandedStepId, setExpandedStepId] = useState<number | null>(null)
  const [showNewStepForm, setShowNewStepForm] = useState(false)
  const [newStepData, setNewStepData] = useState({
    step_number: form.steps.length + 1,
    title: '',
    description: '',
  })
  const [apiError, setApiError] = useState('')

  const addStepMutation = useMutation({
    mutationFn: (data: any) => formsApi.addStep(form.id, data),
    onSuccess: (updatedForm) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      onFormUpdate(updatedForm)
      setShowNewStepForm(false)
      setNewStepData({
        step_number: form.steps.length + 2,
        title: '',
        description: '',
      })
      setApiError('')
    },
    onError: (error: any) => {
      setApiError(
        error.response?.data?.detail || 'Failed to add step'
      )
    },
  })

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: number) => formsApi.deleteStep(form.id, stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      const updatedForm = {
        ...form,
        steps: form.steps.filter((s) => s.id !== expandedStepId),
      }
      onFormUpdate(updatedForm)
      setExpandedStepId(null)
    },
  })

  const handleAddStep = () => {
    if (!newStepData.title.trim()) {
      setApiError('Step title is required')
      return
    }
    addStepMutation.mutate(newStepData)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Steps</h3>
        {!showNewStepForm && (
          <button
            onClick={() => setShowNewStepForm(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 text-white text-sm rounded-lg transition font-medium"
          >
            + Add Step
          </button>
        )}
      </div>

      {apiError && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-sm text-red-300">{apiError}</p>
        </div>
      )}

      {showNewStepForm && (
        <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Step title (e.g., Personal Info)"
            value={newStepData.title}
            onChange={(e) =>
              setNewStepData({ ...newStepData, title: e.target.value })
            }
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition"
          />
          <textarea
            placeholder="Step description (optional)"
            value={newStepData.description}
            onChange={(e) =>
              setNewStepData({
                ...newStepData,
                description: e.target.value,
              })
            }
            rows={2}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddStep}
              disabled={addStepMutation.isPending}
              className="px-3 py-1.5 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white text-sm rounded transition font-medium"
            >
              {addStepMutation.isPending ? 'Creating...' : 'Create Step'}
            </button>
            <button
              onClick={() => setShowNewStepForm(false)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {form.steps.length === 0 ? (
        <EmptyState
          icon={<Icon type="checkbox" size={2.5} color="currentColor" className="text-slate-500" />}
          title="No steps yet"
          description="Add a step to structure your form"
          action={{
            label: 'Add Your First Step',
            onClick: () => setShowNewStepForm(true),
          }}
        />
      ) : (
        <div className="space-y-2">
          {form.steps
            .sort((a, b) => a.step_number - b.step_number)
            .map((step) => (
              <div key={step.id} className="border border-slate-700 rounded-lg bg-slate-800/50 overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedStepId(
                      expandedStepId === step.id ? null : step.id
                    )
                  }
                  className="w-full p-4 hover:bg-slate-700/30 transition flex justify-between items-center"
                >
                  <div className="text-left">
                    <p className="font-semibold text-white">
                      Step {step.step_number}: {step.title}
                    </p>
                    {step.description && (
                      <p className="text-sm text-slate-400">
                        {step.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {step.fields.length} field{step.fields.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-slate-400">
                    {expandedStepId === step.id ? '▼' : '▶'}
                  </span>
                </button>

                {expandedStepId === step.id && (
                  <div className="border-t border-slate-700 p-4 bg-slate-900/50 space-y-4">
                    <FieldBuilder form={form} step={step} onFormUpdate={onFormUpdate} />

                    <div className="pt-4 border-t border-slate-700">
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              'Delete this step and all its fields?'
                            )
                          ) {
                            deleteStepMutation.mutate(step.id)
                          }
                        }}
                        disabled={deleteStepMutation.isPending}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-300 text-sm rounded transition font-medium border border-red-500/30"
                      >
                        Delete Step
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
