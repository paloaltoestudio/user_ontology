import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formsApi } from '../../api/forms'
import { actionsApi } from '../../api/actions'
import { Action } from '../../types/action'
import { Icon } from '../Icon'

interface FormActionsManagerProps {
  formId: number
  onActionsUpdate?: () => void
}

export function FormActionsManager({ formId, onActionsUpdate }: FormActionsManagerProps) {
  const queryClient = useQueryClient()
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all available actions
  const { data: allActions = [], isLoading: isLoadingActions } = useQuery({
    queryKey: ['actions'],
    queryFn: actionsApi.listActions,
  })

  // Fetch form's attached actions
  const { data: formActions = [], refetch: refetchFormActions } = useQuery({
    queryKey: ['formActions', formId],
    queryFn: () => formsApi.getFormActions(formId),
  })

  const handleAddAction = async () => {
    if (!selectedActionId) return

    setError(null)
    setIsLoading(true)

    try {
      await formsApi.addActionToForm(formId, selectedActionId)
      setSelectedActionId(null)
      await refetchFormActions()
      onActionsUpdate?.()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to add action to form'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAction = async (actionId: number) => {
    setError(null)
    setIsLoading(true)

    try {
      await formsApi.removeActionFromForm(formId, actionId)
      await refetchFormActions()
      onActionsUpdate?.()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to remove action'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Get actions that are not yet attached
  const availableActions = allActions.filter(
    (action) => !formActions.some((fa) => fa.id === action.id)
  )

  if (isLoadingActions) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0582BE]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Add Action Section */}
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <h3 className="text-sm font-semibold text-white mb-3">Add Actions to Form</h3>
        <div className="flex gap-3">
          <select
            value={selectedActionId || ''}
            onChange={(e) => setSelectedActionId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-[#0582BE] focus:outline-none focus:ring-1 focus:ring-[#0582BE]"
          >
            <option value="">Select an action...</option>
            {availableActions.map((action) => (
              <option key={action.id} value={action.id}>
                {action.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddAction}
            disabled={!selectedActionId || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white text-sm rounded transition font-medium whitespace-nowrap"
          >
            {isLoading ? 'Adding...' : 'Add Action'}
          </button>
        </div>
        {availableActions.length === 0 && (
          <p className="text-xs text-slate-400 mt-2">
            {allActions.length === 0
              ? 'No actions available. Create an action first.'
              : 'All available actions are already attached.'}
          </p>
        )}
      </div>

      {/* Attached Actions Section */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Attached Actions ({formActions.length})
        </h3>

        {formActions.length === 0 ? (
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-700 border-dashed text-center">
            <div className="flex justify-center mb-2">
              <Icon type="zap" size={1.5} color="currentColor" className="text-slate-600" />
            </div>
            <p className="text-sm text-slate-400">No actions attached to this form</p>
          </div>
        ) : (
          <div className="space-y-2">
            {formActions.map((action) => (
              <div
                key={action.id}
                className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg flex justify-between items-start"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white">{action.name}</h4>
                  {action.description && (
                    <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1 break-all">{action.webhook_url}</p>
                </div>
                <button
                  onClick={() => handleRemoveAction(action.id)}
                  disabled={isLoading}
                  className="ml-3 px-3 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 disabled:opacity-50 text-red-300 rounded transition whitespace-nowrap"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
