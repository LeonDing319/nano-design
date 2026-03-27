'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Bookmark } from 'lucide-react'
import { getSavedDesigns, deleteDesign, renameDesign, type SavedDesign } from '@/lib/saved-designs'
import { useAppState } from '@/hooks/useEffectParams'
import { useTranslations } from 'next-intl'
import { EffectType } from '@/types'

function timeAgo(ts: number, t: ReturnType<typeof useTranslations>): string {
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return t('justNow')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t('minutesAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  return t('daysAgo', { n: days })
}

function DesignName({ design, onRename }: { design: SavedDesign; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  if (editing) {
    return (
      <input
        ref={inputRef}
        defaultValue={design.name}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--color-border-group)',
          outline: 'none',
          fontSize: 11,
          color: 'var(--color-text-primary)',
          width: '100%',
          padding: '0 2px',
        }}
        onBlur={(e) => {
          const val = e.target.value.trim()
          if (val && val !== design.name) onRename(val)
          setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') setEditing(false)
        }}
        autoFocus
      />
    )
  }

  return (
    <span
      title="Click to rename"
      onClick={(e) => { e.stopPropagation(); setEditing(true) }}
      style={{
        fontSize: 11,
        color: 'var(--color-text-primary)',
        cursor: 'text',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        display: 'block',
      }}
    >
      {design.name}
    </span>
  )
}

const EFFECT_LABELS: Record<EffectType, { zh: string; en: string }> = {
  ascii: { zh: 'ASCII', en: 'ASCII' },
  glitch: { zh: '故障艺术', en: 'Glitch' },
  marble: { zh: '液态', en: 'Marble' },
  other: { zh: '其他效果', en: 'Other' },
}

interface SavedDesignsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SavedDesignsPanel({ open, onOpenChange }: SavedDesignsPanelProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const [filter, setFilter] = useState<EffectType | null>(null)
  const { state, dispatch } = useAppState()
  const t = useTranslations('saved')
  const locale = state.locale

  const loadDesigns = () => {
    getSavedDesigns().then(setDesigns)
  }

  useEffect(() => {
    if (open) loadDesigns()
  }, [open])

  useEffect(() => {
    const handler = () => { if (open) loadDesigns() }
    window.addEventListener('nano:designs-changed', handler)
    return () => window.removeEventListener('nano:designs-changed', handler)
  }, [open])

  const filtered = filter ? designs.filter((d) => d.effectType === filter) : designs
  const effectIds = [...new Set(designs.map((d) => d.effectType))] as EffectType[]

  const handleLoad = (design: SavedDesign) => {
    dispatch({ type: 'SET_EFFECT', payload: design.effectType })
    dispatch({ type: 'SET_GLITCH_PRESET', payload: design.glitchParams })
    dispatch({ type: 'SET_ASCII_PRESET', payload: design.asciiParams })
    onOpenChange(false)
  }

  const handleDelete = async (id: string) => {
    await deleteDesign(id)
    setDesigns((prev) => prev.filter((d) => d.id !== id))
  }

  const handleRename = async (id: string, name: string) => {
    await renameDesign(id, name)
    setDesigns((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)))
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 56,
          bottom: 0,
          width: 320,
          zIndex: 50,
          backgroundColor: 'var(--color-bg-primary)',
          borderLeft: '1px solid var(--color-border-faint)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid var(--color-border-faint)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bookmark style={{ width: 15, height: 15, color: 'var(--color-text-muted)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {t('title')}
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Filter pills */}
        {effectIds.length > 1 && (
          <div style={{
            display: 'flex',
            gap: 6,
            padding: '10px 16px',
            borderBottom: '1px solid var(--color-border-faint)',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setFilter(null)}
              style={{
                padding: '3px 10px',
                fontSize: 11,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: filter === null ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: filter === null ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              }}
            >
              All
            </button>
            {effectIds.map((id) => (
              <button
                key={id}
                onClick={() => setFilter(filter === id ? null : id)}
                style={{
                  padding: '3px 10px',
                  fontSize: 11,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  backgroundColor: filter === id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: filter === id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
              >
                {locale === 'zh' ? EFFECT_LABELS[id].zh : EFFECT_LABELS[id].en}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {filtered.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              gap: 8,
            }}>
              <Bookmark style={{ width: 28, height: 28, color: 'var(--color-text-muted)', opacity: 0.4 }} />
              <span style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
              }}>
                {designs.length === 0 ? t('empty') : t('emptyFilter')}
              </span>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              {filtered.map((design) => (
                <div
                  key={design.id}
                  className="group"
                  onClick={() => handleLoad(design)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-faint)',
                    transition: 'border-color 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border-faint)')}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', aspectRatio: '1' }}>
                    <img
                      src={design.thumbnail}
                      alt={design.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(design.id) }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 5,
                        border: 'none',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'opacity 0.15s, color 0.15s',
                      }}
                      className="delete-btn"
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                    >
                      <X style={{ width: 10, height: 10 }} />
                    </button>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '6px 8px', backgroundColor: 'var(--color-bg-primary)' }}>
                    <DesignName design={design} onRename={(name) => handleRename(design.id, name)} />
                    <span style={{
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                      marginTop: 2,
                      display: 'block',
                    }}>
                      {locale === 'zh' ? EFFECT_LABELS[design.effectType].zh : EFFECT_LABELS[design.effectType].en}
                      {' · '}
                      {timeAgo(design.createdAt, t)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .group:hover .delete-btn { opacity: 1 !important; }
      `}</style>
    </>
  )
}
