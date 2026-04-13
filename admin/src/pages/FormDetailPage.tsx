import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { formsApi } from '../api/forms'
import { Form, LeadFieldMapping } from '../types/form'
import { Sidebar } from '../components/Sidebar'
import { StepBuilder } from '../components/Forms/StepBuilder'
import { Icon } from '../components/Icon'
import { WebhookManager } from '../components/Forms/WebhookManager'
import { EmbedModal } from '../components/Forms/EmbedModal'
import { LeadFieldMappingUI } from '../components/Forms/LeadFieldMappingUI'
import { FormActionsManager } from '../components/Forms/FormActionsManager'
import { useToast } from '../hooks/useToast'

type TabType = 'general' | 'webhooks' | 'mapping' | 'steps' | 'actions'

export function FormDetailPage() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()
  const [currentForm, setCurrentForm] = useState<Form | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editWebhooks, setEditWebhooks] = useState<string[]>([])
  const [editDisplayAsSteps, setEditDisplayAsSteps] = useState(false)
  const [editMapping, setEditMapping] = useState<LeadFieldMapping>({})
  const [apiError, setApiError] = useState('')
  const [copiedId, setCopiedId] = useState(false)
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false)

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => formsApi.getForm(Number(formId)),
  })

  // Sync form data when query completes
  useEffect(() => {
    if (form) {
      setCurrentForm(form)
      setEditWebhooks(form.webhooks || [])
      setEditDisplayAsSteps(form.display_as_steps || false)
      setEditMapping(form.lead_field_mapping || {})
    }
  }, [form])

  const displayForm = currentForm || form

  const updateFormMutation = useMutation({
    mutationFn: (data: any) => formsApi.updateForm(Number(formId), data),
    onSuccess: (updatedForm) => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] })
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      setCurrentForm(updatedForm)
      setIsEditingInfo(false)
      setApiError('')
      showSuccess('Form saved successfully')
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to update form'
      setApiError(errorMsg)
      showError(errorMsg)
    },
  })

  const handleStartEdit = () => {
    const displayForm = currentForm || form
    setEditName(displayForm.name)
    setEditDescription(displayForm.description || '')
    setEditWebhooks(displayForm.webhooks || [])
    setEditDisplayAsSteps(displayForm.display_as_steps || false)
    setIsEditingInfo(true)
    setApiError('')
  }

  const handleSaveInfo = () => {
    if (!editName.trim()) {
      setApiError('Form name is required')
      return
    }
    updateFormMutation.mutate({
      name: editName,
      description: editDescription,
      display_as_steps: editDisplayAsSteps,
      webhooks: editWebhooks,
    })
  }

  const handleSaveWebhooks = () => {
    updateFormMutation.mutate({
      name: displayForm.name,
      description: displayForm.description,
      webhooks: editWebhooks,
    })
  }

  const handleCancelEdit = () => {
    setIsEditingInfo(false)
    setApiError('')
  }

  const handleCopyId = () => {
    const formToCopy = currentForm || form
    navigator.clipboard.writeText(String(formToCopy.id))
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  // Validation functions
  const getTotalFormFields = () => {
    let count = 0
    displayForm.steps.forEach((step) => {
      count += step.fields.length
    })
    return count
  }

  const getRequiredMappings = () => {
    return ['name', 'last_name', 'email']
  }

  const getCompletedMappings = () => {
    const requiredFields = getRequiredMappings()
    return requiredFields.filter((field) => {
      return editMapping[field as keyof LeadFieldMapping]
    })
  }

  const isMappingComplete = () => {
    return getCompletedMappings().length === getRequiredMappings().length
  }

  const canShareForm = () => {
    return getTotalFormFields() > 0 && isMappingComplete()
  }

  const getValidationMessage = () => {
    const fieldCount = getTotalFormFields()
    const mappingComplete = isMappingComplete()

    if (fieldCount === 0) {
      return 'Add at least one field to the form'
    }
    if (!mappingComplete) {
      const completed = getCompletedMappings().length
      const total = getRequiredMappings().length
      return `Complete lead mapping (${completed}/${total} required fields)`
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0582BE]"></div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <nav className="bg-slate-900 border-b border-slate-800">
              <div className="px-4 sm:px-6 lg:px-8 py-4">
                <button
                  onClick={() => navigate('/forms')}
                  className="text-[#0582BE] hover:text-blue-400"
                >
                  ← Back to Forms
                </button>
              </div>
            </nav>
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <p className="text-red-300">Failed to load form</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'general', label: 'General' },
    { id: 'actions', label: 'Actions' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'steps', label: 'Steps' },
    { id: 'mapping', label: 'Lead Mapping' },
  ]

  const handleSaveMapping = () => {
    updateFormMutation.mutate({
      name: displayForm.name,
      description: displayForm.description,
      lead_field_mapping: editMapping,
    })
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <nav className="bg-slate-900 border-b border-slate-800">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-start gap-4">
              <div className="flex-1">
                <button
                  onClick={() => navigate('/forms')}
                  className="text-[#0582BE] hover:text-blue-400 text-sm mb-3"
                >
                  ← Back to Forms
                </button>
                <div className="flex items-end gap-3">
                  <h1 className="text-2xl font-bold text-white">{displayForm.name}</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">ID: {displayForm.id}</span>
                    <button
                      onClick={handleCopyId}
                      title="Copy form ID"
                      className={`px-2 py-1.5 rounded transition ${
                        copiedId
                          ? 'bg-emerald-500/20'
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon
                        type="copy"
                        size={0.75}
                        color={copiedId ? '#10b981' : 'currentColor'}
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <button
                    onClick={() => {
                      if (canShareForm()) {
                        setIsEmbedModalOpen(true)
                      }
                    }}
                    disabled={!canShareForm()}
                    className={`px-3 py-2 text-sm font-medium transition flex items-center gap-2 ${
                      canShareForm()
                        ? 'text-[#0582BE] hover:text-blue-400 cursor-pointer'
                        : 'text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                    title={getValidationMessage() || 'Share form'}
                  >
                    <Icon type="copy" size={0.75} />
                    Share
                  </button>
                  {!canShareForm() && (
                    <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-10 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 whitespace-nowrap">
                      {getValidationMessage()}
                    </div>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                    displayForm.is_active
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {displayForm.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-t border-slate-800 px-4 sm:px-6 lg:px-8">
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setIsEditingInfo(false)
                      setApiError('')
                    }}
                    className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'border-[#0582BE] text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-4">Form Information</h2>
                    </div>
                    {!isEditingInfo && (
                      <button
                        onClick={handleStartEdit}
                        className="px-3 py-1.5 text-[#0582BE] hover:text-blue-400 text-sm transition font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditingInfo ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Form Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Form name"
                          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Form description (optional)"
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editDisplayAsSteps}
                            onChange={(e) => setEditDisplayAsSteps(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800/50 accent-[#0582BE]"
                          />
                          <span className="text-sm font-medium text-slate-300">Display as steps</span>
                        </label>
                        <p className="text-xs text-slate-500 mt-1">Show one step at a time in the public form</p>
                      </div>

                      {apiError && (
                        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                          <p className="text-sm text-red-300">{apiError}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={handleSaveInfo}
                          disabled={updateFormMutation.isPending}
                          className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white text-sm rounded transition font-medium"
                        >
                          {updateFormMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded transition font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</label>
                        <p className="text-white mt-1">{displayForm.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</label>
                        {displayForm.description ? (
                          <p className="text-slate-300 mt-1">{displayForm.description}</p>
                        ) : (
                          <p className="text-slate-500 italic mt-1">No description</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Form Display</label>
                        <p className="text-white mt-1">
                          {displayForm.display_as_steps ? '✓ Step-by-step mode' : 'All steps at once'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Webhooks Tab */}
              {activeTab === 'webhooks' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Webhook Configuration</h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Configure webhook endpoints to receive form submissions. Enable webhooks to automatically send form data to your endpoints.
                  </p>
                  <WebhookManager
                    form={{
                      ...(currentForm || form || { id: 0, name: '', is_active: false, steps: [] }),
                      webhooks: editWebhooks
                    }}
                    onWebhooksUpdate={setEditWebhooks}
                    isEditing={true}
                  />
                  {apiError && (
                    <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg mt-4">
                      <p className="text-sm text-red-300">{apiError}</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={handleSaveWebhooks}
                      disabled={updateFormMutation.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white text-sm rounded transition font-medium"
                    >
                      {updateFormMutation.isPending ? 'Saving...' : 'Save Webhooks'}
                    </button>
                  </div>
                </div>
              )}

              {/* Steps Tab */}
              {activeTab === 'steps' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Form Steps & Fields</h2>
                  <StepBuilder
                    form={displayForm}
                    onFormUpdate={(updatedForm) => setCurrentForm(updatedForm)}
                  />
                </div>
              )}

              {/* Lead Mapping Tab */}
              {activeTab === 'mapping' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Lead Field Mapping</h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Map your form fields to lead properties. This ensures that form submissions are properly captured with structured lead data.
                  </p>
                  <LeadFieldMappingUI
                    form={displayForm}
                    mapping={editMapping}
                    onMappingChange={setEditMapping}
                  />
                  {apiError && (
                    <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg mt-4">
                      <p className="text-sm text-red-300">{apiError}</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={handleSaveMapping}
                      disabled={updateFormMutation.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white text-sm rounded transition font-medium"
                    >
                      {updateFormMutation.isPending ? 'Saving...' : 'Save Mapping'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Form Actions</h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Attach actions to this form to automatically trigger external workflows when the form is submitted. Actions send webhook requests to your configured endpoints.
                  </p>
                  <FormActionsManager formId={displayForm.id} />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <EmbedModal
        formId={displayForm.id}
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
      />
    </div>
  )
}
