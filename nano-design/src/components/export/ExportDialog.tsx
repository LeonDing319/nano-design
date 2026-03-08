'use client'

import { useState, useCallback } from 'react'
import { X, Image, Film, Code, FileCode } from 'lucide-react'
import { useAppState } from '@/hooks/useEffectParams'
import { exportPNG, exportGIF, generateHTMLCode, generateCanvasCode, copyToClipboard } from '@/engines/exporter'
import { renderGlitch } from '@/engines/glitch'
import { useTranslations } from 'next-intl'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function ExportDialog({ open, onClose, canvasRef }: ExportDialogProps) {
  const { state } = useAppState()
  const [codeContent, setCodeContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [processing, setProcessing] = useState(false)
  const t = useTranslations('export')

  const handleExportPNG = useCallback(async () => {
    if (!canvasRef.current) return
    setProcessing(true)
    await exportPNG(canvasRef.current, 'nano-design-export')
    setProcessing(false)
  }, [canvasRef])

  const handleExportGIF = useCallback(async () => {
    if (!canvasRef.current || !state.image) return
    setProcessing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    await exportGIF(
      canvas,
      (frameIndex) => {
        renderGlitch(ctx, state.image!, state.glitchParams, canvas.width, canvas.height, frameIndex)
      },
      { frames: 30, delay: 100, filename: 'nano-design-export' }
    )
    setProcessing(false)
  }, [canvasRef, state])

  const handleExportHTML = useCallback(() => {
    const params = state.activeEffect === 'glitch' ? state.glitchParams : state.asciiParams
    const code = generateHTMLCode(state.activeEffect, params)
    setCodeContent(code)
  }, [state])

  const handleExportCanvasCode = useCallback(() => {
    const params = state.activeEffect === 'glitch' ? state.glitchParams : state.asciiParams
    const code = generateCanvasCode(state.activeEffect, params)
    setCodeContent(code)
  }, [state])

  const handleCopy = useCallback(async () => {
    if (!codeContent) return
    await copyToClipboard(codeContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [codeContent])

  if (!open) return null

  const isGlitchAnimation = state.activeEffect === 'glitch' && state.glitchParams.animation

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-neutral-800">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100">{t('title')}</h2>
          <button onClick={() => { onClose(); setCodeContent(null) }} className="p-1 text-neutral-500 hover:text-neutral-300 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {codeContent ? (
          <div className="p-4">
            <pre className="bg-neutral-800 rounded-lg p-4 text-xs overflow-auto max-h-80 font-mono text-neutral-300">
              {codeContent}
            </pre>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCopy} className="flex-1 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                {copied ? t('copied') : t('copy')}
              </button>
              <button onClick={() => setCodeContent(null)} className="px-4 py-2 text-sm text-neutral-400 border border-neutral-700 rounded-lg hover:bg-neutral-800">
                {t('close')}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 gap-3">
            <button onClick={handleExportPNG} disabled={processing} className="flex flex-col items-center gap-2 p-4 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40">
              <Image className="w-6 h-6 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-100">{t('png')}</span>
              <span className="text-xs text-neutral-500">{t('pngDesc')}</span>
            </button>

            <button onClick={handleExportGIF} disabled={processing || !isGlitchAnimation} className="flex flex-col items-center gap-2 p-4 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40">
              <Film className="w-6 h-6 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-100">{t('gif')}</span>
              <span className="text-xs text-neutral-500">{t('gifDesc')}</span>
            </button>

            <button onClick={handleExportHTML} disabled={processing} className="flex flex-col items-center gap-2 p-4 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40">
              <Code className="w-6 h-6 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-100">{t('html')}</span>
              <span className="text-xs text-neutral-500">{t('htmlDesc')}</span>
            </button>

            <button onClick={handleExportCanvasCode} disabled={processing} className="flex flex-col items-center gap-2 p-4 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40">
              <FileCode className="w-6 h-6 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-100">{t('canvasCode')}</span>
              <span className="text-xs text-neutral-500">{t('canvasCodeDesc')}</span>
            </button>

            {processing && (
              <div className="col-span-2 text-center text-sm text-neutral-400 py-2">
                {t('processing')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
