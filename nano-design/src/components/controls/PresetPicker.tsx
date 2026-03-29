'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
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
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const activePreset = presets.find(p => p.id === activePresetId)
  const selectedLabel = activePreset ? (locale === 'zh' ? activePreset.nameZh : activePreset.name) : '\u2014'

  useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownHeight = presets.length * 36 + 8
    const above = spaceBelow < dropdownHeight && rect.top > spaceBelow
    setPos({
      left: rect.left,
      width: rect.width,
      top: above ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
    })
  }, [open, presets.length])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return
      if (dropdownRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: 36,
          padding: '0 10px',
          borderRadius: 8,
          border: 'none',
          backgroundColor: open ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 13,
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!disabled && !open) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
      >
        <span>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.95)' }}>{selectedLabel}</span>
          <ChevronDown style={{
            width: 16, height: 16,
            opacity: 0.6,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }} />
        </div>
      </button>

      {open && pos && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 10000,
            backgroundColor: '#212121',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {presets.map((preset) => {
            const isActive = preset.id === activePresetId
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => { onSelect(preset.params, preset.id); setOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.11)' : 'transparent',
                  color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {locale === 'zh' ? preset.nameZh : preset.name}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
