'use client'

import { useCallback } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { Sun, Moon } from 'lucide-react'

function playToggleSound() {
  try {
    const ctx = new AudioContext()
    const t = ctx.currentTime;
    [1046, 1318, 1568, 2093].forEach((freq, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0.001, t + i * .03)
      g.gain.linearRampToValueAtTime(0.14, t + i * .03 + .01)
      g.gain.exponentialRampToValueAtTime(0.001, t + i * .03 + .3)
      o.connect(g); g.connect(ctx.destination)
      o.start(t + i * .03); o.stop(t + i * .03 + .35)
    })
  } catch { /* ignore */ }
}

export function ThemeToggle() {
  const { state, dispatch } = useAppState()
  const isDark = state.theme === 'dark'

  const toggleTheme = useCallback(() => {
    playToggleSound()
    dispatch({ type: 'SET_THEME', payload: isDark ? 'light' : 'dark' })
  }, [dispatch, isDark])

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        color: 'var(--color-text-muted)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {isDark
        ? <Sun style={{ width: 16, height: 16 }} />
        : <Moon style={{ width: 16, height: 16 }} />
      }
    </button>
  )
}
