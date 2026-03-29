'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

interface ButtonGroupOption {
  value: string
  label: string
}

interface ButtonGroupProps {
  label?: ReactNode
  value: string
  options: ButtonGroupOption[]
  onChange: (value: string) => void
  disabled?: boolean
  footer?: ReactNode
  columns?: number
}

export function ButtonGroup({ label, value, options, onChange, disabled, footer }: ButtonGroupProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number; above: boolean } | null>(null)

  const selectedLabel = options.find(o => o.value === value)?.label ?? value

  // Calculate dropdown position
  useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownHeight = options.length * 36 + 8
    const above = spaceBelow < dropdownHeight && rect.top > spaceBelow
    setPos({
      left: rect.left,
      width: rect.width,
      top: above ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      above,
    })
  }, [open, options.length])

  // Close on click outside
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        <span>{label ?? selectedLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label && <span style={{ color: 'rgba(255,255,255,0.95)' }}>{selectedLabel}</span>}
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
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: opt.value === value ? 'rgba(255,255,255,0.11)' : 'transparent',
                color: opt.value === value ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {footer && <div>{footer}</div>}
    </div>
  )
}
