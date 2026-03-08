'use client'

import { ReactNode, useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react'

const THUMB = 16

let audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

let lastTickTime = 0
const TICK_INTERVAL = 80

type SoundType = 'bubble' | 'mech5' | 'drag' | 'fun5'

// Continuous drag sound nodes (for displacement slider)
let dragOsc: OscillatorNode | null = null
let dragGain: GainNode | null = null

function startDragSound() {
  try {
    const ctx = getAudioCtx()
    if (dragOsc) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    // Gentle filtered noise-like tone — smooth continuous hiss
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
      // 气泡（RGB Split 保留）
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
      // 05 钟表滴答 → 条纹分层
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
      // drag 类型不走这里，由 startDragSound/stopDragSound 控制
      case 'drag': break
      // 25 磁吸 → 随机 Seed
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
  label: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  disabled?: boolean
  suffix?: ReactNode
  sound?: SoundType
}

export function Slider({ label, value, min, max, step = 1, onChange, disabled, suffix, sound = 'bubble' }: SliderProps) {
  const percent = (value - min) / (max - min)
  const trackRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const [dragging, setDragging] = useState(false)

  const handleChange = useCallback((v: number) => {
    if (sound !== 'drag') playSound(sound)
    onChange(v)
  }, [onChange, sound])

  useLayoutEffect(() => {
    if (!trackRef.current) return
    setTrackWidth(trackRef.current.getBoundingClientRect().width)
    const ro = new ResizeObserver(([e]) => setTrackWidth(e.contentRect.width))
    ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [])

  // Thumb center travels from THUMB/2 to trackWidth-THUMB/2
  // so the circle is always fully within the track bounds
  const thumbCenter = trackWidth > 0 ? THUMB / 2 + percent * (trackWidth - THUMB) : THUMB / 2
  const thumbLeft = thumbCenter - THUMB / 2
  const fillWidth = thumbCenter

  return (
    <div className="flex flex-col gap-1.5" style={{ opacity: disabled ? 0.4 : 1 }}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-neutral-300">{label}</span>
          {suffix}
        </div>
        <span className="text-neutral-500 tabular-nums">{value}</span>
      </div>

      {/* Outer container — full width, used for input hit area */}
      <div ref={trackRef} style={{ position: 'relative', height: THUMB }}>
        {/* Track — full width background */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 9999,
          backgroundColor: 'var(--color-slider-track)',
          zIndex: 0,
        }} />

        {/* Fill — from left edge to thumb center */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          height: '100%',
          width: trackWidth > 0 ? thumbLeft + THUMB / 2 : 0,
          backgroundColor: 'var(--color-slider-fill)',
          borderRadius: 9999,
          transition: dragging ? 'none' : 'width 0.05s',
          zIndex: 1,
        }} />

        {/* Native input — full width, invisible */}
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => handleChange(Number(e.target.value))}
          onMouseDown={() => { setDragging(true); if (sound === 'drag') startDragSound() }}
          onMouseUp={() => { setDragging(false); if (sound === 'drag') stopDragSound() }}
          onTouchStart={() => { setDragging(true); if (sound === 'drag') startDragSound() }}
          onTouchEnd={() => { setDragging(false); if (sound === 'drag') stopDragSound() }}
          disabled={disabled}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            margin: 0, opacity: 0, cursor: disabled ? 'not-allowed' : 'pointer', zIndex: 4,
          }}
        />

        {/* Thumb — always fully visible, travels 0 to trackWidth-THUMB */}
        <div style={{
          position: 'absolute', top: 0,
          left: thumbLeft,
          width: THUMB, height: THUMB, borderRadius: '50%',
          backgroundColor: 'var(--color-slider-thumb)',
          boxShadow: 'var(--color-slider-thumb-shadow)',
          transition: dragging ? 'none' : 'left 0.05s',
          pointerEvents: 'none',
          zIndex: 3,
        }} />
      </div>
    </div>
  )
}
