import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps extends ToastMessage {
  onClose: (id: string) => void
}

const toastConfig = {
  success: {
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-700/50',
    icon: '✓',
    iconColor: 'text-emerald-400',
    textColor: 'text-emerald-200',
  },
  error: {
    bg: 'bg-red-900/20',
    border: 'border-red-700/50',
    icon: '✕',
    iconColor: 'text-red-400',
    textColor: 'text-red-200',
  },
  info: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-700/50',
    icon: 'ℹ',
    iconColor: 'text-blue-400',
    textColor: 'text-blue-200',
  },
  warning: {
    bg: 'bg-amber-900/20',
    border: 'border-amber-700/50',
    icon: '⚠',
    iconColor: 'text-amber-400',
    textColor: 'text-amber-200',
  },
}

export function Toast({ id, message, type, duration = 3000, onClose }: ToastProps) {
  const config = toastConfig[type]

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => onClose(id), duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${config.bg} ${config.border}
                   shadow-xl bg-slate-900 animate-in slide-in-from-right fade-in duration-300`}
      role="alert"
    >
      <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center ${config.iconColor} font-bold`}>
        {config.icon}
      </div>
      <p className={`flex-1 text-sm font-medium ${config.textColor}`}>
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        className={`flex-shrink-0 ${config.iconColor} hover:opacity-75 transition`}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  )
}
