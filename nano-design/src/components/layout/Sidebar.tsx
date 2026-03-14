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
import { AlignJustify, Shuffle, Layers, LayoutGrid, Move, ArrowDownUp, Palette } from 'lucide-react'

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
              label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LayoutGrid style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('presets')}</span>}
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
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shuffle style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('displacement')}</span>}
                value={state.glitchParams.displacement} min={0} max={20} onChange={(v) => setGlitch('displacement', v)} disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><AlignJustify style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('stripeDensity')}</span>}
                value={state.glitchParams.stripeDensity} min={0} max={50} onChange={(v) => setGlitch('stripeDensity', v)} disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ArrowDownUp style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('verticalSpeed')}</span>}
                value={state.glitchParams.verticalSpeed} min={0} max={20} onChange={(v) => setGlitch('verticalSpeed', v)} disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Layers style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('rgbSplit')}</span>}
                value={state.glitchParams.rgbSplit} min={0} max={25} onChange={(v) => setGlitch('rgbSplit', v)} disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Move style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('rgbSplitDirection')}</span>}
                value={state.glitchParams.rgbSplitDirection} min={0} max={360} onChange={(v) => setGlitch('rgbSplitDirection', v)}
                disabled={disabled || state.glitchParams.rgbSplit === 0 || state.glitchParams.rgbSplitDirectionAnim}
                sound="mech5"
                suffix={
                  <button
                    type="button"
                    onClick={() => setGlitch('rgbSplitDirectionAnim', !state.glitchParams.rgbSplitDirectionAnim)}
                    disabled={disabled || state.glitchParams.rgbSplit === 0}
                    className={`px-2 py-0.5 text-xs rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      state.glitchParams.rgbSplitDirectionAnim
                        ? 'text-blue-500 border-blue-500 bg-blue-500/15'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    {t('auto')}
                  </button>
                }
              />
            </div>

            <div className="space-y-3">
              <Toggle
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Palette style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('duotone')}</span>}
                checked={state.glitchParams.duotone}
                onChange={(v) => setGlitch('duotone', v)}
                disabled={disabled}
              />
              {state.glitchParams.duotone && (
                <div className="flex items-center gap-3" style={{ opacity: disabled ? 0.4 : 1 }}>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-300">
                    {t('duotoneLightColor')}
                    <input
                      type="color"
                      value={state.glitchParams.duotoneLightColor}
                      onChange={(e) => setGlitch('duotoneLightColor', e.target.value)}
                      disabled={disabled}
                      className="color-swatch"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-300">
                    {t('duotoneDarkColor')}
                    <input
                      type="color"
                      value={state.glitchParams.duotoneDarkColor}
                      onChange={(e) => setGlitch('duotoneDarkColor', e.target.value)}
                      disabled={disabled}
                      className="color-swatch"
                    />
                  </label>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <PresetPicker
              label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LayoutGrid style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('presets')}</span>}
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
