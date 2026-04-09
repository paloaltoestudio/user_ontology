interface EmptyStateProps {
  icon: string | React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const isString = typeof icon === 'string'
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className={isString ? 'text-6xl mb-4' : 'mb-4'}>{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-center mb-6 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-gradient-to-r from-[#0582BE] to-blue-600 hover:from-[#0582BE] hover:to-blue-700 text-white rounded-lg transition font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
