import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { actionsApi } from '../../api/actions'
import { Action } from '../../types/action'
import { EmptyState } from '../EmptyState'
import { Icon } from '../Icon'
import { ConfirmActionModal } from '../DeleteGoalConfirmModal'
import { useToastContext } from '../Toast/ToastContainer'

interface ActionListProps {
  onSelectAction: (action: Action) => void
  onCreateNew: () => void
  onDelete: (actionId: number) => void
}

export function ActionList({ onSelectAction, onCreateNew, onDelete }: ActionListProps) {
  const { addToast } = useToastContext()
  const { data: actions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['actions'],
    queryFn: actionsApi.listActions,
  })

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (actionId: number) => {
    try {
      setIsDeleting(true)
      await actionsApi.deleteAction(actionId)
      setDeleteConfirm(null)
      refetch()
      onDelete(actionId)
      addToast('Action deleted successfully', 'success')
    } catch (err) {
      console.error('Failed to delete action:', err)
      addToast('Failed to delete action', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

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
        <p className="text-red-300">Failed to load actions</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Actions</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 text-white rounded-lg transition font-medium"
        >
          + New Action
        </button>
      </div>

      {actions.length === 0 ? (
        <EmptyState
          icon={<Icon type="zap" size={2.5} color="currentColor" className="text-slate-500" />}
          title="No actions yet"
          description="Create your first action to connect external workflows"
          action={{
            label: 'Create Your First Action',
            onClick: onCreateNew,
          }}
        />
      ) : (
        <div className="grid gap-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className="p-6 bg-slate-800 border border-slate-700 rounded-xl hover:border-[#0582BE] hover:shadow-lg hover:shadow-blue-500/10 transition duration-200"
            >
              <div className="flex justify-between items-start">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectAction(action)}
                >
                  <h3 className="text-lg font-semibold text-white">
                    {action.name}
                  </h3>
                  {action.description && (
                    <p className="text-slate-400 text-sm mt-1">
                      {action.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2 break-all">
                    {action.webhook_url}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Created {new Date(action.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onSelectAction(action)}
                    className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(action.id)}
                    className="px-3 py-1 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmActionModal
          title="Delete action?"
          message={`Are you sure you want to delete this action? This cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          isLoading={isDeleting}
          variant="danger"
        />
      )}
    </div>
  )
}
