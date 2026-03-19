'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { ImageIcon, Download } from 'lucide-react'
import { useImageUpload, ACCEPT_STRING } from '@/hooks/useImageUpload'
import { useTranslations } from 'next-intl'
import { exportPNG, exportJPEG, exportSVG, exportPDF, exportGIF, exportMP4, exportVideoMP4 } from '@/engines/exporter'
import { renderGlitch } from '@/engines/glitch'
import { renderAscii } from '@/engines/ascii'
import { useAppState } from '@/hooks/useEffectParams'
import { EffectType } from '@/types'
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
    { id: 'glitch', label: t2('glitch') },
    { id: 'ascii', label: t2('ascii') },
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
    const canvas = canvasRef?.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const source = state.video || state.image
    if (!source) return null

    const { width, height } = getDisplaySize(source)

    return (frameIndex: number) => {
      if (state.activeEffect === 'glitch') {
        renderGlitch(ctx, source, state.glitchParams, width, height, frameIndex)
      } else if (state.activeEffect === 'ascii') {
        renderAscii(ctx, source, state.asciiParams, width, height, frameIndex)
      } else {
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(source, 0, 0, width, height)
      }
    }
  }, [canvasRef, state])

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
          const renderFrame = makeRenderFrame()
          if (!renderFrame) break
          const totalFrames = Math.round(animDuration * animFps)
          await exportGIF(canvas, renderFrame, {
            frames: totalFrames,
            delay: Math.round(1000 / animFps),
            filename,
          })
          break
        }
        case 'MP4': {
          if (hasVideo && state.video) {
            const renderFrame = makeRenderFrame()
            if (!renderFrame) break
            await exportVideoMP4(canvas, state.video, () => renderFrame(0), {
              fps: animFps,
              filename,
              onProgress: setExportProgress,
            })
          } else {
            const renderFrame = makeRenderFrame()
            if (!renderFrame) break
            await exportMP4(canvas, renderFrame, {
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
      <img
        src={state.activeEffect === 'ascii' ? '/preview-banner-ascii.png' : '/preview-banner.png'}
        alt="Preview"
        style={{
          width: '100%',
          display: 'block',
          borderRadius: '8px',
          objectFit: 'cover',
          border: '1px solid var(--color-border-group)',
          transition: 'opacity 0.3s ease',
        }}
      />

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
            onClick={() => dispatch({ type: 'SET_EFFECT', payload: tab.id })}
            style={{
              flex: 1,
              position: 'relative',
              zIndex: 1,
              padding: '6px 0',
              fontSize: 13,
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
