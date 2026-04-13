import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { goalsApi } from '../../api/goals'
import { Goal } from '../../types/goal'
import { EmptyState } from '../EmptyState'
import { Icon } from '../Icon'
import { useToastContext } from '../Toast/ToastContainer'
import { ToggleSwitch } from '../ToggleSwitch'

interface GoalListProps {
  onSelectGoal: (goal: Goal) => void
  onCreateNew: () => void
  onDelete: (goalId: number) => void
}

export function GoalList({ onSelectGoal, onCreateNew, onDelete }: GoalListProps) {
  const { addToast } = useToastContext()
  const { data: goals = [], isLoading, error, refetch } = useQuery({
    queryKey: ['goals'],
    queryFn: goalsApi.listGoals,
  })

  const [toggleConfirm, setToggleConfirm] = useState<{ goalId: number; action: 'activate' | 'deactivate' } | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const handleToggleStatus = async (goalId: number, newStatus: boolean) => {
    try {
      setToggleError(null)
      await goalsApi.toggleGoalStatus(goalId, newStatus)
      setToggleConfirm(null)
      refetch()
      const message = newStatus ? 'Goal activated successfully' : 'Goal deactivated successfully'
      addToast(message, 'success')
      onDelete(goalId)
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update goal'
      setToggleError(errorMsg)
      console.error('Failed to update goal:', err)
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
        <p className="text-red-300">Failed to load goals</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Goals</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 text-white rounded-lg transition font-medium"
        >
          + New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Icon type="target" size={2.5} color="currentColor" className="text-slate-500" />}
          title="No goals yet"
          description="Create your first goal to track user progression"
          action={{
            label: 'Create Your First Goal',
            onClick: onCreateNew,
          }}
        />
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="p-6 bg-slate-800 border border-slate-700 rounded-xl hover:border-[#0582BE] hover:shadow-lg hover:shadow-blue-500/10 transition duration-200"
            >
              <div className="flex justify-between items-start">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectGoal(goal)}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {goal.name}
                    </h3>
                    {!goal.is_active && (
                      <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {goal.description && (
                    <p className="text-slate-400 text-sm mt-1">
                      {goal.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Created {new Date(goal.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-4 ml-4 items-center">
                  <button
                    onClick={() => onSelectGoal(goal)}
                    className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                  >
                    Edit
                  </button>
                  <ToggleSwitch
                    checked={goal.is_active}
                    onChange={() => setToggleConfirm({
                      goalId: goal.id,
                      action: goal.is_active ? 'deactivate' : 'activate'
                    })}
                    ariaLabel={`${goal.name} status`}
                  />
                </div>
              </div>

              {toggleConfirm?.goalId === goal.id && (
                <div className="mt-4 space-y-3">
                  {toggleError && (
                    <div className="p-3 bg-red-900/40 border border-red-700 rounded">
                      <p className="text-sm text-red-300">{toggleError}</p>
                    </div>
                  )}
                  <div className={`p-3 rounded flex justify-between items-center border ${
                    toggleConfirm.action === 'deactivate'
                      ? 'bg-red-900/20 border-red-700/50'
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <p className={`text-sm ${
                      toggleConfirm.action === 'deactivate'
                        ? 'text-red-300'
                        : 'text-green-300'
                    }`}>
                      Are you sure you want to {toggleConfirm.action} this goal?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(goal.id, toggleConfirm.action === 'activate')}
                        className={`px-3 py-1 text-sm text-white rounded transition ${
                          toggleConfirm.action === 'deactivate'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {toggleConfirm.action === 'deactivate' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          setToggleConfirm(null)
                          setToggleError(null)
                        }}
                        className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                      >
                        Cancel
                      </button>
                    </div>
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
