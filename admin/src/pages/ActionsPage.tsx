import { useState } from 'react'
import { Action } from '../types/action'
import { Sidebar } from '../components/Sidebar'
import { ActionList } from '../components/Actions/ActionList'
import { ActionEditor } from '../components/Actions/ActionEditor'
import { useToastContext } from '../components/Toast/ToastContainer'

type View = 'list' | 'create' | 'edit'

export function ActionsPage() {
  const { addToast } = useToastContext()
  const [view, setView] = useState<View>('list')
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)

  const handleSelectAction = (action: Action) => {
    setSelectedAction(action)
    setView('edit')
  }

  const handleCreateNew = () => {
    setSelectedAction(null)
    setView('create')
  }

  const handleSave = () => {
    addToast(
      selectedAction ? 'Action updated successfully' : 'Action created successfully',
      'success'
    )
    setView('list')
  }

  const handleCancel = () => {
    setView('list')
  }

  const handleDelete = (actionId: number) => {
    addToast('Action deleted successfully', 'success')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <nav className="bg-slate-900 border-b border-slate-800 shadow-lg">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-white">
                {view === 'list' && 'Actions Management'}
                {view === 'create' && 'Create New Action'}
                {view === 'edit' && 'Edit Action'}
              </h1>
            </div>
          </nav>

          <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
            {view === 'list' && (
              <ActionList
                onSelectAction={handleSelectAction}
                onCreateNew={handleCreateNew}
                onDelete={handleDelete}
              />
            )}

            {(view === 'create' || view === 'edit') && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
                <ActionEditor
                  action={selectedAction || undefined}
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
