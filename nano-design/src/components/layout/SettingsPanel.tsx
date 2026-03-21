'use client'

import { useState, useRef, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { useAppState } from '@/hooks/useEffectParams'

export function SettingsPanel() {
  const { state, dispatch } = useAppState()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggleLocale = () => {
    dispatch({ type: 'SET_LOCALE', payload: state.locale === 'en' ? 'zh' : 'en' })
  }

  return (
    <div ref={panelRef} style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 50 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-group)',
          color: open ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = 'var(--color-text-secondary)' }}
      >
        <Settings style={{ width: 15, height: 15 }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            left: 0,
            minWidth: 180,
            padding: 12,
            borderRadius: 12,
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-group)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={toggleLocale}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'background-color 0.15s, color 0.15s',
              width: '100%',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
          >
            <span style={{ width: 20, textAlign: 'center', fontWeight: 500 }}>
              {state.locale === 'en' ? '中' : 'EN'}
            </span>
            <span>{state.locale === 'en' ? 'Switch to Chinese' : '切换为英文'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
