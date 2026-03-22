'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { ImageIcon, Download, Settings } from 'lucide-react'
import { useImageUpload, ACCEPT_STRING } from '@/hooks/useImageUpload'
import { useTranslations } from 'next-intl'
import { exportPNG, exportJPEG, exportSVG, exportPDF, exportGIF, exportMP4, exportVideoMP4 } from '@/engines/exporter'
import { renderGlitch } from '@/engines/glitch'
import { renderAscii } from '@/engines/ascii'
import { useAppState } from '@/hooks/useEffectParams'
import { EffectType } from '@/types'
import { playSound } from '@/utils/sound'
import { getDisplaySize } from '@/components/canvas/EffectCanvas'

type StaticFormat = 'PNG' | 'JPEG' | 'SVG' | 'PDF'
type AnimFormat = 'GIF' | 'MP4'
type ExportFormat = StaticFormat | AnimFormat

const DURATION_OPTIONS = [3, 5, 10, 15]
const FPS_OPTIONS = [15, 20, 24, 30, 60]

interface ImageUploaderProps {
  hasImage: boolean
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
}

export function ImageUploader({ hasImage, canvasRef }: ImageUploaderProps) {
  const { handleUpload } = useImageUpload()
  const { state, dispatch } = useAppState()
  const t2 = useTranslations('effects')
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('upload')
  const tExport = useTranslations('export')
  const hasSource = hasImage || !!state.video

  const rippleLayerRef = useRef<HTMLDivElement>(null)
  const bannerContainerRef = useRef<HTMLDivElement>(null)
  const distortFilterId = 'banner-water-distort'

  // 确保 SVG filter 存在
  useEffect(() => {
    if (document.getElementById(distortFilterId)) return
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    svg.style.position = 'absolute'
    svg.innerHTML = `<filter id="${distortFilterId}">
      <feTurbulence type="turbulence" baseFrequency="0.012 0.035" numOctaves="3" seed="2" result="turb"/>
      <feDisplacementMap in="SourceGraphic" in2="turb" scale="60" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`
    document.body.appendChild(svg)
  }, [])

  const triggerRipple = useCallback((btn: HTMLElement) => {
    const layer = rippleLayerRef.current
    const container = bannerContainerRef.current
    if (!layer || !container) return
    const containerRect = container.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const cx = btnRect.left + btnRect.width / 2 - containerRect.left
    const cy = btnRect.top + btnRect.height / 2 - containerRect.top
    const maxR = Math.hypot(
      Math.max(cx, containerRect.width - cx),
      Math.max(cy, containerRect.height - cy),
    )
    const size = maxR * 2.2

    // 扭曲层：多圈扭曲副本，和涟漪同步扩散
    const img = container.querySelector('img')
    if (img) {
      const pad = 12
      const maxRadius = size / 2
      const distortWaves = [
        { delay: 0,   opacity: 1.0 },
        { delay: 200, opacity: 0.7 },
        { delay: 450, opacity: 0.4 },
      ]
      distortWaves.forEach(({ delay, opacity }) => {
        const clone = img.cloneNode() as HTMLImageElement
        const cloneCx = cx + pad
        const cloneCy = cy + pad
        Object.assign(clone.style, {
          position: 'absolute',
          top: `${-pad}px`,
          left: `${-pad}px`,
          width: `calc(100% + ${pad * 2}px)`,
          height: `calc(100% + ${pad * 2}px)`,
          objectFit: 'cover',
          borderRadius: '8px',
          filter: `url(#${distortFilterId})`,
          clipPath: `circle(0px at ${cloneCx}px ${cloneCy}px)`,
          pointerEvents: 'none',
          zIndex: '1',
          border: 'none',
        })
        container.insertBefore(clone, layer)
        setTimeout(() => {
          const anim = clone.animate([
            { clipPath: `circle(0px at ${cloneCx}px ${cloneCy}px)`, opacity },
            { clipPath: `circle(${maxRadius}px at ${cloneCx}px ${cloneCy}px)`, opacity: 0 },
          ], { duration: 3500, easing: 'cubic-bezier(0.05, 0, 0, 1)', fill: 'forwards' })
          anim.onfinish = () => clone.remove()
        }, delay)
      })
    }

    // 发 5 圈涟漪，层层递进
    const waves = [
      { delay: 0,    opacity: 0.20, fill: true },
      { delay: 200,  opacity: 0.16, fill: false },
      { delay: 450,  opacity: 0.12, fill: false },
      { delay: 750,  opacity: 0.08, fill: false },
      { delay: 1100, opacity: 0.05, fill: false },
    ]
    waves.forEach(({ delay, opacity, fill }) => {
      const ripple = document.createElement('div')
      Object.assign(ripple.style, {
        position: 'absolute',
        left: `${cx}px`,
        top: `${cy}px`,
        width: '0px',
        height: '0px',
        borderRadius: '50%',
        border: `1px solid rgba(255,255,255,${opacity})`,
        background: fill
          ? `radial-gradient(circle, rgba(255,255,255,${opacity}) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`
          : 'transparent',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      })
      layer.appendChild(ripple)
      setTimeout(() => {
        const anim = ripple.animate([
          { width: '0px', height: '0px', opacity: 1 },
          { width: `${size}px`, height: `${size}px`, opacity: 0 },
        ], { duration: 3500, easing: 'cubic-bezier(0.05, 0, 0, 1)', fill: 'forwards' })
        anim.onfinish = () => ripple.remove()
      }, delay)
    })
  }, [])

  const [exportFormat, setExportFormat] = useState<ExportFormat>('PNG')
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  // Animation export settings
  const [animDuration, setAnimDuration] = useState(5)
  const [animFps, setAnimFps] = useState(30)
  const [showAnimSettings, setShowAnimSettings] = useState<AnimFormat | null>(null)

  const isAnimating = (
    state.activeEffect === 'glitch' && (
      state.glitchParams.rgbSplitDirectionAnim ||
      state.glitchParams.displacement > 0 ||
      state.glitchParams.verticalSpeed > 0
    )
  ) || (
    state.activeEffect === 'ascii' && state.asciiParams.animated
  )

  const hasVideo = !!state.video
  const canExportAnim = isAnimating || hasVideo
  const canExportMP4 = canExportAnim && typeof VideoEncoder !== 'undefined'

  const tabs: { id: EffectType; label: string }[] = [
    { id: 'ascii', label: t2('ascii') },
    { id: 'glitch', label: t2('glitch') },
    { id: 'other', label: t2('other') },
  ]
  const tabBtnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [tabIndicator, setTabIndicator] = useState({ left: 2, width: 0 })

  useEffect(() => {
    const idx = tabs.findIndex(tab => tab.id === state.activeEffect)
    const btn = tabBtnRefs.current[idx]
    if (btn) {
      setTabIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
    }
  }, [state.activeEffect, state.locale])

  const onFile = useCallback(async (file: File) => {
    setError(null)
    try {
      await handleUpload(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }, [handleUpload])

  const onClickUpload = useCallback(() => fileInputRef.current?.click(), [])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }, [onFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }, [onFile])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setDragging(false), [])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0]
      if (file) onFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onFile])

  const makeRenderFrame = useCallback(() => {
    const source = state.video || state.image
    if (!source) return null

    const { width: rawW, height: rawH } = getDisplaySize(source)
    // Ensure even dimensions for H.264 encoder compatibility
    const width = rawW % 2 === 0 ? rawW : rawW + 1
    const height = rawH % 2 === 0 ? rawH : rawH + 1

    // Use offscreen canvas to avoid conflicts with the animation loop on the display canvas
    const offscreen = document.createElement('canvas')
    offscreen.width = width
    offscreen.height = height
    const offCtx = offscreen.getContext('2d', { alpha: false })
    if (!offCtx) return null

    const renderFrame = (frameIndex: number) => {
      if (state.activeEffect === 'glitch') {
        renderGlitch(offCtx, source, state.glitchParams, width, height, frameIndex)
      } else if (state.activeEffect === 'ascii') {
        renderAscii(offCtx, source, state.asciiParams, width, height, frameIndex)
      } else {
        offCtx.clearRect(0, 0, width, height)
        offCtx.drawImage(source, 0, 0, width, height)
      }
    }

    return { canvas: offscreen, renderFrame }
  }, [state])

  const doExport = useCallback(async (fmt: ExportFormat) => {
    if (!canvasRef?.current || !hasSource) return
    setExporting(true)
    setShowExportMenu(false)
    setShowAnimSettings(null)
    setExportProgress(0)
    const filename = 'nano-design-export'
    const canvas = canvasRef.current

    try {
      switch (fmt) {
        case 'PNG': await exportPNG(canvas, filename); break
        case 'JPEG': await exportJPEG(canvas, filename); break
        case 'SVG': await exportSVG(canvas, filename); break
        case 'PDF': await exportPDF(canvas, filename); break
        case 'GIF': {
          const result = makeRenderFrame()
          if (!result) break
          const totalFrames = Math.round(animDuration * animFps)
          await exportGIF(result.canvas, result.renderFrame, {
            frames: totalFrames,
            delay: Math.round(1000 / animFps),
            filename,
          })
          break
        }
        case 'MP4': {
          if (hasVideo && state.video) {
            const result = makeRenderFrame()
            if (!result) break
            await exportVideoMP4(result.canvas, state.video, () => result.renderFrame(0), {
              fps: animFps,
              filename,
              onProgress: setExportProgress,
            })
          } else {
            const result = makeRenderFrame()
            if (!result) break
            await exportMP4(result.canvas, result.renderFrame, {
              duration: animDuration,
              fps: animFps,
              filename,
              onProgress: setExportProgress,
            })
          }
          break
        }
      }
    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : 'Export failed')
    }

    setExporting(false)
    setExportProgress(0)
  }, [canvasRef, hasSource, makeRenderFrame, animDuration, animFps, hasVideo, state.video])

  const onFormatClick = useCallback((fmt: ExportFormat) => {
    setExportFormat(fmt)
    if (fmt === 'GIF' || fmt === 'MP4') {
      setShowAnimSettings(fmt)
    } else {
      doExport(fmt)
    }
  }, [doExport])

  const menuBtnStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    transition: 'background-color 0.15s',
  }

  const disabledBtnStyle: React.CSSProperties = {
    ...menuBtnStyle,
    opacity: 0.35,
    cursor: 'not-allowed',
  }

  const formats: { fmt: ExportFormat; enabled: boolean }[] = [
    { fmt: 'PNG', enabled: true },
    { fmt: 'JPEG', enabled: true },
    { fmt: 'SVG', enabled: true },
    { fmt: 'PDF', enabled: true },
    { fmt: 'GIF', enabled: canExportAnim },
    { fmt: 'MP4', enabled: canExportMP4 },
  ]

  return (
    <div
      className="space-y-2"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={dragging ? { outline: '2px dashed var(--color-text-muted)', outlineOffset: -2, borderRadius: 8 } : undefined}
    >
      {/* Preview banner */}
      <div ref={bannerContainerRef} style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
        <img
          src={state.activeEffect === 'ascii' ? '/preview-banner-ascii.png' : '/preview-banner.png'}
          alt="Preview"
          style={{
            width: '100%',
            display: 'block',
            objectFit: 'cover',
            border: '1px solid var(--color-border-group)',
            borderRadius: '8px',
            transition: 'opacity 0.3s ease',
          }}
        />
        {/* Ripple layer */}
        <div
          ref={rippleLayerRef}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            borderRadius: '8px',
          }}
        />
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_LOCALE', payload: state.locale === 'en' ? 'zh' : 'en' })}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            transition: 'color 0.2s, background-color 0.2s, box-shadow 0.2s',
            backdropFilter: 'blur(16px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
            boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)'
            e.currentTarget.style.boxShadow = 'inset 0 0.5px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.25)'
            triggerRipple(e.currentTarget)
            playSound('Bottle')
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.boxShadow = 'inset 0 0.5px 0 rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.2)'
          }}
        >
          <Settings style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* Effect tabs */}
      <nav style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'var(--color-bg-elevated)',
        borderRadius: 8,
        padding: 2,
        border: '1px solid var(--color-border-group)',
      }}>
        <div style={{
          position: 'absolute',
          top: 2,
          left: tabIndicator.left,
          width: tabIndicator.width,
          height: 'calc(100% - 4px)',
          borderRadius: 6,
          backgroundColor: 'var(--color-tab-indicator)',
          boxShadow: 'var(--color-tab-indicator-shadow)',
          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
        }} />
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={el => { tabBtnRefs.current[i] = el }}
            onClick={() => { dispatch({ type: 'SET_EFFECT', payload: tab.id }); playSound('Frog') }}
            style={{
              flex: 1,
              position: 'relative',
              zIndex: 1,
              padding: '6px 0',
              fontSize: 14,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              backgroundColor: 'transparent',
              color: state.activeEffect === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              transition: 'color 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {/* Upload button */}
        <button
          onClick={onClickUpload}
          style={{
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '0 12px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-group)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)')}
        >
          <ImageIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{t('title')}</span>
        </button>

        {/* Export button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { if (hasSource && !exporting) setShowExportMenu(v => !v) }}
            disabled={!hasSource || exporting}
            style={{
              width: '100%',
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 12px',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-group)',
              borderRadius: '8px',
              cursor: !hasSource || exporting ? 'not-allowed' : 'pointer',
              opacity: !hasSource || exporting ? 0.4 : 1,
              transition: 'background-color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { if (hasSource) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)' }}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)')}
          >
            <Download style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{exporting ? tExport('processing') : tExport('button')}</span>
          </button>

          {showExportMenu && !showAnimSettings && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowExportMenu(false)} />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 20,
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-group)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '8px' }}>
                  {formats.map(({ fmt, enabled }) => (
                    <button
                      key={fmt}
                      onClick={() => enabled && onFormatClick(fmt)}
                      disabled={!enabled}
                      style={enabled ? menuBtnStyle : disabledBtnStyle}
                      onMouseEnter={e => { if (enabled) e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)' }}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>{fmt}</span>
                      {exportFormat === fmt && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#60a5fa', flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Animation export settings panel */}
          {showAnimSettings && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => { setShowAnimSettings(null); setShowExportMenu(false) }} />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 20,
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-group)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                padding: '12px',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                  {showAnimSettings} {tExport('title')}
                </div>

                {/* Duration - hide for video MP4 (uses video's own duration) */}
                {!(showAnimSettings === 'MP4' && hasVideo) && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      {tExport('duration')}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {DURATION_OPTIONS.map(d => (
                        <button
                          key={d}
                          onClick={() => setAnimDuration(d)}
                          style={{
                            flex: 1,
                            padding: '4px 0',
                            fontSize: 12,
                            border: '1px solid var(--color-border-group)',
                            borderRadius: 6,
                            cursor: 'pointer',
                            backgroundColor: animDuration === d ? 'var(--color-tab-indicator)' : 'transparent',
                            color: animDuration === d ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* FPS */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                    {tExport('frameRate')}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {FPS_OPTIONS.map(f => (
                      <button
                        key={f}
                        onClick={() => setAnimFps(f)}
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          fontSize: 12,
                          border: '1px solid var(--color-border-group)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          backgroundColor: animFps === f ? 'var(--color-tab-indicator)' : 'transparent',
                          color: animFps === f ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start button */}
                <button
                  onClick={() => doExport(showAnimSettings)}
                  style={{
                    width: '100%',
                    padding: '8px 0',
                    fontSize: 13,
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2563eb')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                >
                  {tExport('startExport')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {exporting && exportProgress > 0 && (
        <div style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: 'var(--color-border-group)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.round(exportProgress * 100)}%`,
            backgroundColor: '#3b82f6',
            borderRadius: 2,
            transition: 'width 0.1s',
          }} />
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: '#f87171', paddingLeft: 4 }}>{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  )
}
