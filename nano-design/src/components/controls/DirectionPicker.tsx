'use client'

import { ReactNode } from 'react'
import { SplitDirection } from '@/types'
import {
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
} from 'lucide-react'

const DIRECTIONS: { value: SplitDirection; icon: ReactNode }[] = [
  { value: 'up', icon: <ArrowUp style={{ width: 14, height: 14 }} /> },
  { value: 'down', icon: <ArrowDown style={{ width: 14, height: 14 }} /> },
  { value: 'left', icon: <ArrowLeft style={{ width: 14, height: 14 }} /> },
  { value: 'right', icon: <ArrowRight style={{ width: 14, height: 14 }} /> },
  { value: 'up-left', icon: <ArrowUpLeft style={{ width: 14, height: 14 }} /> },
  { value: 'up-right', icon: <ArrowUpRight style={{ width: 14, height: 14 }} /> },
  { value: 'down-left', icon: <ArrowDownLeft style={{ width: 14, height: 14 }} /> },
  { value: 'down-right', icon: <ArrowDownRight style={{ width: 14, height: 14 }} /> },
]

interface DirectionPickerProps {
  label: ReactNode
  value: SplitDirection
  onChange: (direction: SplitDirection) => void
  disabled?: boolean
}

export function DirectionPicker({ label, value, onChange, disabled }: DirectionPickerProps) {
  return (
    <div style={{ opacity: disabled ? 0.4 : 1 }}>
      <div className="text-sm text-neutral-300 mb-2">{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {DIRECTIONS.map(({ value: dir, icon }) => (
          <button
            key={dir}
            onClick={() => onChange(dir)}
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 32,
              borderRadius: 6,
              border: dir === value ? '1.5px solid #3b82f6' : '1px solid var(--color-border-faint)',
              backgroundColor: dir === value ? 'rgba(59,130,246,0.15)' : 'var(--color-slider-track)',
              color: dir === value ? '#3b82f6' : 'var(--color-text-secondary, #a3a3a3)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}
