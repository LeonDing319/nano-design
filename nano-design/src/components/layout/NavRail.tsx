'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bookmark } from 'lucide-react'
import { useAppState } from '@/hooks/useEffectParams'
import { useTranslations } from 'next-intl'
import { EffectType } from '@/types'
import { playSound } from '@/utils/sound'
import { saveDesign } from '@/lib/saved-designs'
import { SavedDesignsPanel } from '@/components/saved/SavedDesignsPanel'

type GradientColor = [string, string]

function GradientIcon({ colors, id }: { colors: GradientColor; id: string }) {
  const gradId = `grad-${id}`
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 27 27">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <rect width="27" height="27" rx="8" fill={`url(#${gradId})`} />
    </svg>
  )
}

const EFFECTS: { id: EffectType; gradient: GradientColor }[] = [
  { id: 'ascii',  gradient: ['#1a4a8a', '#70b0f0'] },
  { id: 'glitch', gradient: ['#1a4a8a', '#70b0f0'] },
  { id: 'marble', gradient: ['#1a4a8a', '#70b0f0'] },
  { id: 'flow',   gradient: ['#1a4a8a', '#70b0f0'] },
]

export function NavRail() {
  const { state, dispatch } = useAppState()
  const t = useTranslations('effects')
  const tAbout = useTranslations('nav')
  const tSaved = useTranslations('saved')
  const [showSavedPanel, setShowSavedPanel] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'duplicate'>('idle')

  const doSave = useCallback(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const sourceImg = state.image
    const dataUrl = sourceImg ? (() => {
      const tmp = document.createElement('canvas')
      tmp.width = sourceImg.naturalWidth
      tmp.height = sourceImg.naturalHeight
      tmp.getContext('2d')?.drawImage(sourceImg, 0, 0)
      return tmp.toDataURL('image/jpeg', 0.5)
    })() : undefined

    saveDesign(state.activeEffect, state.glitchParams, state.asciiParams, canvas, dataUrl).then((result) => {
      setSaveStatus(result ? 'saved' : 'duplicate')
      setTimeout(() => setSaveStatus('idle'), 1500)
      if (result) {
        playSound('BubblePop')
        window.dispatchEvent(new CustomEvent('nano:designs-changed'))
      }
    })
  }, [state])

  // S 键快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 's' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (document.activeElement as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        doSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doSave])

  return (
    <>
    <nav
      style={{
        width: 56,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        paddingTop: 12,
        paddingBottom: 12,
        borderLeft: '1px solid var(--color-border-faint)',
        backgroundColor: 'var(--color-sidebar)',
        overflowY: 'auto',
      }}
    >
        {EFFECTS.map((effect) => {
          const active = state.activeEffect === effect.id && !state.showAbout
          return (
            <button
              key={effect.id}
              onClick={() => {
                dispatch({ type: 'SET_EFFECT', payload: effect.id })
                dispatch({ type: 'SET_SHOW_ABOUT', payload: false })
                playSound('Frog')
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{
                borderRadius: 8,
                padding: 2,
                backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                boxShadow: active ? '0 0 0 1px rgba(255,255,255,0.2)' : 'none',
                filter: active ? 'none' : 'grayscale(100%) brightness(0.5)',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.filter = 'grayscale(50%) brightness(0.75)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.filter = 'grayscale(100%) brightness(0.5)'
                }}
              >
                <GradientIcon colors={effect.gradient} id={effect.id} />
              </div>
              <span style={{
                fontSize: 9,
                fontWeight: 400,
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                transition: 'color 0.15s',
                letterSpacing: 0.3,
                lineHeight: 1,
              }}>
                {t(effect.id)}
              </span>
            </button>
          )
        })}

      {/* mt-auto 把下面内容推到底部 */}
      <div style={{ marginTop: 'auto' }} />

      {/* Saved 按钮 */}
      <button
        onClick={() => { setShowSavedPanel(v => !v); playSound('Frog') }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            borderRadius: 8,
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s',
            color: saveStatus === 'saved' ? '#facc15' : 'var(--color-text-muted)',
          }}
          onMouseEnter={e => {
            if (saveStatus === 'idle') (e.currentTarget as HTMLDivElement).style.color = 'var(--color-text-secondary)'
          }}
          onMouseLeave={e => {
            if (saveStatus === 'idle') (e.currentTarget as HTMLDivElement).style.color = 'var(--color-text-muted)'
          }}
        >
          <Bookmark style={{ width: 20, height: 20, fill: saveStatus === 'saved' ? 'currentColor' : 'none' }} />
        </div>
        <span style={{
          fontSize: 9,
          fontWeight: 400,
          color: saveStatus === 'saved'
            ? '#facc15'
            : 'var(--color-text-muted)',
          transition: 'color 0.15s',
          letterSpacing: 0.3,
          lineHeight: 1,
        }}>
          {saveStatus === 'saved'
            ? tSaved('statusSaved')
            : saveStatus === 'duplicate'
            ? tSaved('statusDuplicate')
            : tAbout('saved')}
        </span>
      </button>

      {/* About 按钮，固定在底部 */}
      <button
        onClick={() => { dispatch({ type: 'SET_SHOW_ABOUT', payload: !state.showAbout }); playSound('Frog') }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{
          borderRadius: 8,
          padding: 2,
          backgroundColor: state.showAbout ? 'rgba(255,255,255,0.1)' : 'transparent',
          boxShadow: state.showAbout ? '0 0 0 1px rgba(255,255,255,0.2)' : 'none',
          transition: 'all 0.15s',
        }}>
          <img
            src="/avatar.png"
            alt="About"
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              objectFit: 'cover',
              display: 'block',
              opacity: state.showAbout ? 1 : 0.5,
              transition: 'opacity 0.15s',
            }}
          />
        </div>
        <span style={{
          fontSize: 9,
          fontWeight: 400,
          color: state.showAbout ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          transition: 'color 0.15s',
          letterSpacing: 0.3,
          lineHeight: 1,
        }}>
          {tAbout('about')}
        </span>
      </button>
    </nav>

    <SavedDesignsPanel open={showSavedPanel} onOpenChange={setShowSavedPanel} />
    </>
  )
}
