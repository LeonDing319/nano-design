'use client'

import { useState } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { ImageUploader } from '@/components/upload/ImageUploader'
import { Slider } from '@/components/controls/Slider'
import { Select } from '@/components/controls/Select'
import { Toggle } from '@/components/controls/Toggle'
import { ColorPicker } from '@/components/controls/ColorPicker'
import { PresetPicker } from '@/components/controls/PresetPicker'
import { GLITCH_PRESETS, DEFAULT_GLITCH_PARAMS } from '@/presets/glitch-presets'
import { ASCII_PRESETS, DEFAULT_ASCII_PARAMS } from '@/presets/ascii-presets'
import { GlitchParams, AsciiParams } from '@/types'
import { useTranslations } from 'next-intl'

interface SidebarProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function Sidebar({ canvasRef }: SidebarProps) {
  const { state, dispatch } = useAppState()
  const [activePresetId, setActivePresetId] = useState<string>(GLITCH_PRESETS[0].id)
  const t = useTranslations('params')
  const hasImage = !!state.image
  const disabled = !hasImage

  const setGlitch = (key: keyof GlitchParams, value: GlitchParams[keyof GlitchParams]) => {
    dispatch({ type: 'SET_GLITCH_PARAMS', payload: { [key]: value } })
    setActivePresetId('')
  }

  const setAscii = (key: keyof AsciiParams, value: AsciiParams[keyof AsciiParams]) => {
    dispatch({ type: 'SET_ASCII_PARAMS', payload: { [key]: value } })
    setActivePresetId('')
  }

  return (
    <aside className="w-80 h-full flex flex-col" style={{ backgroundColor: 'var(--color-bg-secondary)', borderLeft: '1px solid var(--color-border-faint)' }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <ImageUploader hasImage={hasImage} canvasRef={canvasRef} />

        {state.activeEffect === 'glitch' ? (
          <>
            <PresetPicker
              label={t('presets')}
              presets={GLITCH_PRESETS}
              activePresetId={activePresetId}
              onSelect={(params, id) => {
                if (activePresetId === id) {
                  dispatch({ type: 'SET_GLITCH_PRESET', payload: DEFAULT_GLITCH_PARAMS })
                  setActivePresetId('')
                } else {
                  dispatch({ type: 'SET_GLITCH_PRESET', payload: params })
                  setActivePresetId(id)
                }
              }}
              locale={state.locale}
              disabled={disabled}
            />

            <div className="space-y-3">
              <Slider label={t('stripeDensity')} value={state.glitchParams.stripeDensity} min={0} max={100} onChange={(v) => setGlitch('stripeDensity', v)} disabled={disabled} />
              <Slider label={t('displacement')} value={state.glitchParams.displacement} min={0} max={100} onChange={(v) => setGlitch('displacement', v)} disabled={disabled} />
              <Slider label={t('rgbSplit')} value={state.glitchParams.rgbSplit} min={0} max={50} onChange={(v) => setGlitch('rgbSplit', v)} disabled={disabled} />

              <Slider
                label={t('randomSeed')}
                value={state.glitchParams.randomSeed}
                min={0}
                max={50}
                onChange={(v) => setGlitch('randomSeed', v)}
                disabled={disabled}
                suffix={
                  <button
                    onClick={() => setGlitch('randomSeed', Math.floor(Math.random() * 51))}
                    disabled={disabled}
                    className="px-2 py-0.5 text-xs text-neutral-300 bg-neutral-700 rounded hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {t('randomize')}
                  </button>
                }
              />

              <Toggle label={t('animation')} checked={state.glitchParams.animation} onChange={(v) => setGlitch('animation', v)} disabled={disabled} />
              <Slider label={t('animationSpeed')} value={state.glitchParams.animationSpeed} min={1} max={10} onChange={(v) => setGlitch('animationSpeed', v)} disabled={disabled || !state.glitchParams.animation} />
            </div>
          </>
        ) : (
          <>
            <PresetPicker
              label={t('presets')}
              presets={ASCII_PRESETS}
              activePresetId={activePresetId}
              onSelect={(params, id) => {
                if (activePresetId === id) {
                  dispatch({ type: 'SET_ASCII_PRESET', payload: DEFAULT_ASCII_PARAMS })
                  setActivePresetId('')
                } else {
                  dispatch({ type: 'SET_ASCII_PRESET', payload: params })
                  setActivePresetId(id)
                }
              }}
              locale={state.locale}
              disabled={disabled}
            />

            <div className="space-y-3">
              <Slider label={t('charDensity')} value={state.asciiParams.charDensity} min={1} max={100} onChange={(v) => setAscii('charDensity', v)} disabled={disabled} />

              <Select
                label={t('charSet')}
                value={state.asciiParams.charSet}
                options={[
                  { value: 'standard', label: t('charSetOptions.standard') },
                  { value: 'minimal', label: t('charSetOptions.minimal') },
                  { value: 'blocks', label: t('charSetOptions.blocks') },
                  { value: 'custom', label: t('charSetOptions.custom') },
                ]}
                onChange={(v) => setAscii('charSet', v)}
                disabled={disabled}
              />

              <Slider label={t('fontSize')} value={state.asciiParams.fontSize} min={4} max={24} onChange={(v) => setAscii('fontSize', v)} disabled={disabled} />

              <Select
                label={t('colorMode')}
                value={state.asciiParams.colorMode}
                options={[
                  { value: 'bw', label: t('colorModeOptions.bw') },
                  { value: 'color', label: t('colorModeOptions.color') },
                  { value: 'mono', label: t('colorModeOptions.mono') },
                ]}
                onChange={(v) => setAscii('colorMode', v)}
                disabled={disabled}
              />

              {state.asciiParams.colorMode === 'mono' && (
                <ColorPicker label={t('colorMode')} value={state.asciiParams.monoColor || '#00FF00'} onChange={(v) => setAscii('monoColor', v)} disabled={disabled} />
              )}

              <ColorPicker label={t('bgColor')} value={state.asciiParams.bgColor} onChange={(v) => setAscii('bgColor', v)} disabled={disabled} />

              <Toggle label={t('invert')} checked={state.asciiParams.invert} onChange={(v) => setAscii('invert', v)} disabled={disabled} />
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
