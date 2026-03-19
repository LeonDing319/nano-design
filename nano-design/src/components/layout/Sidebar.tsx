'use client'

import { useState } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { ImageUploader } from '@/components/upload/ImageUploader'
import { Slider } from '@/components/controls/Slider'
import { Toggle } from '@/components/controls/Toggle'
import { PresetPicker } from '@/components/controls/PresetPicker'
import { GLITCH_PRESETS, DEFAULT_GLITCH_PARAMS } from '@/presets/glitch-presets'
import { GlitchParams, AsciiParams } from '@/types'
import { Select } from '@/components/controls/Select'
import { useTranslations } from 'next-intl'
import { ControlGroup } from '@/components/controls/ControlGroup'
import { VideoControls } from '@/components/controls/VideoControls'
import { AlignJustify, Shuffle, Layers, LayoutGrid, Move, ArrowDownUp, Palette, Type, Eye, Image, Play, Sun, Contrast, Grid } from 'lucide-react'

interface SidebarProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function Sidebar({ canvasRef }: SidebarProps) {
  const { state, dispatch } = useAppState()
  const [activePresetId, setActivePresetId] = useState<string>('')
  const t = useTranslations('params')
  const hasImage = !!state.image || !!state.video
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
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <ImageUploader hasImage={hasImage} canvasRef={canvasRef} />

        {state.video && (
          <ControlGroup>
            <VideoControls video={state.video} />
          </ControlGroup>
        )}

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

            <ControlGroup>
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
            </ControlGroup>

            <ControlGroup>
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
            </ControlGroup>

            <ControlGroup>
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Move style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('dotSize')}</span>}
                value={state.glitchParams.dotSize} min={0} max={6} step={0.1}
                onChange={(v) => setGlitch('dotSize', v)}
                disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Palette style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('dotOpacity')}</span>}
                value={state.glitchParams.dotOpacity} min={0} max={0.7} step={0.01}
                onChange={(v) => setGlitch('dotOpacity', v)}
                disabled={disabled || state.glitchParams.dotSize <= 0}
                sound="mech5"
              />
            </ControlGroup>

            <ControlGroup>
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><AlignJustify style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('scanlines')}</span>}
                value={state.glitchParams.scanlineDensity} min={0} max={25}
                onChange={(v) => setGlitch('scanlineDensity', v)}
                disabled={disabled}
                sound="mech5"
              />
            </ControlGroup>

          </>
        ) : state.activeEffect === 'ascii' ? (
          <>
            <ControlGroup>
              <Select
                label={t('renderMode')}
                value={state.asciiParams.renderMode}
                options={[
                  { value: 'brightness', label: t('renderModeOptions.brightness') },
                  { value: 'edge', label: t('renderModeOptions.edge') },
                  { value: 'dots', label: t('renderModeOptions.dots') },
                ]}
                onChange={(v) => setAscii('renderMode', v)}
                disabled={disabled}
              />
              <Select
                label={t('charSet')}
                value={state.asciiParams.charSet}
                options={[
                  { value: 'standard', label: t('charSetOptions.standard') },
                  { value: 'detailed', label: t('charSetOptions.detailed') },
                  { value: 'minimal', label: t('charSetOptions.minimal') },
                  { value: 'blocks', label: t('charSetOptions.blocks') },
                  { value: 'custom', label: t('charSetOptions.custom') },
                ]}
                onChange={(v) => setAscii('charSet', v)}
                disabled={disabled}
              />
              {state.asciiParams.charSet === 'custom' && (
                <input
                  type="text"
                  value={state.asciiParams.customChars}
                  onChange={(e) => setAscii('customChars', e.target.value)}
                  disabled={disabled}
                  placeholder={t('customCharsPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 13,
                    fontFamily: '"Courier New", Courier, monospace',
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-group)',
                    borderRadius: 6,
                    outline: 'none',
                  }}
                />
              )}
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Type style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('fontSize')}</span>}
                value={state.asciiParams.fontSize} min={4} max={20}
                onChange={(v) => setAscii('fontSize', v)}
                disabled={disabled}
                sound="mech5"
              />
            </ControlGroup>

            <ControlGroup>
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Eye style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('coverage')}</span>}
                value={state.asciiParams.coverage} min={0} max={100}
                onChange={(v) => setAscii('coverage', v)}
                disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Contrast style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('edgeEmphasis')}</span>}
                value={state.asciiParams.edgeEmphasis} min={0} max={100}
                onChange={(v) => setAscii('edgeEmphasis', v)}
                disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Sun style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('darkThreshold')}</span>}
                value={state.asciiParams.darkThreshold} min={0} max={100}
                onChange={(v) => setAscii('darkThreshold', v)}
                disabled={disabled}
                sound="mech5"
              />
            </ControlGroup>

            <ControlGroup>
              <Select
                label={t('bgMode')}
                value={state.asciiParams.bgMode}
                options={[
                  { value: 'blur', label: t('bgModeOptions.blur') },
                  { value: 'solid', label: t('bgModeOptions.solid') },
                  { value: 'original', label: t('bgModeOptions.original') },
                  { value: 'transparent', label: t('bgModeOptions.transparent') },
                ]}
                onChange={(v) => setAscii('bgMode', v)}
                disabled={disabled}
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Image style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('bgBlur')}</span>}
                value={state.asciiParams.bgBlur} min={0} max={20}
                onChange={(v) => setAscii('bgBlur', v)}
                disabled={disabled || state.asciiParams.bgMode !== 'blur'}
                sound="mech5"
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Eye style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('bgOpacity')}</span>}
                value={state.asciiParams.bgOpacity} min={0} max={100}
                onChange={(v) => setAscii('bgOpacity', v)}
                disabled={disabled || state.asciiParams.bgMode === 'solid' || state.asciiParams.bgMode === 'transparent'}
                sound="mech5"
              />
            </ControlGroup>

            <ControlGroup>
              <Select
                label={t('blendMode')}
                value={state.asciiParams.blendMode}
                options={[
                  { value: 'source-over', label: t('blendModeOptions.normal') },
                  { value: 'overlay', label: t('blendModeOptions.overlay') },
                  { value: 'color-dodge', label: t('blendModeOptions.colorDodge') },
                  { value: 'screen', label: t('blendModeOptions.screen') },
                  { value: 'lighter', label: t('blendModeOptions.lighter') },
                ]}
                onChange={(v) => setAscii('blendMode', v)}
                disabled={disabled}
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Palette style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('charOpacity')}</span>}
                value={state.asciiParams.charOpacity} min={0} max={100}
                onChange={(v) => setAscii('charOpacity', v)}
                disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Sun style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('brightness')}</span>}
                value={state.asciiParams.brightness} min={-100} max={100}
                onChange={(v) => setAscii('brightness', v)}
                disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Contrast style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('contrast')}</span>}
                value={state.asciiParams.contrast} min={-100} max={100}
                onChange={(v) => setAscii('contrast', v)}
                disabled={disabled}
                sound="mech5"
              />
              <Toggle
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shuffle style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('invert')}</span>}
                checked={state.asciiParams.invert}
                onChange={(v) => setAscii('invert', v)}
                disabled={disabled}
              />
              <Toggle
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Grid style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('dotGrid')}</span>}
                checked={state.asciiParams.dotGrid}
                onChange={(v) => setAscii('dotGrid', v)}
                disabled={disabled}
              />
            </ControlGroup>

            <div className="space-y-3">
              <Toggle
                label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Play style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('animated')}</span>}
                checked={state.asciiParams.animated}
                onChange={(v) => setAscii('animated', v)}
                disabled={disabled}
              />
              {state.asciiParams.animated && (
                <ControlGroup>
                  <Slider
                    label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Play style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('animSpeed')}</span>}
                    value={state.asciiParams.animSpeed} min={500} max={5000} step={100}
                    onChange={(v) => setAscii('animSpeed', v)}
                    disabled={disabled}
                    sound="mech5"
                  />
                  <Slider
                    label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Layers style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('animIntensity')}</span>}
                    value={state.asciiParams.animIntensity} min={0} max={100}
                    onChange={(v) => setAscii('animIntensity', v)}
                    disabled={disabled}
                    sound="mech5"
                  />
                  <Slider
                    label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shuffle style={{ width: 13, height: 13, opacity: 0.7, flexShrink: 0 }} />{t('animRandomness')}</span>}
                    value={state.asciiParams.animRandomness} min={0} max={100}
                    onChange={(v) => setAscii('animRandomness', v)}
                    disabled={disabled}
                    sound="mech5"
                  />
                </ControlGroup>
              )}
            </div>
          </>
        ) : (
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
        )}

      </div>
    </aside>
  )
}
