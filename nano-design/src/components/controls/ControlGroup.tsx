'use client'

import { ReactNode } from 'react'

interface ControlGroupProps {
  children: ReactNode
  title?: ReactNode
  suffix?: ReactNode
}

export function ControlGroup({ children, title, suffix }: ControlGroupProps) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '12px',
      }}
      className="space-y-3"
    >
      {(title || suffix) && (
        <div style={{
          fontSize: 14,
          fontWeight: 500,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {title}
          {suffix}
        </div>
      )}
      {children}
    </div>
  )
}

interface SectionLabelProps {
  children: ReactNode
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div style={{
      fontSize: 14,
      fontWeight: 400,
      color: '#a0a0a0',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      {children}
    </div>
  )
}
