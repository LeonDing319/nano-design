'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { EffectCanvas, getDisplaySize } from './EffectCanvas'
import { useAppState } from '@/hooks/useEffectParams'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useTranslations } from 'next-intl'

const ZOOM_MIN = 0.05
const ZOOM_MAX = 20
const ZOOM_SENSITIVITY = 0.01
const PAN_SPEED = 1.5

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface InfiniteCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function InfiniteCanvas({ canvasRef }: InfiniteCanvasProps) {
  const { state } = useAppState()
  const { handleUpload } = useImageUpload()
  const t = useTranslations('upload')
  const containerRef = useRef<HTMLDivElement>(null)

  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
  const [nodePos, setNodePos] = useState({ x: 0, y: 0 })
  const [cursor, setCursor] = useState('default')
  const [isPanMode, setIsPanMode] = useState(false)
  const [isFileDragOver, setIsFileDragOver] = useState(false)

  const viewportRef = useRef(viewport)
  viewportRef.current = viewport
  const nodePosRef = useRef(nodePos)
  nodePosRef.current = nodePos
  const spaceRef = useRef(false)

  useEffect(() => {
    if (state.image && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const { width: dw, height: dh } = getDisplaySize(state.image)
      const padding = 40
      const fitZoom = Math.min(
        (rect.width - padding * 2) / dw,
        (rect.height - padding * 2) / dh,
        1
      )
      const scaledW = dw * fitZoom
      const scaledH = dh * fitZoom
      setNodePos({ x: 0, y: 0 })
      setViewport({
        x: (rect.width - scaledW) / 2,
        y: (rect.height - scaledH) / 2,
        zoom: fitZoom,
      })
    }
  }, [state.image])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect()
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        setViewport(v => {
          const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY)
          const z = Math.min(Math.max(v.zoom * factor, ZOOM_MIN), ZOOM_MAX)
          const r = z / v.zoom
          return { x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r, zoom: z }
        })
      } else {
        setViewport(v => ({
          ...v,
          x: v.x - e.deltaX * PAN_SPEED,
          y: v.y - e.deltaY * PAN_SPEED,
        }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        spaceRef.current = true
        setIsPanMode(true)
        setCursor('grab')
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceRef.current = false
        setIsPanMode(false)
        setCursor('default')
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  const startPan = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const v = viewportRef.current
    const sx = e.clientX, sy = e.clientY
    const ox = v.x, oy = v.y

    setCursor('grabbing')

    const onMove = (me: MouseEvent) => {
      setViewport(prev => ({ ...prev, x: ox + me.clientX - sx, y: oy + me.clientY - sy }))
    }
    const onUp = () => {
      setCursor(spaceRef.current ? 'grab' : 'default')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const startNodeDrag = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const v = viewportRef.current
    const np = nodePosRef.current
    const wx = (e.clientX - rect.left - v.x) / v.zoom
    const wy = (e.clientY - rect.top - v.y) / v.zoom
    const ox = wx - np.x
    const oy = wy - np.y

    setCursor('grabbing')

    const onMove = (me: MouseEvent) => {
      const vv = viewportRef.current
      const mwx = (me.clientX - rect.left - vv.x) / vv.zoom
      const mwy = (me.clientY - rect.top - vv.y) / vv.zoom
      setNodePos({ x: mwx - ox, y: mwy - oy })
    }
    const onUp = () => {
      setCursor('default')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && spaceRef.current)) {
      startPan(e)
    }
  }, [startPan])

  const handleNodeMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || spaceRef.current) return
    startNodeDrag(e)
  }, [startNodeDrag])

  // File drag-and-drop onto canvas
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      e.stopPropagation()
      setIsFileDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsFileDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFileDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      await handleUpload(file)
    }
  }, [handleUpload])

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative select-none outline-none"
      style={{ cursor, background: 'var(--color-canvas-bg)' }}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={-1}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {state.image && (
          <div
            className="absolute"
            style={{
              left: nodePos.x,
              top: nodePos.y,
              filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))',
              cursor: isPanMode ? undefined : 'move',
            }}
            onMouseDown={handleNodeMouseDown}
          >
            <EffectCanvas ref={canvasRef} />
          </div>
        )}
      </div>

      {/* Empty state hint */}
      {!state.image && !isFileDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-neutral-600 select-none">{t('dragHint')}</p>
        </div>
      )}

      {/* File drop overlay */}
      {isFileDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-4 border-2 border-dashed border-blue-500/60 rounded-2xl bg-blue-500/5" />
          <p className="relative text-base font-medium text-blue-400">{t('dropOverlay')}</p>
        </div>
      )}

      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-neutral-800/80 backdrop-blur-sm rounded text-xs text-neutral-500 select-none pointer-events-none font-mono tabular-nums">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  )
}
