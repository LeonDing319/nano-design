'use client'

import { ReactNode, useRef, useState, useEffect } from 'react'

const THUMB = 16

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  disabled?: boolean
  suffix?: ReactNode
}

export function Slider({ label, value, min, max, step = 1, onChange, disabled, suffix }: SliderProps) {
  const percent = (value - min) / (max - min)
  const trackRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!trackRef.current) return
    const ro = new ResizeObserver(([e]) => setTrackWidth(e.contentRect.width))
    ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [])

  // Thumb left: travels from 0 to (trackWidth - THUMB)
  const thumbLeft = trackWidth > 0 ? percent * (trackWidth - THUMB) : 0
  // Fill width: thumb left edge + full thumb width
  const fillWidth = trackWidth > 0 ? thumbLeft + THUMB : 0

  return (
    <div className="flex flex-col gap-1.5" style={{ opacity: disabled ? 0.4 : 1 }}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-neutral-300">{label}</span>
          {suffix}
        </div>
        <span className="text-neutral-500 tabular-nums">{value}</span>
      </div>

      <div ref={trackRef} style={{ position: 'relative', height: THUMB }}>
        {/* Track background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          backgroundColor: '#242424',
          overflow: 'hidden',
        }}>
          {/* Filled portion */}
          <div style={{
            height: '100%',
            width: fillWidth,
            backgroundColor: '#3a3a3a',
            transition: dragging ? 'none' : 'width 0.05s',
          }} />
        </div>

        {/* Native input — invisible, handles all interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          disabled={disabled}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            zIndex: 2,
          }}
        />

        {/* Thumb */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: thumbLeft,
          width: THUMB,
          height: THUMB,
          borderRadius: '50%',
          backgroundColor: '#5c5c5c',
          boxShadow: '0 1px 4px rgba(0,0,0,0.7)',
          transition: dragging ? 'none' : 'left 0.05s',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      </div>
    </div>
  )
}
