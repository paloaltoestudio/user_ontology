import { useState } from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  ariaLabel?: string
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  ariaLabel,
}: ToggleSwitchProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleClick = () => {
    if (!disabled && !isTransitioning) {
      setIsTransitioning(true)
      onChange(!checked)
      // Reset transition state after animation completes
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label || 'Toggle'}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0582BE] ${
          checked
            ? 'bg-[#0582BE]'
            : 'bg-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
      >
        {/* Toggle circle */}
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
          aria-hidden="true"
        />
      </button>
      {label && (
        <span className="text-sm text-slate-300 ml-1">{label}</span>
      )}
    </div>
  )
}
