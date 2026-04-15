import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastContext } from '../Toast/ToastContainer'
import { ConfirmActionModal } from '../DeleteGoalConfirmModal'
import apiClient from '../../api/client'
import { ApiKeyForm } from './ApiKeyForm'

interface ApiKey {
  id: number
  name: string
  description?: string
  scopes: string[]
  is_active: boolean
  created_at: string
  last_used_at?: string
  updated_at: string
}

interface ApiKeyCreate {
  name: string
  description?: string
  scopes: string[]
}

interface ApiKeyUpdate {
  name?: string
  description?: string
  scopes?: string[]
}

interface NewApiKeyResponse extends ApiKey {
  key: string
}

export function ApiKeyManager() {
  const { addToast } = useToastContext()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newApiKey, setNewApiKey] = useState<NewApiKeyResponse | null>(null)
  const [selectedKeyForDetails, setSelectedKeyForDetails] = useState<ApiKey | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [pendingDeleteKeyName, setPendingDeleteKeyName] = useState<string>('')
  const [deleteAction, setDeleteAction] = useState<'deactivate' | 'permanent' | null>(null)

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/settings/api-keys')
      return response.data
    },
  })

  // Create API key
  const createMutation = useMutation({
    mutationFn: async (data: ApiKeyCreate) => {
      const response = await apiClient.post('/api/v1/settings/api-keys', data)
      return response.data
    },
    onSuccess: (newKey) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setShowForm(false)
      setNewApiKey(newKey)
    },
    onError: () => {
      addToast('Failed to create API key', 'error')
    },
  })

  // Update API key
  const updateMutation = useMutation({
    mutationFn: async (params: { id: number; data: ApiKeyUpdate }) => {
      const response = await apiClient.put(
        `/api/v1/settings/api-keys/${params.id}`,
        params.data
      )
      return response.data
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setEditingId(null)
      addToast(`API key "${updated.name}" updated successfully`, 'success')
    },
    onError: () => {
      addToast('Failed to update API key', 'error')
    },
  })

  // Delete API key (soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/v1/settings/api-keys/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      addToast('API key deactivated successfully', 'success')
    },
    onError: () => {
      addToast('Failed to deactivate API key', 'error')
    },
  })

  // Permanently delete API key (hard delete)
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/v1/settings/api-keys/${id}/permanent`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      addToast('API key permanently deleted', 'success')
    },
    onError: () => {
      addToast('Failed to permanently delete API key', 'error')
    },
  })

  const handleCreateSubmit = (data: ApiKeyCreate) => {
    createMutation.mutate(data)
  }

  const handleUpdateSubmit = (id: number, data: ApiKeyUpdate) => {
    updateMutation.mutate({ id, data })
  }

  const handleDelete = (id: number) => {
    setPendingDeleteId(id)
    setDeleteAction('deactivate')
  }

  const handlePermanentDelete = (id: number, keyName: string) => {
    setPendingDeleteId(id)
    setPendingDeleteKeyName(keyName)
    setDeleteAction('permanent')
  }

  const confirmDelete = () => {
    if (pendingDeleteId !== null) {
      if (deleteAction === 'deactivate') {
        deleteMutation.mutate(pendingDeleteId)
      } else if (deleteAction === 'permanent') {
        permanentDeleteMutation.mutate(pendingDeleteId)
      }
      cancelDelete()
    }
  }

  const cancelDelete = () => {
    setPendingDeleteId(null)
    setPendingDeleteKeyName('')
    setDeleteAction(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">API Keys</h2>
          <p className="text-slate-400 mt-2">
            Manage API keys for external integrations. Keys can be scoped to specific features.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-[#0582BE] to-blue-600 text-white rounded-lg hover:opacity-90 font-medium transition"
          >
            + New API Key
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteAction && (
        <ConfirmActionModal
          title={
            deleteAction === 'deactivate'
              ? 'Deactivate API Key'
              : 'Delete API Key Permanently'
          }
          message={
            deleteAction === 'deactivate'
              ? 'Are you sure you want to deactivate this API key? It cannot be used afterward.'
              : `Warning: You are about to permanently delete the API key "${pendingDeleteKeyName}". This action cannot be undone and the key will be completely removed from the database.`
          }
          confirmText={deleteAction === 'deactivate' ? 'Deactivate' : 'Delete'}
          cancelText="Cancel"
          variant={deleteAction === 'permanent' ? 'danger' : 'warning'}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isLoading={deleteMutation.isPending || permanentDeleteMutation.isPending}
        />
      )}

      {/* New API Key Modal */}
      {newApiKey && (
        <ApiKeyDisplayModal
          apiKey={newApiKey}
          onClose={() => setNewApiKey(null)}
        />
      )}

      {/* Details Modal */}
      {selectedKeyForDetails && (
        <ApiKeyDetailsModal
          apiKey={selectedKeyForDetails}
          onClose={() => setSelectedKeyForDetails(null)}
        />
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Create New API Key</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>
          <ApiKeyForm
            onSubmit={handleCreateSubmit}
            isLoading={createMutation.isPending}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* API Keys List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0582BE]"></div>
          <p className="text-slate-400 mt-4">Loading API keys...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="bg-slate-800 border border-dashed border-slate-700 rounded-lg p-12 text-center">
          <p className="text-slate-400 text-lg">No API keys yet</p>
          <p className="text-slate-500 text-sm mt-2">
            Create your first API key to get started with integrations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key: ApiKey) => (
            <ApiKeyListItem
              key={key.id}
              apiKey={key}
              isEditing={editingId === key.id}
              onEdit={setEditingId}
              onUpdate={handleUpdateSubmit}
              onDelete={handleDelete}
              onPermanentDelete={handlePermanentDelete}
              onViewDetails={setSelectedKeyForDetails}
              isDeleting={deleteMutation.isPending}
              isPermanentDeleting={permanentDeleteMutation.isPending}
              isUpdating={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ApiKeyDetailsModal({
  apiKey,
  onClose,
}: {
  apiKey: ApiKey
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-lg w-full mx-4 border border-slate-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">API Key Details</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* ID */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              ID
            </label>
            <p className="text-slate-200 font-mono mt-2 bg-slate-900 px-3 py-2 rounded">
              {apiKey.id}
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Name
            </label>
            <p className="text-white text-lg font-medium mt-2">{apiKey.name}</p>
          </div>

          {/* Description */}
          {apiKey.description && (
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Description
              </label>
              <p className="text-slate-300 mt-2">{apiKey.description}</p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Status
            </label>
            <div className="mt-2">
              <span
                className={`px-3 py-1 rounded text-sm font-medium inline-block ${
                  apiKey.is_active
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {apiKey.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Scopes */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Scopes
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {apiKey.scopes.map((scope) => (
                <span
                  key={scope}
                  className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full"
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>

          {/* Created At */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Created
            </label>
            <p className="text-slate-300 mt-2">
              {new Date(apiKey.created_at).toLocaleString()}
            </p>
          </div>

          {/* Last Used */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Last Used
            </label>
            <p className="text-slate-300 mt-2">
              {apiKey.last_used_at
                ? new Date(apiKey.last_used_at).toLocaleString()
                : 'Never'}
            </p>
          </div>

          {/* Updated At */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Last Updated
            </label>
            <p className="text-slate-300 mt-2">
              {new Date(apiKey.updated_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-[#0582BE] to-blue-600 text-white rounded-lg hover:opacity-90 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function ApiKeyDisplayModal({
  apiKey,
  onClose,
}: {
  apiKey: NewApiKeyResponse
  onClose: () => void
}) {
  const { addToast } = useToastContext()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key)
      setCopied(true)
      addToast('API key copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      addToast('Failed to copy API key', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-lg w-full mx-4 border border-slate-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">API Key Created</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-200 text-sm font-medium">
              ⚠️ Save this API key somewhere secure. You won't be able to see it again!
            </p>
          </div>

          {/* API Key Info */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Name
              </label>
              <p className="text-white text-lg font-medium mt-1">{apiKey.name}</p>
            </div>

            {apiKey.description && (
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Description
                </label>
                <p className="text-slate-300 mt-1">{apiKey.description}</p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Scopes
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {apiKey.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* API Key Display */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              API Key
            </label>
            <div className="mt-2 flex gap-2">
              <code className="flex-1 bg-slate-900 border border-slate-600 rounded px-4 py-3 text-slate-200 font-mono text-sm overflow-x-auto break-all">
                {apiKey.key}
              </code>
              <button
                onClick={handleCopy}
                className={`px-4 py-3 rounded font-medium transition whitespace-nowrap ${
                  copied
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Usage Info */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-300 text-sm">
              <strong>How to use:</strong> Include this key in the <code className="bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header of your API requests:
            </p>
            <code className="block bg-slate-900 text-slate-200 text-xs p-3 rounded mt-2 overflow-x-auto font-mono">
              Authorization: Bearer {apiKey.key}
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-[#0582BE] to-blue-600 text-white rounded-lg hover:opacity-90 font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function ApiKeyListItem({
  apiKey,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onPermanentDelete,
  onViewDetails,
  isDeleting,
  isPermanentDeleting,
  isUpdating,
}: {
  apiKey: ApiKey
  isEditing: boolean
  onEdit: (id: number | null) => void
  onUpdate: (id: number, data: ApiKeyUpdate) => void
  onDelete: (id: number) => void
  onPermanentDelete: (id: number, name: string) => void
  onViewDetails: (key: ApiKey) => void
  isDeleting: boolean
  isPermanentDeleting: boolean
  isUpdating: boolean
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {isEditing ? (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Edit API Key</h3>
          <ApiKeyForm
            initialValues={{
              name: apiKey.name,
              description: apiKey.description || '',
              scopes: apiKey.scopes,
            }}
            onSubmit={(data) => {
              onUpdate(apiKey.id, data)
              onEdit(null)
            }}
            isLoading={isUpdating}
            onCancel={() => onEdit(null)}
          />
        </div>
      ) : (
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">{apiKey.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    apiKey.is_active
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {apiKey.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {apiKey.description && (
                <p className="text-slate-400 text-sm mt-1">{apiKey.description}</p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onViewDetails(apiKey)}
                className="px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition"
              >
                Details
              </button>
              {apiKey.is_active && (
                <>
                  <button
                    onClick={() => onEdit(apiKey.id)}
                    className="px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(apiKey.id)}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm text-red-300 hover:text-red-200 bg-red-500/20 hover:bg-red-500/30 rounded transition disabled:opacity-50"
                  >
                    {isDeleting ? 'Deactivating...' : 'Deactivate'}
                  </button>
                </>
              )}
              <button
                onClick={() => onPermanentDelete(apiKey.id, apiKey.name)}
                disabled={isPermanentDeleting}
                className="px-3 py-1.5 text-sm text-orange-300 hover:text-orange-200 bg-orange-500/20 hover:bg-orange-500/30 rounded transition disabled:opacity-50 font-medium"
              >
                {isPermanentDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          {/* Scopes */}
          <div className="mt-4 flex flex-wrap gap-2">
            {apiKey.scopes.map((scope) => (
              <span
                key={scope}
                className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full"
              >
                {scope}
              </span>
            ))}
          </div>

          {/* Metadata */}
          <div className="mt-4 text-xs text-slate-500 space-y-1">
            <p>Created: {new Date(apiKey.created_at).toLocaleString()}</p>
            {apiKey.last_used_at && (
              <p>Last used: {new Date(apiKey.last_used_at).toLocaleString()}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
