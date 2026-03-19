'use client'

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, memo } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { renderGlitch } from '@/engines/glitch'
import { renderAscii } from '@/engines/ascii'

const MAX_DISPLAY_DIM = 1200

export function getDisplaySize(image: HTMLImageElement) {
  const { naturalWidth: w, naturalHeight: h } = image
  const scale = Math.min(MAX_DISPLAY_DIM / Math.max(w, h), 1)
  return { width: Math.round(w * scale), height: Math.round(h * scale) }
}

function renderOriginal(
  ctx: CanvasRenderingContext2D,
  sourceImage: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  ctx.drawImage(sourceImage, 0, 0, canvasWidth, canvasHeight)
}

export const EffectCanvas = memo(forwardRef<HTMLCanvasElement>(function EffectCanvas(_, ref) {
  const { state } = useAppState()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const frameRef = useRef<number>(0)
  const lastSizeRef = useRef({ w: 0, h: 0 })

  useImperativeHandle(ref, () => canvasRef.current!, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !state.image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = getDisplaySize(state.image)
    const dpr = window.devicePixelRatio || 1
    const pw = width * dpr
    const ph = height * dpr
    // 只在尺寸变化时重设 canvas 大小（避免每帧清空重建）
    if (lastSizeRef.current.w !== pw || lastSizeRef.current.h !== ph) {
      canvas.width = pw
      canvas.height = ph
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      lastSizeRef.current = { w: pw, h: ph }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (state.activeEffect === 'glitch') {
      renderGlitch(ctx, state.image, state.glitchParams, width, height, frameRef.current)
    } else if (state.activeEffect === 'ascii') {
      renderAscii(ctx, state.image, state.asciiParams, width, height)
    } else {
      renderOriginal(ctx, state.image, width, height)
    }

  }, [state])

  useEffect(() => {
    if (!state.image) return

    const isAnimating = state.activeEffect === 'glitch' && (
      state.glitchParams.rgbSplitDirectionAnim ||
      state.glitchParams.displacement > 0 ||
      state.glitchParams.verticalSpeed > 0
    )

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
}))
