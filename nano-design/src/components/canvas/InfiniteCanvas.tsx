'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Maximize } from 'lucide-react'
import { EffectCanvas, getDisplaySize } from './EffectCanvas'
import { useAppState } from '@/hooks/useEffectParams'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useTranslations } from 'next-intl'

const ZOOM_MIN = 0.05
const ZOOM_MAX = 20
const ZOOM_SENSITIVITY = 0.02
const PAN_SPEED = 1.7

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface InfiniteCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

// 约束 viewport 使图片四边始终在容器内完整可见
function clampVP(
  v: { x: number; y: number; zoom: number },
  np: { x: number; y: number },
  imgW: number, imgH: number,
  cw: number, ch: number
) {
  // 最大缩放：图片不能超出容器（宽高都必须 <= 容器）
  const fitZoom = Math.min(cw / imgW, ch / imgH)
  const zoom = Math.min(v.zoom, fitZoom)

  const sw = imgW * zoom
  const sh = imgH * zoom
  const ox = np.x * zoom
  const oy = np.y * zoom

  // 图片 <= 容器：四边不能超出容器边界
  const x = Math.max(-ox, Math.min(cw - sw - ox, v.x))
  const y = Math.max(-oy, Math.min(ch - sh - oy, v.y))

  return { x, y, zoom }
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
  const imageSizeRef = useRef({ width: 0, height: 0 })

  const source = state.video || state.image

  // 用 ref 保存图片尺寸，供事件回调访问
  useEffect(() => {
    if (source) {
      imageSizeRef.current = getDisplaySize(source)
    } else {
      imageSizeRef.current = { width: 0, height: 0 }
    }
  }, [source])

  const clamp = useCallback((v: { x: number; y: number; zoom: number }) => {
    const el = containerRef.current
    const { width: imgW, height: imgH } = imageSizeRef.current
    if (!el || imgW === 0) return v
    const rect = el.getBoundingClientRect()
    return clampVP(v, nodePosRef.current, imgW, imgH, rect.width, rect.height)
  }, [])

  useEffect(() => {
    if (source && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const { width: dw, height: dh } = getDisplaySize(source)
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
  }, [source])

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
          return clamp({ x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r, zoom: z })
        })
      } else {
        setViewport(v => clamp({
          ...v,
          x: v.x - e.deltaX * PAN_SPEED,
          y: v.y - e.deltaY * PAN_SPEED,
        }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [clamp])

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
      setViewport(prev => clamp({ ...prev, x: ox + me.clientX - sx, y: oy + me.clientY - sy }))
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
      const newNp = { x: mwx - ox, y: mwy - oy }
      // 临时更新 ref 让 clamp 能拿到最新 nodePos
      nodePosRef.current = newNp
      setNodePos(newNp)
      setViewport(v => clamp(v))
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
          willChange: 'transform',
        }}
      >
        {source && (
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
      {!source && !isFileDragOver && (
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

      <div
        className="select-none font-mono tabular-nums"
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          height: 36,
          borderRadius: 18,
          backgroundColor: 'var(--color-theme-toggle-bg)',
          border: '1px solid var(--color-border-group)',
          fontSize: 13,
          color: 'var(--color-theme-toggle-icon)',
        }}
      >
        {source && (
          <button
            type="button"
            onClick={() => {
              if (!source || !containerRef.current) return
              const rect = containerRef.current.getBoundingClientRect()
              const { width: dw, height: dh } = getDisplaySize(source)
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
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-theme-toggle-icon)' }}
          >
            <Maximize style={{ width: 14, height: 14 }} />
          </button>
        )}
        <span style={{ padding: '0 12px 0 ' + (source ? '0' : '12px') }}>{Math.round(viewport.zoom * 100)}%</span>
      </div>
    </div>
  )
}
