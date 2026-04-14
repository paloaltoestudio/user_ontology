interface ConfirmActionModalProps {
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  variant?: 'danger' | 'warning' | 'default'
}

export function ConfirmActionModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'danger',
}: ConfirmActionModalProps) {
  const confirmButtonColor = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    default: 'bg-blue-600 hover:bg-blue-700',
  }[variant]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/30 rounded-lg max-w-sm w-full">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/30 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-white transition disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="text-white break-words">
            {typeof message === 'string' ? (
              message
            ) : (
              message
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="border-t border-slate-700/30 p-4 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 transition disabled:opacity-50 font-medium text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg ${confirmButtonColor} text-white transition disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                <span>{confirmText}...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Legacy export for backwards compatibility
export const DeleteGoalConfirmModal = ConfirmActionModal
