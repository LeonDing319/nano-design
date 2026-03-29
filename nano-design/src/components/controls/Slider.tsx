'use client'

import { ReactNode, useRef, useState, useLayoutEffect, useCallback } from 'react'

const TRACK_HEIGHT = 36
const THUMB_W = 3
const THUMB_H = 20

let audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

let lastTickTime = 0
const TICK_INTERVAL = 80

type SoundType = 'bubble' | 'mech5' | 'drag' | 'fun5'

let dragOsc: OscillatorNode | null = null
let dragGain: GainNode | null = null

function startDragSound() {
  try {
    const ctx = getAudioCtx()
    if (dragOsc) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 180
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 600
    filter.Q.value = 0.5
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + .04)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    dragOsc = osc
    dragGain = gain
  } catch { /* ignore */ }
}

function stopDragSound() {
  try {
    if (!dragGain || !dragOsc) return
    const ctx = getAudioCtx()
    dragGain.gain.linearRampToValueAtTime(0, ctx.currentTime + .06)
    const osc = dragOsc
    setTimeout(() => { try { osc.stop() } catch { /* ignore */ } }, 80)
    dragOsc = null
    dragGain = null
  } catch { /* ignore */ }
}

function playSound(type: SoundType) {
  const now = Date.now()
  if (now - lastTickTime < TICK_INTERVAL) return
  lastTickTime = now
  try {
    const ctx = getAudioCtx()
    const t = ctx.currentTime
    const g = ctx.createGain()
    g.connect(ctx.destination)

    switch (type) {
      case 'bubble': {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(480, t)
        osc.frequency.exponentialRampToValueAtTime(880, t + .045)
        g.gain.setValueAtTime(0.001, t)
        g.gain.linearRampToValueAtTime(0.28, t + .008)
        g.gain.exponentialRampToValueAtTime(0.001, t + .05)
        osc.connect(g); osc.start(t); osc.stop(t + .055)
        break
      }
      case 'mech5': {
        const buf = ctx.createBuffer(1, ~~(ctx.sampleRate * .008), ctx.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 12)
        const s = ctx.createBufferSource(); s.buffer = buf
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000
        g.gain.value = .45
        s.connect(hp); hp.connect(g); s.start()
        break
      }
      case 'drag': break
      case 'fun5': {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(80, t)
        osc.frequency.linearRampToValueAtTime(120, t + .06)
        g.gain.setValueAtTime(0.001, t)
        g.gain.linearRampToValueAtTime(0.4, t + .02)
        g.gain.exponentialRampToValueAtTime(0.001, t + .08)
        osc.connect(g); osc.start(t); osc.stop(t + .09)
        break
      }
    }
  } catch {
    // Ignore if audio not available
  }
}

interface SliderProps {
  label?: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  disabled?: boolean
  suffix?: ReactNode
  sound?: SoundType
  snapTo?: number
  snapThreshold?: number
}

function quantize(v: number, min: number, max: number, step: number): number {
  const raw = min + Math.round((v - min) / step) * step
  return Math.min(max, Math.max(min, parseFloat(raw.toPrecision(10))))
}

export function Slider({ label, value, min, max, step = 1, onChange, disabled, suffix, sound = 'bubble', snapTo, snapThreshold }: SliderProps) {
  const threshold = snapThreshold ?? (max - min) * 0.03
  const percent = (value - min) / (max - min)
  const trackRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleChange = useCallback((v: number) => {
    if (snapTo !== undefined && Math.abs(v - snapTo) <= threshold) {
      v = snapTo
    }
    if (sound !== 'drag') playSound(sound)
    onChange(v)
  }, [onChange, sound, snapTo, threshold])

  const pointerToValue = useCallback((clientX: number) => {
    if (!trackRef.current) return value
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return quantize(min + pct * (max - min), min, max, step)
  }, [min, max, step, value])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    if (sound === 'drag') startDragSound()
    handleChange(pointerToValue(e.clientX))
  }, [disabled, handleChange, pointerToValue, sound])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    handleChange(pointerToValue(e.clientX))
  }, [dragging, handleChange, pointerToValue])

  const onPointerUp = useCallback(() => {
    setDragging(false)
    if (sound === 'drag') stopDragSound()
  }, [sound])

  useLayoutEffect(() => {
    if (!trackRef.current) return
    setTrackWidth(trackRef.current.getBoundingClientRect().width)
    const ro = new ResizeObserver(([e]) => setTrackWidth(e.contentRect.width))
    ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [])

  const fillWidth = trackWidth > 0 ? percent * trackWidth : 0
  const thumbLeft = trackWidth > 0 ? percent * (trackWidth - THUMB_W) : 0

  const formattedValue = step < 1 ? value.toFixed(Math.max(0, -Math.floor(Math.log10(step)))) : Math.round(value)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Track container */}
      <div
        ref={trackRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'relative',
          height: TRACK_HEIGHT,
          flex: 1,
          minWidth: 0,
          opacity: disabled ? 0.4 : 1,
          overflow: 'hidden',
          borderRadius: 8,
          cursor: disabled ? 'not-allowed' : 'pointer',
          touchAction: 'none',
        }}
      >
        {/* Background track */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'var(--color-slider-track)',
          zIndex: 0,
        }} />

        {/* Fill */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          height: '100%',
          width: fillWidth,
          backgroundColor: 'var(--color-slider-fill)',
          transition: dragging ? 'none' : 'width 0.05s',
          zIndex: 1,
        }} />

        {/* Label (inside track, left) */}
        {label && (
          <span style={{
            position: 'absolute',
            left: 10,
            top: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            fontSize: 13,
            color: 'rgba(255,255,255,0.7)',
            pointerEvents: 'none',
            zIndex: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '60%',
          }}>
            {label}
          </span>
        )}

        {/* Value (inside track, right) */}
        <span style={{
          position: 'absolute',
          right: 10,
          top: 0,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          fontVariantNumeric: 'tabular-nums',
          color: 'rgba(255,255,255,0.7)',
          pointerEvents: 'none',
          zIndex: 2,
          whiteSpace: 'nowrap',
        }}>
          {formattedValue}
        </span>

        {/* Thumb bar */}
        <div style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          left: thumbLeft,
          width: THUMB_W,
          height: THUMB_H,
          borderRadius: THUMB_W / 2,
          backgroundColor: 'var(--color-slider-thumb)',
          opacity: (hovered || dragging) ? 1 : 0,
          transition: dragging ? 'opacity 0.15s' : 'left 0.05s, opacity 0.15s',
          pointerEvents: 'none',
          zIndex: 3,
        }} />
      </div>

      {/* Suffix (outside track, right side) */}
      {suffix && <div style={{ flexShrink: 0 }}>{suffix}</div>}
    </div>
  )
}
