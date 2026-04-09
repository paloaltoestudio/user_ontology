import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form } from '../types/form'
import { Sidebar } from '../components/Sidebar'
import { FormList } from '../components/Forms/FormList'
import { FormEditor } from '../components/Forms/FormEditor'

type View = 'list' | 'create'

export function FormsPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('list')

  const handleSelectForm = (form: Form) => {
    navigate(`/forms/${form.id}`)
  }

  const handleCreateNew = () => {
    setView('create')
  }

  const handleSave = () => {
    setView('list')
  }

  const handleCancel = () => {
    setView('list')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <nav className="bg-slate-900 border-b border-slate-800 shadow-lg">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-white">
                {view === 'list' && 'Forms Management'}
                {view === 'create' && 'Create New Form'}
              </h1>
            </div>
          </nav>

          <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' && (
          <FormList onSelectForm={handleSelectForm} onCreateNew={handleCreateNew} />
        )}

        {view === 'create' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
            <FormEditor
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
