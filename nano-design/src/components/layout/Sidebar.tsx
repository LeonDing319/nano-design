'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { ImageUploader } from '@/components/upload/ImageUploader'
import { Slider } from '@/components/controls/Slider'
import { Toggle } from '@/components/controls/Toggle'
import { PresetPicker } from '@/components/controls/PresetPicker'
import { GLITCH_PRESETS, DEFAULT_GLITCH_PARAMS, randomizeGlitchParams } from '@/presets/glitch-presets'
import { DEFAULT_ASCII_PARAMS, randomizeAsciiParams } from '@/presets/ascii-presets'
import { DEFAULT_MARBLE_PARAMS, randomizeMarbleParams, randomizeMarbleColors } from '@/presets/marble-presets'
import { GlitchParams, AsciiParams, MarbleParams } from '@/types'
import { getRandomPreset, getNextPreset, getRandomShowcasePreset, ShowcasePreset } from '@/presets/showcase-presets'
import { ButtonGroup } from '@/components/controls/ButtonGroup'
import { useTranslations } from 'next-intl'
import { ControlGroup, SectionLabel } from '@/components/controls/ControlGroup'
import { VideoControls } from '@/components/controls/VideoControls'
import { AlignJustify, Shuffle, Layers, LayoutGrid, Move, ArrowDownUp, Palette, Type, Eye, Image, Play, Sun, Contrast, Grid, Waves, Dices, Lightbulb, RotateCcw, Bookmark } from 'lucide-react'
import { playSound } from '@/utils/sound'
import { saveDesign } from '@/lib/saved-designs'

interface SidebarProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function Sidebar({ canvasRef }: SidebarProps) {
  const { state, dispatch } = useAppState()
  const [activePresetId, setActivePresetId] = useState<string>('')
  const t = useTranslations('params')
  const hasImage = !!state.image || !!state.video
  const disabled = false

  const setGlitch = (key: keyof GlitchParams, value: GlitchParams[keyof GlitchParams]) => {
    dispatch({ type: 'SET_GLITCH_PARAMS', payload: { [key]: value } })
    setActivePresetId('')
  }

  const setAscii = (key: keyof AsciiParams, value: AsciiParams[keyof AsciiParams]) => {
    dispatch({ type: 'SET_ASCII_PARAMS', payload: { [key]: value } })
    setActivePresetId('')
  }

  const setMarble = (key: keyof MarbleParams, value: MarbleParams[keyof MarbleParams]) => {
    dispatch({ type: 'SET_MARBLE_PARAMS', payload: { [key]: value } })
  }

  const tActions = useTranslations('actions')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'duplicate'>('idle')
  const [lastPresetId, setLastPresetId] = useState<string | undefined>()
  const initialLoaded = useRef(false)
  const showcaseSourceEffect = useRef<EffectType | null>(null)

  const currentVideoRef = useRef(state.video)
  currentVideoRef.current = state.video

  const loadShowcasePreset = useCallback((preset: ShowcasePreset) => {
    showcaseSourceEffect.current = preset.effect

    // 清理旧视频
    const oldVideo = currentVideoRef.current
    if (oldVideo) {
      oldVideo.pause()
      oldVideo.removeAttribute('src')
      oldVideo.load()
    }

    const applyParams = () => {
      if (preset.effect) dispatch({ type: 'SET_EFFECT', payload: preset.effect })
      if (preset.asciiParams) dispatch({ type: 'SET_ASCII_PRESET', payload: preset.asciiParams })
      if (preset.glitchParams) dispatch({ type: 'SET_GLITCH_PRESET', payload: preset.glitchParams })
      if (preset.marbleParams) dispatch({ type: 'SET_MARBLE_PRESET', payload: preset.marbleParams })
      if (preset.zoom) {
        // 延迟发送，确保在 InfiniteCanvas 的 fitZoom 之后生效
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('nano:set-zoom', { detail: preset.zoom }))
        }, 100)
      }
    }

    if (preset.video) {
      const video = document.createElement('video')
      video.preload = 'auto'
      video.muted = true
      video.playsInline = true
      video.loop = true
      video.onloadeddata = () => {
        video.play()
        dispatch({ type: 'SET_VIDEO', payload: video })
        // SET_VIDEO 会重置参数，所以在下一帧恢复
        requestAnimationFrame(applyParams)
      }
      video.src = preset.video
    } else if (preset.image) {
      const img = new window.Image()
      img.onload = () => {
        dispatch({ type: 'SET_IMAGE', payload: img })
        requestAnimationFrame(applyParams)
      }
      img.src = preset.image
    }
  }, [dispatch])

  // 初始加载：随机展示一个预设
  // 初始加载：随机展示一个预设
  useEffect(() => {
    if (initialLoaded.current) return
    initialLoaded.current = true
    const preset = getRandomShowcasePreset()
    if (preset) {
      setLastPresetId(preset.id)
      loadShowcasePreset(preset)
    }
  }, [loadShowcasePreset])

  // 用户上传素材时清除预设标记
  useEffect(() => {
    const handler = () => { showcaseSourceEffect.current = null }
    window.addEventListener('nano:user-upload', handler)
    return () => window.removeEventListener('nano:user-upload', handler)
  }, [])

  // 切换效果时：预设素材只属于对应效果，切走时清除或加载目标效果预设
  const prevEffect = useRef(state.activeEffect)
  useEffect(() => {
    if (prevEffect.current === state.activeEffect) return
    prevEffect.current = state.activeEffect
    if (!showcaseSourceEffect.current) return // 用户自己上传的素材，保留
    if (showcaseSourceEffect.current === state.activeEffect) return // 切回同一效果

    // 清除旧预设素材
    if (state.video) state.video.pause()

    // 尝试加载目标效果的预设
    const preset = getRandomPreset(state.activeEffect)
    if (preset) {
      setLastPresetId(preset.id)
      loadShowcasePreset(preset)
    } else {
      showcaseSourceEffect.current = null
      dispatch({ type: 'SET_VIDEO', payload: null })
    }
  }, [state.activeEffect, state.video, dispatch, loadShowcasePreset])

  // 灵感：按顺序切换到下一个预设素材
  const handleInspire = useCallback(() => {
    const effect = state.activeEffect
    const preset = getNextPreset(effect, lastPresetId)
    if (preset) {
      setLastPresetId(preset.id)
      loadShowcasePreset(preset)
    }
    playSound('BubblePop')
  }, [state.activeEffect, lastPresetId, loadShowcasePreset])

  // 随机：在当前素材上随机生成参数
  const handleRandomize = useCallback(() => {
    const effect = state.activeEffect
    if (effect === 'marble') {
      dispatch({ type: 'SET_MARBLE_PRESET', payload: randomizeMarbleParams() })
    } else if (effect === 'ascii') {
      dispatch({ type: 'SET_ASCII_PRESET', payload: randomizeAsciiParams() })
    } else if (effect === 'glitch') {
      dispatch({ type: 'SET_GLITCH_PRESET', payload: randomizeGlitchParams() })
    }
    setActivePresetId('')
    playSound('BubblePop')
  }, [state.activeEffect, dispatch])

  const handleReset = useCallback(() => {
    const effect = state.activeEffect
    if (effect === 'ascii') dispatch({ type: 'SET_ASCII_PRESET', payload: DEFAULT_ASCII_PARAMS })
    else if (effect === 'glitch') dispatch({ type: 'SET_GLITCH_PRESET', payload: DEFAULT_GLITCH_PARAMS })
    else if (effect === 'marble') dispatch({ type: 'SET_MARBLE_PRESET', payload: DEFAULT_MARBLE_PARAMS })
    setActivePresetId('')
    playSound('BubblePop')
  }, [state.activeEffect, dispatch])

  const handleSave = useCallback(() => {
    playSound('BubblePop')
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
        window.dispatchEvent(new CustomEvent('nano:designs-changed'))
      }
    })
  }, [state])

  return (
    <aside className="w-80 h-full flex flex-col" style={{ backgroundColor: 'var(--color-sidebar)', borderLeft: '1px solid var(--color-border-faint)' }}>
      <div className="flex-shrink-0 pt-3 px-4 pb-2 space-y-2.5" style={{ borderBottom: '1px solid var(--color-border-faint)' }}>
        <ImageUploader hasImage={hasImage} canvasRef={canvasRef} />

        {state.video && (
          <ControlGroup>
            <VideoControls video={state.video} />
          </ControlGroup>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2.5 space-y-2.5">
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

            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Layers style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('sectionRgb')}</span>}>
              <Slider
                label={t('rgbSplit')}
                value={state.glitchParams.rgbSplit} min={0} max={25} onChange={(v) => setGlitch('rgbSplit', v)} disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={t('rgbSplitDirection')}
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

            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shuffle style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('sectionMotion')}</span>}>
              <Slider
                label={t('displacement')}
                value={state.glitchParams.displacement} min={0} max={20} onChange={(v) => setGlitch('displacement', v)} disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={t('stripeDensity')}
                value={state.glitchParams.stripeDensity} min={0} max={50} onChange={(v) => setGlitch('stripeDensity', v)} disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={t('verticalSpeed')}
                value={state.glitchParams.verticalSpeed} min={0} max={20} onChange={(v) => setGlitch('verticalSpeed', v)} disabled={disabled}
                sound="mech5"
              />
            </ControlGroup>

            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Grid style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('sectionDots')}</span>}>
              <Slider
                label={t('dotSize')}
                value={state.glitchParams.dotSize} min={0} max={6} step={0.1}
                onChange={(v) => setGlitch('dotSize', v)}
                disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={t('dotOpacity')}
                value={state.glitchParams.dotOpacity} min={0} max={0.7} step={0.01}
                onChange={(v) => setGlitch('dotOpacity', v)}
                disabled={disabled || state.glitchParams.dotSize <= 0}
                sound="mech5"
              />
            </ControlGroup>

            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Waves style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('sectionDamage')}</span>}>
              <Slider
                label={t('corruption')}
                value={state.glitchParams.corruption} min={0} max={100}
                onChange={(v) => setGlitch('corruption', v)}
                disabled={disabled}
                sound="mech5"
              />
              <div className="flex items-center justify-between">
                <SectionLabel>{t('scanlines')}</SectionLabel>
                <Toggle
                  checked={state.glitchParams.scanlines}
                  onChange={(v) => { setGlitch('scanlines', v); playSound('BubblePop') }}
                  disabled={disabled}
                />
              </div>
            </ControlGroup>

          </>
        ) : state.activeEffect === 'ascii' ? (
          <>
            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Type style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('sectionFont')}</span>}>
              <div className="space-y-1">
                <SectionLabel>{t('sectionStyle')}</SectionLabel>
                <ButtonGroup
                  value={state.asciiParams.charSet}
                  options={[
                    { value: 'dense', label: t('charSetOptions.dense') },
                    { value: 'classic', label: t('charSetOptions.classic') },
                    { value: 'binary', label: t('charSetOptions.binary') },
                    { value: 'minimal', label: t('charSetOptions.minimal') },
                    { value: 'retro', label: t('charSetOptions.retro') },
                    { value: 'custom', label: t('charSetOptions.custom') },
                  ]}
                  onChange={(v) => setAscii('charSet', v)}
                  disabled={disabled}
                  footer={state.asciiParams.charSet === 'custom' ? (
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
                  ) : undefined}
                />
              </div>
              <Slider
                label={t('sectionSize')}
                value={state.asciiParams.fontSize} min={6} max={28} step={2}
                onChange={(v) => setAscii('fontSize', v)}
                disabled={disabled}
                sound="mech5"
                snapTo={8}
              />
              <Slider
                label={t('sectionCoverage')}
                value={state.asciiParams.coverage} min={10} max={100}
                onChange={(v) => setAscii('coverage', v)}
                disabled={disabled}
                sound="mech5"
              />
              <Slider
                label={t('sectionEdgeEmphasis')}
                value={state.asciiParams.edgeEmphasis} min={0} max={100}
                onChange={(v) => setAscii('edgeEmphasis', v)}
                disabled={disabled}
                sound="mech5"
                snapTo={100}
              />
              <Slider
                label={t('sectionCharOpacity')}
                value={state.asciiParams.charOpacity} min={10} max={100}
                onChange={(v) => setAscii('charOpacity', v)}
                disabled={disabled}
                sound="mech5"
                snapTo={55}
              />
              <Slider
                label={t('sectionCharBrightness')}
                value={state.asciiParams.charBrightness} min={-100} max={100}
                onChange={(v) => setAscii('charBrightness', v)}
                disabled={disabled}
                sound="mech5"
                snapTo={0}
              />
              <Slider
                label={t('sectionCharContrast')}
                value={state.asciiParams.charContrast} min={-100} max={100}
                onChange={(v) => setAscii('charContrast', v)}
                disabled={disabled}
                sound="mech5"
                snapTo={0}
              />
              <div className="flex items-center justify-between">
                <SectionLabel>{t('sectionInvert')}</SectionLabel>
                <Toggle
                  checked={state.asciiParams.invert}
                  onChange={(v) => { setAscii('invert', v); playSound('BubblePop') }}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <SectionLabel>{t('sectionDotGrid')}</SectionLabel>
                <Toggle
                  checked={state.asciiParams.dotGrid}
                  onChange={(v) => { setAscii('dotGrid', v); playSound('BubblePop') }}
                  disabled={disabled}
                />
              </div>
            </ControlGroup>

            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Image style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('sectionBackground')}</span>}>
              <Slider
                label={t('sectionBlur')}
                value={state.asciiParams.bgBlur} min={0} max={80}
                onChange={(v) => setAscii('bgBlur', v)}
                disabled={disabled}
                sound="mech5"
                snapTo={14}
              />
              <Slider
                label={t('sectionOpacity')}
                value={state.asciiParams.bgOpacity} min={0} max={100}
                onChange={(v) => setAscii('bgOpacity', v)}
                disabled={disabled}
                sound="mech5"
              />
              <div className="flex items-center justify-between">
                <SectionLabel>{t('sectionColor')}</SectionLabel>
                <input
                  type="color"
                  value={state.asciiParams.bgColor}
                  onChange={(e) => setAscii('bgColor', e.target.value)}
                  disabled={disabled}
                  className="color-swatch"
                />
              </div>
            </ControlGroup>


            <ControlGroup
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Play style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('sectionAnimation')}</span>}
              suffix={<Toggle checked={state.asciiParams.animated} onChange={(v) => { setAscii('animated', v); playSound('BubblePop') }} disabled={disabled} />}
            >
              {state.asciiParams.animated && (
                <>
                  <Slider
                    label={t('sectionAnimSpeed')}
                    value={state.asciiParams.animSpeed} min={0.2} max={5} step={0.1}
                    onChange={(v) => setAscii('animSpeed', v)}
                    disabled={disabled}
                    sound="mech5"
                  />
                  <Slider
                    label={t('sectionAnimIntensity')}
                    value={state.asciiParams.animIntensity} min={10} max={100}
                    onChange={(v) => setAscii('animIntensity', v)}
                    disabled={disabled}
                    sound="mech5"
                  />
                  <Slider
                    label={t('sectionAnimRandomness')}
                    value={state.asciiParams.animRandomness} min={0} max={100}
                    onChange={(v) => setAscii('animRandomness', v)}
                    disabled={disabled}
                    sound="mech5"
                  />
                </>
              )}
            </ControlGroup>

            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Palette style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('sectionColorTint')}</span>}>
              <Slider
                label={t('sectionColorTintOpacity')}
                value={state.asciiParams.colorTintOpacity} min={0} max={100}
                onChange={(v) => setAscii('colorTintOpacity', v)}
                disabled={disabled}
                sound="mech5"
                snapTo={0}
              />
              <div className="space-y-1">
                <SectionLabel>{t('sectionColorTintBlend')}</SectionLabel>
                <ButtonGroup
                  value={state.asciiParams.colorTintBlend}
                  options={[
                    { value: 'multiply', label: t('blendModes.multiply') },
                    { value: 'overlay', label: t('blendModes.overlay') },
                    { value: 'screen', label: t('blendModes.screen') },
                    { value: 'color', label: t('blendModes.color') },
                    { value: 'hue', label: t('blendModes.hue') },
                    { value: 'saturation', label: t('blendModes.saturation') },
                    { value: 'luminosity', label: t('blendModes.luminosity') },
                    { value: 'soft-light', label: t('blendModes.soft-light') },
                    { value: 'hard-light', label: t('blendModes.hard-light') },
                    { value: 'color-burn', label: t('blendModes.color-burn') },
                    { value: 'color-dodge', label: t('blendModes.color-dodge') },
                  ]}
                  onChange={(v) => setAscii('colorTintBlend', v)}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <SectionLabel>{t('sectionColorTintColor')}</SectionLabel>
                <input
                  type="color"
                  value={state.asciiParams.colorTint}
                  onChange={(e) => setAscii('colorTint', e.target.value)}
                  disabled={disabled}
                  className="color-swatch"
                />
              </div>
            </ControlGroup>
          </>
        ) : state.activeEffect === 'marble' ? (
          <>
            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Palette style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('marble.sectionColor')}</span>}
              suffix={
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'SET_MARBLE_PARAMS', payload: randomizeMarbleColors() })
                    playSound('BubblePop')
                  }}
                  className="px-2 py-0.5 text-xs rounded-full border transition-colors bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500"
                >
                  <Dices style={{ width: 12, height: 12 }} />
                </button>
              }
            >
              <div className="flex items-center justify-between">
                <SectionLabel>{t('marble.colorMain')}</SectionLabel>
                <input type="color" value={state.marbleParams.colorMain} onChange={(e) => setMarble('colorMain', e.target.value)} className="color-swatch" />
              </div>
              <div className="flex items-center justify-between">
                <SectionLabel>{t('marble.colorLow')}</SectionLabel>
                <input type="color" value={state.marbleParams.colorLow} onChange={(e) => setMarble('colorLow', e.target.value)} className="color-swatch" />
              </div>
              <div className="flex items-center justify-between">
                <SectionLabel>{t('marble.colorMid')}</SectionLabel>
                <input type="color" value={state.marbleParams.colorMid} onChange={(e) => setMarble('colorMid', e.target.value)} className="color-swatch" />
              </div>
              <div className="flex items-center justify-between">
                <SectionLabel>{t('marble.colorHigh')}</SectionLabel>
                <input type="color" value={state.marbleParams.colorHigh} onChange={(e) => setMarble('colorHigh', e.target.value)} className="color-swatch" />
              </div>
            </ControlGroup>

            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Waves style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('marble.sectionShape')}</span>}>
              <Slider label={t('marble.noiseScale')} value={state.marbleParams.noiseScale} min={0.5} max={3} step={0.05} onChange={(v) => setMarble('noiseScale', v)} sound="mech5" />
              <Slider label={t('marble.warpPower')} value={state.marbleParams.warpPower} min={0} max={1} step={0.01} onChange={(v) => setMarble('warpPower', v)} sound="mech5" />
              <Slider label={t('marble.fbmStrength')} value={state.marbleParams.fbmStrength} min={0.1} max={3} step={0.05} onChange={(v) => setMarble('fbmStrength', v)} sound="mech5" />
              <Slider label={t('marble.fbmDamping')} value={state.marbleParams.fbmDamping} min={0.1} max={1} step={0.05} onChange={(v) => setMarble('fbmDamping', v)} sound="mech5" />
              <Slider label={t('marble.blurRadius')} value={state.marbleParams.blurRadius} min={0.1} max={3} step={0.05} onChange={(v) => setMarble('blurRadius', v)} sound="mech5" />
            </ControlGroup>

            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Layers style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('marble.sectionVein')}</span>}>
              <Slider label={t('marble.veinIntensity')} value={state.marbleParams.veinIntensity} min={0} max={1} step={0.01} onChange={(v) => setMarble('veinIntensity', v)} sound="mech5" />
              <Slider label={t('marble.veinScale')} value={state.marbleParams.veinScale} min={1} max={10} step={0.1} onChange={(v) => setMarble('veinScale', v)} disabled={state.marbleParams.veinIntensity === 0} sound="mech5" />
              <div className="flex items-center justify-between">
                <SectionLabel>{t('marble.veinColor')}</SectionLabel>
                <input type="color" value={state.marbleParams.veinColor} onChange={(e) => setMarble('veinColor', e.target.value)} disabled={state.marbleParams.veinIntensity === 0} className="color-swatch" />
              </div>
            </ControlGroup>

            <ControlGroup title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shuffle style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('marble.sectionDetail')}</span>}>
              <Slider label={t('marble.grain')} value={state.marbleParams.grain} min={0} max={100} onChange={(v) => setMarble('grain', v)} sound="mech5" />
            </ControlGroup>

            <ControlGroup
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Play style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />{t('sectionAnimation')}</span>}
              suffix={<Toggle checked={state.marbleParams.animated} onChange={(v) => { setMarble('animated', v); playSound('BubblePop') }} />}
            >
              {state.marbleParams.animated && (
                <Slider label={t('sectionAnimSpeed')} value={state.marbleParams.speed} min={0.1} max={3} step={0.1} onChange={(v) => setMarble('speed', v)} sound="mech5" />
              )}
            </ControlGroup>
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

      {/* 底部固定操作栏 */}
      {/* 底部固定操作栏 */}
      <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: '1px solid var(--color-border-faint)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
          <button
            onClick={handleInspire}
            style={{
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border-group)',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-text-muted)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border-group)')}
          >
            <Lightbulb style={{ width: 12, height: 12, flexShrink: 0 }} />
            {tActions('inspire')}
          </button>
          <button
            onClick={handleRandomize}
            style={{
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border-group)',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-text-muted)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border-group)')}
          >
            <Dices style={{ width: 12, height: 12, flexShrink: 0 }} />
            {tActions('randomize')}
          </button>
          <button
            onClick={handleReset}
            style={{
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border-group)',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-text-muted)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border-group)')}
          >
            <RotateCcw style={{ width: 12, height: 12, flexShrink: 0 }} />
            {tActions('reset')}
          </button>
          <button
            onClick={handleSave}
            style={{
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 500,
              color: saveStatus === 'saved' ? '#60a5fa' : 'var(--color-text-primary)',
              backgroundColor: 'transparent',
              border: `1px solid ${saveStatus === 'saved' ? '#60a5fa' : 'var(--color-border-group)'}`,
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (saveStatus === 'idle') e.currentTarget.style.borderColor = 'var(--color-text-muted)' }}
            onMouseLeave={e => { if (saveStatus === 'idle') e.currentTarget.style.borderColor = 'var(--color-border-group)' }}
          >
            <Bookmark style={{ width: 12, height: 12, flexShrink: 0, fill: saveStatus === 'saved' ? 'currentColor' : 'none' }} />
            {saveStatus === 'saved' ? tActions('saved') : saveStatus === 'duplicate' ? tActions('duplicate') : tActions('save')}
          </button>
        </div>
      </div>
    </aside>
  )
}
