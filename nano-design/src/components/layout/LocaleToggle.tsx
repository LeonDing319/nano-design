'use client'

import { useAppState } from '@/hooks/useEffectParams'
import { Globe } from 'lucide-react'

export function LocaleToggle() {
  const { state, dispatch } = useAppState()

  const toggleLocale = () => {
    dispatch({ type: 'SET_LOCALE', payload: state.locale === 'en' ? 'zh' : 'en' })
  }

  return (
    <button
      onClick={toggleLocale}
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        fontSize: 14,
        color: 'var(--color-text-muted)',
        borderRadius: 6,
        border: '1px solid var(--color-border-faint)',
        cursor: 'pointer',
        backgroundColor: 'var(--color-bg-primary)',
        transition: 'background-color 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)'
        e.currentTarget.style.color = 'var(--color-text-primary)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'
        e.currentTarget.style.color = 'var(--color-text-muted)'
      }}
    >
      <Globe style={{ width: 16, height: 16 }} />
      <span>{state.locale === 'en' ? 'EN' : '中'}</span>
    </button>
  )
}
