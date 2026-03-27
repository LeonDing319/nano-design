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

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/mpeg']

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
  const zoom = Math.min(Math.max(v.zoom, ZOOM_MIN), ZOOM_MAX)

  const sw = imgW * zoom
  const sh = imgH * zoom
  const ox = np.x * zoom
  const oy = np.y * zoom

  // 图片 <= 容器：居中约束；图片 > 容器：不能拖出边界
  const x = sw <= cw
    ? Math.max(-ox, Math.min(cw - sw - ox, v.x))
    : Math.min(-ox, Math.max(cw - sw - ox, v.x))
  const y = sh <= ch
    ? Math.max(-oy, Math.min(ch - sh - oy, v.y))
    : Math.min(-oy, Math.max(ch - sh - oy, v.y))

  return { x, y, zoom }
}

function TypewriterHint({ text }: { text: string }) {
  const [count, setCount] = useState(0)
  const chars = [...text] // spread to handle emoji as single units

  useEffect(() => {
    if (count >= chars.length) return
    const delay = 1500 / chars.length
    const timer = setTimeout(() => setCount(c => c + 1), delay)
    return () => clearTimeout(timer)
  }, [count, chars.length])

  return (
    <p className="text-neutral-600 select-none" style={{ fontSize: 18 }}>
      {chars.slice(0, count).join('')}
      {count < chars.length && <span className="animate-pulse">|</span>}
    </p>
  )
}

export function InfiniteCanvas({ canvasRef }: InfiniteCanvasProps) {
  const { state, dispatch } = useAppState()
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
  const isMarble = state.activeEffect === 'marble'
  const hasContent = !!source || isMarble

  // 用 ref 保存图片尺寸，供事件回调访问
  useEffect(() => {
    if (source) {
      imageSizeRef.current = getDisplaySize(source)
    } else if (isMarble) {
      imageSizeRef.current = { width: 800, height: 800 }
    } else {
      imageSizeRef.current = { width: 0, height: 0 }
    }
  }, [source, isMarble])

  const clamp = useCallback((v: { x: number; y: number; zoom: number }) => {
    const el = containerRef.current
    const { width: imgW, height: imgH } = imageSizeRef.current
    if (!el || imgW === 0) return v
    const rect = el.getBoundingClientRect()
    return clampVP(v, nodePosRef.current, imgW, imgH, rect.width, rect.height)
  }, [])

  useEffect(() => {
    if (hasContent && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const { width: dw, height: dh } = source ? getDisplaySize(source) : { width: 800, height: 800 }
      const fitZoom = Math.min(rect.width / dw, rect.height / dh)
      const scaledW = dw * fitZoom
      const scaledH = dh * fitZoom
      setNodePos({ x: 0, y: 0 })
      setViewport({
        x: (rect.width - scaledW) / 2,
        y: (rect.height - scaledH) / 2,
        zoom: fitZoom,
      })
    }
  }, [source, isMarble])

  // 监听预设 zoom 设置
  useEffect(() => {
    const handler = (e: Event) => {
      const zoom = (e as CustomEvent).detail as number
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const { width: dw, height: dh } = imageSizeRef.current
      if (dw === 0) return
      const scaledW = dw * zoom
      const scaledH = dh * zoom
      setNodePos({ x: 0, y: 0 })
      setViewport({
        x: (rect.width - scaledW) / 2,
        y: (rect.height - scaledH) / 2,
        zoom,
      })
    }
    window.addEventListener('nano:set-zoom', handler)
    return () => window.removeEventListener('nano:set-zoom', handler)
  }, [])

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
    if (file && ACCEPTED_TYPES.includes(file.type)) {
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
        {hasContent && (
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

      {/* Empty state hint with typewriter effect */}
      {!hasContent && !isFileDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <TypewriterHint text={t('dragHint')} />
        </div>
      )}

      {/* File drop overlay */}
      {isFileDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-4 border-2 border-dashed border-blue-500/60 rounded-2xl bg-blue-500/5" />
          <p className="relative text-base font-medium text-blue-400">{t('dropOverlay')}</p>
        </div>
      )}

      {hasContent && (
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 50, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.5)',
            fontVariantNumeric: 'tabular-nums',
            userSelect: 'none',
          }}>
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => {
              if (!containerRef.current) return
              const rect = containerRef.current.getBoundingClientRect()
              const { width: dw, height: dh } = source ? getDisplaySize(source) : { width: 800, height: 800 }
              const fitZoom = Math.min(rect.width / dw, rect.height / dh)
              const scaledW = dw * fitZoom
              const scaledH = dh * fitZoom
              setNodePos({ x: 0, y: 0 })
              setViewport({
                x: (rect.width - scaledW) / 2,
                y: (rect.height - scaledH) / 2,
                zoom: fitZoom,
              })
            }}
            className="select-none"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 9999,
              border: '1px solid rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(16px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
              boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.3)',
              color: 'rgba(255,255,255,0.85)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'
              e.currentTarget.style.color = 'rgba(255,255,255,1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
            }}
          >
            <Maximize style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  )
}
