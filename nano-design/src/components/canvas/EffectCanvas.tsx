'use client'

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { renderGlitch } from '@/engines/glitch'
import { renderAscii } from '@/engines/ascii'

const MAX_DISPLAY_DIM = 1200

export function getDisplaySize(image: HTMLImageElement) {
  const { naturalWidth: w, naturalHeight: h } = image
  const scale = Math.min(MAX_DISPLAY_DIM / Math.max(w, h), 1)
  return { width: Math.round(w * scale), height: Math.round(h * scale) }
}

export const EffectCanvas = forwardRef<HTMLCanvasElement>(function EffectCanvas(_, ref) {
  const { state } = useAppState()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const frameRef = useRef<number>(0)

  useImperativeHandle(ref, () => canvasRef.current!, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !state.image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = getDisplaySize(state.image)
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    if (state.activeEffect === 'glitch') {
      renderGlitch(ctx, state.image, state.glitchParams, width, height, frameRef.current)
    } else {
      renderAscii(ctx, state.image, state.asciiParams, width, height)
    }
  }, [state])

  useEffect(() => {
    if (!state.image) return

    const isAnimating = state.activeEffect === 'glitch' && (state.glitchParams.animation || state.glitchParams.rgbSplitDirectionAnim)

    if (isAnimating) {
      const animate = () => {
        frameRef.current++
        render()
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
      return () => { cancelAnimationFrame(animationRef.current) }
    } else {
      frameRef.current = 0
      // Schedule render on next animation frame to avoid blocking slider interactions
      const raf = requestAnimationFrame(() => render())
      return () => cancelAnimationFrame(raf)
    }
  }, [state, render])

  if (!state.image) return null

  const { width, height } = getDisplaySize(state.image)

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
    />
  )
})
