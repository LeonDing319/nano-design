'use client'

import { useAppState } from '@/hooks/useEffectParams'

export function LocaleToggle() {
  const { state, dispatch } = useAppState()

  const toggleLocale = () => {
    dispatch({ type: 'SET_LOCALE', payload: state.locale === 'en' ? 'zh' : 'en' })
  }

  return (
    <button
      onClick={toggleLocale}
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--color-text-muted)',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {state.locale === 'en' ? '中' : 'EN'}
    </button>
  )
}
