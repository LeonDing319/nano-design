'use client'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

export function ColorPicker({ label, value, onChange, disabled }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-500 font-mono">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-8 h-8 rounded border border-neutral-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  )
}
