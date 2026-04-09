import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Form, FormStep, FieldType } from '../../types/form'
import { formsApi } from '../../api/forms'
import { EmptyState } from '../EmptyState'
import { Icon } from '../Icon'
import { FieldPreview } from './FieldPreview'
import { SortableFieldItem } from './SortableFieldItem'

interface FieldBuilderProps {
  form: Form
  step: FormStep
  onFormUpdate: (form: Form) => void
}

const FIELD_TYPES: FieldType[] = [
  'text',
  'email',
  'password',
  'number',
  'textarea',
  'select',
  'checkbox',
  'date',
]

export function FieldBuilder({
  form,
  step,
  onFormUpdate,
}: FieldBuilderProps) {
  const queryClient = useQueryClient()
  const [showNewFieldForm, setShowNewFieldForm] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null)
  const [newFieldData, setNewFieldData] = useState({
    field_name: '',
    field_type: 'text' as FieldType,
    required: false,
    help_text: '',
    field_options: [] as Array<{ label: string; value: string }>,
    display_order: step.fields.length + 1,
  })
  const [optionInput, setOptionInput] = useState('')
  const [apiError, setApiError] = useState('')

  const addFieldMutation = useMutation({
    mutationFn: (data: any) =>
      formsApi.addField(form.id, step.id, data),
    onSuccess: (updatedForm) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      onFormUpdate(updatedForm)
      setShowNewFieldForm(false)
      setNewFieldData({
        field_name: '',
        field_type: 'text',
        required: false,
        help_text: '',
        field_options: [],
        display_order: step.fields.length + 2,
      })
      setApiError('')
    },
    onError: (error: any) => {
      setApiError(
        error.response?.data?.detail || 'Failed to add field'
      )
    },
  })

  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId: number) =>
      formsApi.deleteField(form.id, step.id, fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      const updatedForm = {
        ...form,
        steps: form.steps.map((s) =>
          s.id === step.id
            ? {
                ...s,
                fields: s.fields.filter(
                  (f) => !selectedFieldId.includes(f.id)
                ),
              }
            : s
        ),
      }
      onFormUpdate(updatedForm)
      setSelectedFieldId([])
    },
  })

  const updateFieldMutation = useMutation({
    mutationFn: (data: any) =>
      formsApi.updateField(form.id, step.id, editingFieldId!, data),
    onSuccess: (updatedForm) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      onFormUpdate(updatedForm)
      setEditingFieldId(null)
      setNewFieldData({
        field_name: '',
        field_type: 'text',
        required: false,
        help_text: '',
        field_options: [],
        display_order: step.fields.length + 1,
      })
      setApiError('')
    },
    onError: (error: any) => {
      setApiError(
        error.response?.data?.detail || 'Failed to update field'
      )
    },
  })

  const [selectedFieldId, setSelectedFieldId] = useState<number[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const updateFieldOrderMutation = useMutation({
    mutationFn: async (updates: Array<{ fieldId: number; displayOrder: number }>) => {
      // Update each field's display_order via the existing updateField endpoint
      const updatePromises = updates.map((update) =>
        formsApi.updateField(form.id, step.id, update.fieldId, {
          display_order: update.displayOrder,
        })
      )
      // Return the last updated form
      const results = await Promise.all(updatePromises)
      return results[results.length - 1]
    },
    onSuccess: (updatedForm) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      onFormUpdate(updatedForm)
    },
    onError: (error: any) => {
      setApiError(
        error.response?.data?.detail || 'Failed to reorder fields'
      )
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = step.fields.findIndex((f) => f.id === active.id)
    const newIndex = step.fields.findIndex((f) => f.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newFields = arrayMove(step.fields, oldIndex, newIndex)

      // Optimistic update
      const updatedForm = {
        ...form,
        steps: form.steps.map((s) =>
          s.id === step.id ? { ...s, fields: newFields } : s
        ),
      }
      onFormUpdate(updatedForm)

      // Persist to API - update display_order for affected fields
      const updates = newFields.map((field, index) => ({
        fieldId: field.id,
        displayOrder: index + 1,
      }))
      updateFieldOrderMutation.mutate(updates)
    }
  }

  const handleAddField = () => {
    if (!newFieldData.field_name.trim()) {
      setApiError('Field name is required')
      return
    }

    const fieldPayload = {
      field_name: newFieldData.field_name,
      field_type: newFieldData.field_type,
      required: newFieldData.required,
      help_text: newFieldData.help_text || undefined,
      field_options:
        newFieldData.field_type === 'select' ||
        newFieldData.field_type === 'checkbox'
          ? newFieldData.field_options
          : undefined,
      display_order: newFieldData.display_order,
    }

    addFieldMutation.mutate(fieldPayload)
  }

  const handleEditField = (fieldId: number) => {
    const field = step.fields.find((f) => f.id === fieldId)
    if (field) {
      setEditingFieldId(fieldId)
      setNewFieldData({
        field_name: field.field_name,
        field_type: field.field_type as FieldType,
        required: field.required,
        help_text: field.help_text || '',
        field_options: field.field_options || [],
        display_order: field.display_order,
      })
      setShowNewFieldForm(false)
      setApiError('')
    }
  }

  const handleSaveField = () => {
    if (!newFieldData.field_name.trim()) {
      setApiError('Field name is required')
      return
    }

    const fieldPayload = {
      field_name: newFieldData.field_name,
      field_type: newFieldData.field_type,
      required: newFieldData.required,
      help_text: newFieldData.help_text || undefined,
      field_options:
        newFieldData.field_type === 'select' ||
        newFieldData.field_type === 'checkbox'
          ? newFieldData.field_options
          : undefined,
      display_order: newFieldData.display_order,
    }

    updateFieldMutation.mutate(fieldPayload)
  }

  const handleCancelEdit = () => {
    setEditingFieldId(null)
    setNewFieldData({
      field_name: '',
      field_type: 'text',
      required: false,
      help_text: '',
      field_options: [],
      display_order: step.fields.length + 1,
    })
    setApiError('')
  }

  const handleAddOption = () => {
    if (!optionInput.trim()) return
    const [label, value] = optionInput.split('|').map((s) => s.trim())
    if (label && value) {
      setNewFieldData({
        ...newFieldData,
        field_options: [
          ...newFieldData.field_options,
          { label, value },
        ],
      })
      setOptionInput('')
    }
  }

  const handleDeleteField = (fieldId: number) => {
    deleteFieldMutation.mutate(fieldId)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-white">Fields</h4>
          <p className="text-xs text-slate-500 mt-1">Drag fields to reorder, or use arrow keys</p>
        </div>
        {!showNewFieldForm && (
          <button
            onClick={() => setShowNewFieldForm(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 text-white text-sm rounded-lg transition font-medium"
          >
            + Add Field
          </button>
        )}
      </div>

      {apiError && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-sm text-red-300">{apiError}</p>
        </div>
      )}

      {(showNewFieldForm || editingFieldId !== null) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
          <div className="space-y-3">
          <input
            type="text"
            placeholder="Field name (e.g., first_name)"
            value={newFieldData.field_name}
            onChange={(e) =>
              setNewFieldData({
                ...newFieldData,
                field_name: e.target.value,
              })
            }
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition"
          />

          <select
            value={newFieldData.field_type}
            onChange={(e) =>
              setNewFieldData({
                ...newFieldData,
                field_type: e.target.value as FieldType,
              })
            }
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded text-sm text-white focus:ring-2 focus:ring-[#0582BE] outline-none transition"
          >
            {FIELD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Help text (optional)"
            value={newFieldData.help_text}
            onChange={(e) =>
              setNewFieldData({
                ...newFieldData,
                help_text: e.target.value,
              })
            }
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newFieldData.required}
              onChange={(e) =>
                setNewFieldData({
                  ...newFieldData,
                  required: e.target.checked,
                })
              }
              className="w-4 h-4 rounded border-slate-600 bg-slate-800/50 accent-[#0582BE]"
            />
            <span className="text-sm text-slate-300">Required field</span>
          </label>

          {(newFieldData.field_type === 'select' ||
            newFieldData.field_type === 'checkbox') && (
            <div className="space-y-2 p-3 bg-slate-800/50 rounded border border-slate-600">
              <p className="text-sm font-medium text-slate-300">Options</p>
              <div className="space-y-2">
                {newFieldData.field_options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 bg-slate-900/50 rounded text-sm text-slate-300"
                  >
                    <span>
                      {opt.label} ({opt.value})
                    </span>
                    <button
                      onClick={() =>
                        setNewFieldData({
                          ...newFieldData,
                          field_options:
                            newFieldData.field_options.filter(
                              (_, i) => i !== idx
                            ),
                        })
                      }
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Label | Value (e.g., Yes | true)"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0582BE] outline-none transition"
                />
                <button
                  onClick={handleAddOption}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded transition font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {editingFieldId !== null ? (
              <>
                <button
                  onClick={handleSaveField}
                  disabled={updateFieldMutation.isPending}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white text-sm rounded transition font-medium"
                >
                  {updateFieldMutation.isPending ? 'Saving...' : 'Save Field'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded transition font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleAddField}
                  disabled={addFieldMutation.isPending}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 disabled:opacity-50 text-white text-sm rounded transition font-medium"
                >
                  {addFieldMutation.isPending ? 'Adding...' : 'Add Field'}
                </button>
                <button
                  onClick={() => setShowNewFieldForm(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded transition font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          </div>
          <div>
            {newFieldData.field_name && (
              <FieldPreview
                field_name={newFieldData.field_name}
                field_type={newFieldData.field_type}
                required={newFieldData.required}
                help_text={newFieldData.help_text}
                field_options={newFieldData.field_options}
              />
            )}
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-2">
          <SortableContext
            items={step.fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {step.fields.length === 0 ? (
              <EmptyState
                icon={<Icon type="form" size={2.5} color="currentColor" className="text-slate-500" />}
                title="No fields yet"
                description="Add your first field to this step"
                action={{
                  label: 'Add Field',
                  onClick: () => setShowNewFieldForm(true),
                }}
              />
            ) : (
              step.fields
                .sort((a, b) => a.display_order - b.display_order)
                .map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    onEdit={handleEditField}
                    onDelete={handleDeleteField}
                  />
                ))
            )}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  )
}
