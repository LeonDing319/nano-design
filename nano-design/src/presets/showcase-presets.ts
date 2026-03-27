import { EffectType, GlitchParams, AsciiParams, MarbleParams } from '@/types'
import { DEFAULT_ASCII_PARAMS } from '@/presets/ascii-presets'

export interface ShowcasePreset {
  id: string
  image?: string
  video?: string
  effect: EffectType
  asciiParams?: AsciiParams
  glitchParams?: GlitchParams
  marbleParams?: MarbleParams
  zoom?: number // Canvas 缩放比例，如 0.6 = 60%
}

export const SHOWCASE_PRESETS: ShowcasePreset[] = [
  {
    id: 'ascii-01', // 绿叶
    video: '/presets/ascii-01.mp4',
    effect: 'ascii',
    asciiParams: { ...DEFAULT_ASCII_PARAMS },
  },
  {
    id: 'ascii-02', // 眼睛
    video: '/presets/ascii-02.mp4',
    effect: 'ascii',
    asciiParams: { ...DEFAULT_ASCII_PARAMS, fontSize: 20 },
  },
  {
    id: 'ascii-03', // 彩球
    video: '/presets/ascii-03.mp4',
    effect: 'ascii',
    asciiParams: { ...DEFAULT_ASCII_PARAMS, charSet: 'retro', fontSize: 20 },
    zoom: 0.6,
  },
  {
    id: 'ascii-04', // 宇宙
    image: '/presets/ascii-04.jpg',
    effect: 'ascii',
    asciiParams: { ...DEFAULT_ASCII_PARAMS, charSet: 'binary', invert: true, animated: true, animSpeed: 3.8, animIntensity: 71, animRandomness: 27 },
  },
  {
    id: 'ascii-05', // 花
    video: '/presets/ascii-05.mp4',
    effect: 'ascii',
    asciiParams: { ...DEFAULT_ASCII_PARAMS, charSet: 'custom', customChars: 'Love', fontSize: 18, charOpacity: 20, invert: true, dotGrid: true },
  },
  {
    id: 'ascii-06', // 蓝花
    image: '/presets/ascii-06.jpg',
    effect: 'ascii',
    asciiParams: { ...DEFAULT_ASCII_PARAMS, charSet: 'dense', fontSize: 16, edgeEmphasis: 0, animated: true, animSpeed: 3.8, animIntensity: 43, animRandomness: 13 },
    zoom: 0.69,
  },
]

export function getPresetsForEffect(effect: EffectType): ShowcasePreset[] {
  return SHOWCASE_PRESETS.filter(p => p.effect === effect)
}

export function getRandomPreset(effect: EffectType, excludeId?: string): ShowcasePreset | null {
  const presets = getPresetsForEffect(effect)
  if (presets.length === 0) return null
  if (presets.length === 1) return presets[0]
  const filtered = excludeId ? presets.filter(p => p.id !== excludeId) : presets
  return filtered[Math.floor(Math.random() * filtered.length)]
}

export function getNextPreset(effect: EffectType, currentId?: string): ShowcasePreset | null {
  const presets = getPresetsForEffect(effect)
  if (presets.length === 0) return null
  if (!currentId) return presets[0]
  const currentIndex = presets.findIndex(p => p.id === currentId)
  const nextIndex = (currentIndex + 1) % presets.length
  return presets[nextIndex]
}

export function getRandomShowcasePreset(excludeId?: string): ShowcasePreset | null {
  if (SHOWCASE_PRESETS.length === 0) return null
  if (SHOWCASE_PRESETS.length === 1) return SHOWCASE_PRESETS[0]
  const filtered = excludeId ? SHOWCASE_PRESETS.filter(p => p.id !== excludeId) : SHOWCASE_PRESETS
  return filtered[Math.floor(Math.random() * filtered.length)]
}
