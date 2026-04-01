'use client'

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, memo, useState } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { renderGlitch } from '@/engines/glitch'
import { renderAscii } from '@/engines/ascii'
import { createMarbleEngine, MarbleEngine } from '@/engines/marble'
import { createFlowEngine, FlowEngine } from '@/engines/flow'

const MAX_DISPLAY_DIM = 1600

export function getDisplaySize(source: HTMLImageElement | HTMLVideoElement) {
  const w = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth
  const h = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight
  const scale = Math.min(MAX_DISPLAY_DIM / Math.max(w, h), 1)
  return { width: Math.round(w * scale), height: Math.round(h * scale) }
}

const MARBLE_DEFAULT_SIZE = 800

export const EffectCanvas = memo(forwardRef<HTMLCanvasElement>(function EffectCanvas(_, ref) {
  const { state } = useAppState()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const frameRef = useRef<number>(0)
  const lastSizeRef = useRef({ w: 0, h: 0 })
  const marbleEngineRef = useRef<MarbleEngine | null>(null)
  const flowEngineRef = useRef<FlowEngine | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)

  useImperativeHandle(ref, () => canvasRef.current!, [])

  useEffect(() => {
    const onShow = () => setShowOriginal(true)
    const onHide = () => setShowOriginal(false)
    window.addEventListener('nano:show-original', onShow)
    window.addEventListener('nano:hide-original', onHide)
    return () => {
      window.removeEventListener('nano:show-original', onShow)
      window.removeEventListener('nano:hide-original', onHide)
    }
  }, [])

  // 管理 marble WebGL 引擎生命周期
  useEffect(() => {
    if (state.activeEffect === 'marble') {
      if (!marbleEngineRef.current) {
        marbleEngineRef.current = createMarbleEngine()
      }
    } else {
      if (marbleEngineRef.current) {
        marbleEngineRef.current.destroy()
        marbleEngineRef.current = null
      }
    }
    return () => {
      if (marbleEngineRef.current) {
        marbleEngineRef.current.destroy()
        marbleEngineRef.current = null
      }
    }
  }, [state.activeEffect])

  // 管理 flow WebGL 引擎生命周期
  useEffect(() => {
    if (state.activeEffect === 'flow') {
      if (!flowEngineRef.current) {
        flowEngineRef.current = createFlowEngine()
      }
    } else {
      if (flowEngineRef.current) {
        flowEngineRef.current.destroy()
        flowEngineRef.current = null
      }
    }
    return () => {
      if (flowEngineRef.current) {
        flowEngineRef.current.destroy()
        flowEngineRef.current = null
      }
    }
  }, [state.activeEffect])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const isMarble = state.activeEffect === 'marble'
    const isFlow = state.activeEffect === 'flow'
    const source = state.video || state.image

    // 非 marble 效果需要源图片
    if (!isMarble && !source) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width: number, height: number
    if (isMarble) {
      width = MARBLE_DEFAULT_SIZE
      height = MARBLE_DEFAULT_SIZE
    } else if (source) {
      const size = getDisplaySize(source)
      width = size.width
      height = size.height
    } else {
      width = MARBLE_DEFAULT_SIZE
      height = MARBLE_DEFAULT_SIZE
    }

    const dpr = window.devicePixelRatio || 1
    const pw = width * dpr
    const ph = height * dpr
    if (lastSizeRef.current.w !== pw || lastSizeRef.current.h !== ph) {
      canvas.width = pw
      canvas.height = ph
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      lastSizeRef.current = { w: pw, h: ph }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (showOriginal && source && !isMarble) {
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(source, 0, 0, width, height)
    } else if (isMarble) {
      const engine = marbleEngineRef.current
      if (!engine) return
      engine.resize(pw, ph)
      engine.render(state.marbleParams, state.marbleParams.animated)
      ctx.clearRect(0, 0, width, height)
      engine.copyTo2D(ctx, 0, 0, width, height);
      (canvas as any).__marbleEngine = engine
    } else if (isFlow) {
      const engine = flowEngineRef.current
      if (!engine || !source) return
      engine.resize(pw, ph)
      engine.setTexture(source)
      engine.render(state.flowParams)
      ctx.clearRect(0, 0, width, height)
      engine.copyTo2D(ctx, 0, 0, width, height);
      (canvas as any).__flowEngine = engine
    } else if (state.activeEffect === 'glitch') {
      renderGlitch(ctx, source!, state.glitchParams, width, height, frameRef.current)
    } else if (state.activeEffect === 'ascii') {
      renderAscii(ctx, source!, state.asciiParams, width, height, frameRef.current)
    }

  }, [state, showOriginal])

  useEffect(() => {
    const isMarble = state.activeEffect === 'marble'
    const isFlow = state.activeEffect === 'flow'
    const source = state.video || state.image

    if (!isMarble && !source) return

    const isVideoMode = !!state.video
    const isAnimating = isVideoMode || (
      state.activeEffect === 'glitch' && (
        state.glitchParams.rgbSplitDirectionAnim ||
        state.glitchParams.displacement > 0 ||
        state.glitchParams.verticalSpeed > 0
      )
    ) || (
      state.activeEffect === 'ascii' && state.asciiParams.animated
    ) || (
      isMarble && state.marbleParams.animated
    ) || isFlow

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
      const raf = requestAnimationFrame(() => render())
      return () => cancelAnimationFrame(raf)
    }
  }, [state, render, showOriginal])

  const isMarble = state.activeEffect === 'marble'
  const source = state.video || state.image
  if (!isMarble && !source) return null

  let width: number, height: number
  if (isMarble) {
    width = MARBLE_DEFAULT_SIZE
    height = MARBLE_DEFAULT_SIZE
  } else if (source) {
    const size = getDisplaySize(source)
    width = size.width
    height = size.height
  } else {
    width = MARBLE_DEFAULT_SIZE
    height = MARBLE_DEFAULT_SIZE
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
    />
  )
}))
