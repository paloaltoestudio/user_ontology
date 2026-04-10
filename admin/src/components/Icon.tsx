interface IconProps {
  type: 'file' | 'checkbox' | 'form' | 'copy' | 'users' | 'check-circle' | 'clock' | 'slash' | 'trending-down' | 'search' | 'target' | 'info' | 'activity' | 'log-in' | 'file-text' | 'user' | 'zap' | 'circle' | 'lightbulb' | 'user-plus' | 'x-circle' | 'minus-circle'
  size?: number
  color?: string
  className?: string
}

export function Icon({ type, size = 1, color = 'currentColor', className = '' }: IconProps) {
  const dimensions = size * 24

  const icons = {
    file: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
      </svg>
    ),
    checkbox: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <path d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    form: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    copy: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    users: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    'check-circle': (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    slash: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <circle cx="12" cy="12" r="10" />
        <line x1="8" y1="15" x2="16" y2="9" />
      </svg>
    ),
    'trending-down': (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    target: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    activity: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    'log-in': (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    ),
    'file-text': (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    zap: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    circle: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    lightbulb: (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <path d="M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />
        <path d="M9 6a3 3 0 0 0 6 0 3 3 0 0 0-6 0z" />
        <path d="M9 18h6" />
        <path d="M12 2v4" />
      </svg>
    ),
    'user-plus': (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    'x-circle': (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    'minus-circle': (
      <svg viewBox="0 0 24 24" width={dimensions} height={dimensions} fill="none" stroke={color} strokeWidth="1.5" className={className}>
        <circle cx="12" cy="12" r="10" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  }

  return icons[type]
}
