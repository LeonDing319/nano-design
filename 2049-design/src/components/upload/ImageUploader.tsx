'use client'

import { useCallback, useRef, useState } from 'react'
import { ImageIcon, Download, Sun, Moon } from 'lucide-react'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useTranslations } from 'next-intl'
import { exportPNG, exportJPEG, exportSVG, exportPDF } from '@/engines/exporter'
import { useAppState } from '@/hooks/useEffectParams'

type ExportFormat = 'PNG' | 'JPEG' | 'SVG' | 'PDF'
type ExportScale = '0.5x' | '1x' | '2x' | '3x' | '4x'

const SCALE_VALUES: Record<ExportScale, number> = {
  '0.5x': 0.5, '1x': 1, '2x': 2, '3x': 3, '4x': 4,
}

interface ImageUploaderProps {
  hasImage: boolean
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
}

export function ImageUploader({ hasImage, canvasRef }: ImageUploaderProps) {
  const { handleUpload } = useImageUpload()
  const { state, dispatch } = useAppState()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('upload')
  const tExport = useTranslations('export')

  const [exportFormat, setExportFormat] = useState<ExportFormat>('PNG')
  const [exportScale, setExportScale] = useState<ExportScale>('1x')
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const isDark = state.theme === 'dark'

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

  const doExport = useCallback(async (fmt: ExportFormat) => {
    if (!canvasRef?.current || !hasImage) return
    setExporting(true)
    setShowExportMenu(false)
    const scale = SCALE_VALUES[exportScale]
    const filename = '2049-design-export'
    const canvas = canvasRef.current
    switch (fmt) {
      case 'PNG': await exportPNG(canvas, filename, scale); break
      case 'JPEG': await exportJPEG(canvas, filename, scale); break
      case 'SVG': await exportSVG(canvas, filename, scale); break
      case 'PDF': await exportPDF(canvas, filename, scale); break
    }
    setExporting(false)
  }, [canvasRef, hasImage, exportScale])

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', payload: isDark ? 'light' : 'dark' })
  }, [dispatch, isDark])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Upload button */}
        <button
          onClick={onClickUpload}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 12px',
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
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
        <div style={{ position: 'relative', flex: 1 }}>
          <button
            onClick={() => { if (hasImage && !exporting) setShowExportMenu(v => !v) }}
            disabled={!hasImage || exporting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              cursor: !hasImage || exporting ? 'not-allowed' : 'pointer',
              opacity: !hasImage || exporting ? 0.4 : 1,
              transition: 'background-color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { if (hasImage) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)' }}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)')}
          >
            <Download style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{exporting ? tExport('processing') : tExport('button')}</span>
          </button>

          {showExportMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowExportMenu(false)} />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 20,
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                overflow: 'hidden',
              }}>
                {/* Scale row */}
                <div style={{ padding: '12px 12px 8px' }}>
                  <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Scale</p>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(Object.keys(SCALE_VALUES) as ExportScale[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setExportScale(s)}
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                          backgroundColor: exportScale === s ? 'var(--color-bg-hover)' : 'transparent',
                          color: exportScale === s ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-faint)', margin: '0 12px' }} />

                {/* Format list */}
                <div style={{ padding: '8px' }}>
                  {(['PNG', 'JPEG', 'SVG', 'PDF'] as ExportFormat[]).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => { setExportFormat(fmt); doExport(fmt) }}
                      style={{
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
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)')}
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
        </div>

        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-theme-toggle-bg)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'background-color 0.2s, transform 0.2s',
            color: 'var(--color-theme-toggle-icon)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--color-theme-toggle-hover)'
            e.currentTarget.style.transform = 'scale(1.08)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'var(--color-theme-toggle-bg)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {isDark
            ? <Sun style={{ width: 16, height: 16 }} />
            : <Moon style={{ width: 16, height: 16 }} />
          }
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: '#f87171', paddingLeft: 4 }}>{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  )
}
