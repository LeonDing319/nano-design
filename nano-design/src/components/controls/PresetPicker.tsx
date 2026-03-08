'use client'

import { ReactNode } from 'react'
import { Preset } from '@/types'

interface PresetPickerProps<T> {
  label: ReactNode
  presets: Preset<T>[]
  activePresetId?: string
  onSelect: (params: T, presetId: string) => void
  locale: 'zh' | 'en'
  disabled?: boolean
}

export function PresetPicker<T>({ label, presets, activePresetId, onSelect, locale, disabled }: PresetPickerProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-neutral-300">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.params, preset.id)}
            disabled={disabled}
            className={`px-3 py-1 text-xs rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              activePresetId === preset.id
                ? 'text-blue-500 border-blue-500 bg-blue-500/15'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {locale === 'zh' ? preset.nameZh : preset.name}
          </button>
        ))}
      </div>
    </div>
  )
}
