'use client'

import { LocaleToggle } from './LocaleToggle'

export function Header() {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 44,
      padding: '0 16px',
      borderBottom: '1px solid var(--color-border-faint)',
      backgroundColor: 'var(--color-bg-primary)',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        letterSpacing: '0.02em',
      }}>
        Nano Design
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LocaleToggle />
      </div>
    </header>
  )
}
