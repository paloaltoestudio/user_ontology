import { useState } from 'react'
import { Goal } from '../types/goal'
import { Sidebar } from '../components/Sidebar'
import { GoalList } from '../components/Goals/GoalList'
import { GoalEditor } from '../components/Goals/GoalEditor'
import { useToastContext } from '../components/Toast/ToastContainer'

type View = 'list' | 'create' | 'edit'

export function GoalsPage() {
  const { addToast } = useToastContext()
  const [view, setView] = useState<View>('list')
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  const handleSelectGoal = (goal: Goal) => {
    setSelectedGoal(goal)
    setView('edit')
  }

  const handleCreateNew = () => {
    setSelectedGoal(null)
    setView('create')
  }

  const handleSave = () => {
    addToast(
      selectedGoal ? 'Goal updated successfully' : 'Goal created successfully',
      'success'
    )
    setView('list')
  }

  const handleCancel = () => {
    setView('list')
  }

  const handleDelete = (goalId: number) => {
    // This callback is reused for both deactivate and activate actions
    // The actual message will be shown by the component
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <nav className="bg-slate-900 border-b border-slate-800 shadow-lg">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-white">
                {view === 'list' && 'Goals Management'}
                {view === 'create' && 'Create New Goal'}
                {view === 'edit' && 'Edit Goal'}
              </h1>
            </div>
          </nav>

          <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
            {view === 'list' && (
              <GoalList
                onSelectGoal={handleSelectGoal}
                onCreateNew={handleCreateNew}
                onDelete={handleDelete}
              />
            )}

            {(view === 'create' || view === 'edit') && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
                <GoalEditor
                  goal={selectedGoal || undefined}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
