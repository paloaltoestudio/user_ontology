import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormField } from '../../types/form'

interface SortableFieldItemProps {
  field: FormField
  onEdit: (fieldId: number) => void
  onDelete: (fieldId: number) => void
  isDragging?: boolean
}

export function SortableFieldItem({
  field,
  onEdit,
  onDelete,
  isDragging,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group p-3 bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-3 hover:border-[#0582BE]/50 transition duration-200 ${
        isSortableDragging ? 'shadow-lg shadow-blue-500/20 scale-105 bg-slate-700 border-[#0582BE]/50' : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center cursor-grab
                   hover:bg-slate-700 hover:text-[#0582BE] rounded-lg transition text-slate-600
                   active:cursor-grabbing touch-none -ml-1 mr-1"
        title="Drag to reorder. Use arrow keys as alternative."
        role="button"
        tabIndex={0}
        aria-label={`Drag handle for ${field.field_name}`}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </div>

      {/* Field Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">
          {field.field_name}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </p>
        <p className="text-xs text-slate-500">
          {field.field_type}
          {field.user_field_mapping && ` → ${field.user_field_mapping}`}
        </p>
        {field.help_text && (
          <p className="text-xs text-slate-400 mt-1">{field.help_text}</p>
        )}
      </div>

      {/* Actions */}
      <div className="ml-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onEdit(field.id)}
          className="text-[#0582BE] hover:text-blue-400 text-sm font-medium transition"
          title="Edit field"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(field.id)}
          className="text-red-400 hover:text-red-300 text-sm font-medium transition"
          title="Delete field"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
