'use client'

import { ReactNode, useRef, useState, useEffect, useCallback } from 'react'

interface ToggleProps {
  label?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const offRef = useRef<HTMLButtonElement>(null)
  const onRef = useRef<HTMLButtonElement>(null)
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null)
  const hasAnimated = useRef(false)

  const updatePill = useCallback(() => {
    const btn = checked ? onRef.current : offRef.current
    const container = containerRef.current
    if (!btn || !container) return
    const cRect = container.getBoundingClientRect()
    const bRect = btn.getBoundingClientRect()
    setPillStyle({ left: bRect.left - cRect.left, width: bRect.width })
  }, [checked])

  useEffect(() => {
    updatePill()
    const timer = setTimeout(() => { hasAnimated.current = true }, 50)
    return () => clearTimeout(timer)
  }, [updatePill])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: disabled ? 0.4 : 1 }}>
      {label && <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{label}</span>}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'flex',
          padding: 2,
          borderRadius: 8,
          backgroundColor: 'transparent',
        }}
      >
        {/* Animated pill */}
        {pillStyle && (
          <div style={{
            position: 'absolute',
            top: 2,
            bottom: 2,
            left: pillStyle.left,
            width: pillStyle.width,
            backgroundColor: 'rgba(255,255,255,0.11)',
            borderRadius: 6,
            zIndex: 0,
            pointerEvents: 'none',
            transition: hasAnimated.current ? 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }} />
        )}
        <button
          ref={offRef}
          type="button"
          onClick={() => { if (!disabled) onChange(false) }}
          disabled={disabled}
          style={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 500,
            background: 'transparent',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: !checked ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
            transition: 'color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          Off
        </button>
        <button
          ref={onRef}
          type="button"
          onClick={() => { if (!disabled) onChange(true) }}
          disabled={disabled}
          style={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 500,
            background: 'transparent',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: checked ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
            transition: 'color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          On
        </button>
      </div>
    </div>
  )
}
