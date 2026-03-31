'use client'

import { useRef } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NavRail } from '@/components/layout/NavRail'
import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas'
import { useAppState } from '@/hooks/useEffectParams'
import { useTranslations } from 'next-intl'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state } = useAppState()
  const t = useTranslations('about')

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden relative">
          {state.showAbout ? (
            <div style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--color-bg-canvas)',
            }}>
              <div style={{
                maxWidth: 520,
                width: '100%',
                padding: '0 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                }}>
                  <img
                    src="/avatar.png"
                    alt="Avatar"
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 14,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <h1 style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      margin: 0,
                    }}>
                      {t('title')}
                    </h1>
                    <p style={{
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: 'var(--color-text-muted)',
                      margin: 0,
                    }}>
                      {t('description')}
                    </p>
                  </div>
                </div>
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    textAlign: 'left',
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--color-border)',
                      paddingBottom: 8,
                    }}>
                      <span>{t('stack')}</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>Next.js + TypeScript</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--color-border)',
                      paddingBottom: 8,
                    }}>
                      <span>小红书</span>
                      <a href="https://xhslink.com/m/3Mg38eA7dVe" target="_blank" rel="noopener noreferrer" style={{
                        color: 'var(--color-text-primary)',
                        textDecoration: 'none',
                        transition: 'color 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                      >
                        万有引力AI
                      </a>
                    </div>
                  </div>
              </div>
            </div>
          ) : (
            <InfiniteCanvas canvasRef={canvasRef} />
          )}
        </main>
        {!state.showAbout && <Sidebar canvasRef={canvasRef} />}
        <NavRail />
      </div>
    </div>
  )
}
