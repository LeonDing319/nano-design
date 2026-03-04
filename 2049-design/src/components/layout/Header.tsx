'use client'

import { useAppState } from '@/hooks/useEffectParams'
import { EffectType } from '@/types'
import { Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function Header() {
  const { state, dispatch } = useAppState()
  const t = useTranslations()

  const tabs: { id: EffectType; label: string }[] = [
    { id: 'glitch', label: t('effects.glitch') },
    { id: 'ascii', label: t('effects.ascii') },
  ]

  const toggleLocale = () => {
    dispatch({ type: 'SET_LOCALE', payload: state.locale === 'en' ? 'zh' : 'en' })
  }

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 48,
      padding: '0 16px',
      borderBottom: '1px solid var(--color-border-faint)',
      backgroundColor: 'var(--color-bg-primary)',
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'var(--color-bg-elevated)',
        borderRadius: 6,
        padding: 2,
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_EFFECT', payload: tab.id })}
            style={{
              padding: '4px 14px',
              fontSize: 14,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s, color 0.15s',
              backgroundColor: state.activeEffect === tab.id ? 'var(--color-bg-hover)' : 'transparent',
              color: state.activeEffect === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <button
        onClick={toggleLocale}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          fontSize: 14,
          color: 'var(--color-text-muted)',
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          backgroundColor: 'transparent',
          transition: 'background-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)'
          e.currentTarget.style.color = 'var(--color-text-primary)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = 'var(--color-text-muted)'
        }}
      >
        <Globe style={{ width: 16, height: 16 }} />
        <span>{state.locale === 'en' ? 'EN' : '中'}</span>
      </button>
    </header>
  )
}
