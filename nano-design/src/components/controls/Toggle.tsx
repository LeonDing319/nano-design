'use client'

import { ReactNode } from 'react'

interface ToggleProps {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between" style={{ opacity: disabled ? 0.4 : 1 }}>
      <span className="text-sm text-neutral-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
          checked ? 'bg-blue-500' : 'bg-neutral-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
