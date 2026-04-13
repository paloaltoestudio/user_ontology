import { useState, useEffect } from 'react'
import { Goal, GoalCreateRequest } from '../../types/goal'
import { goalsApi } from '../../api/goals'
import { GoalShareModal } from './GoalShareModal'

interface GoalEditorProps {
  goal?: Goal
  onSave: () => void
  onCancel: () => void
}

export function GoalEditor({ goal, onSave, onCancel }: GoalEditorProps) {
  const [formData, setFormData] = useState<GoalCreateRequest>({
    name: '',
    description: '',
    is_active: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        description: goal.description || '',
        is_active: goal.is_active,
      })
    }
  }, [goal])

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
      if (goal) {
        await goalsApi.updateGoal(goal.id, formData)
      } else {
        await goalsApi.createGoal(formData)
      }
      onSave()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save goal')
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
          Goal Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., Complete Profile Setup"
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
          placeholder="e.g., Users who have completed their profile information"
          rows={3}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-[#0582BE] focus:outline-none focus:ring-1 focus:ring-[#0582BE]"
        />
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active || false}
            onChange={handleChange}
            className="w-4 h-4 bg-slate-700 border border-slate-600 rounded cursor-pointer accent-[#0582BE]"
          />
          <span className="text-sm font-medium text-white">
            Active
          </span>
        </label>
        <p className="text-xs text-slate-400 mt-2 ml-7">
          Inactive goals won't be tracked for new users
        </p>
      </div>

      <div className="flex gap-3 justify-between pt-6 border-t border-slate-700">
        <div>
          {goal && (
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              Share Integration
            </button>
          )}
        </div>
        <div className="flex gap-3">
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
            {isLoading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </div>

      {goal && (
        <GoalShareModal
          goalId={goal.id}
          goalName={goal.name}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </form>
  )
}
