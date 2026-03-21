'use client'

import { ReactNode } from 'react'

interface ButtonGroupOption {
  value: string
  label: string
}

interface ButtonGroupProps {
  label: ReactNode
  value: string
  options: ButtonGroupOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function ButtonGroup({ label, value, options, onChange, disabled }: ButtonGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-neutral-300">{label}</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`border cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
              opt.value === value
                ? 'text-blue-500 border-blue-500 bg-blue-500/15'
                : 'text-neutral-400 border-neutral-700 bg-transparent hover:border-neutral-500'
            }`}
            style={{ height: 28, borderRadius: 6, fontSize: 11, padding: '0 8px' }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
