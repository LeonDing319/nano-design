import { EffectType, GlitchParams, AsciiParams, MarbleParams, FlowParams } from '@/types'
import { DEFAULT_ASCII_PARAMS } from '@/presets/ascii-presets'

export interface ShowcasePreset {
  id: string
  image?: string
  video?: string
  effect: EffectType
  asciiParams?: AsciiParams
  glitchParams?: GlitchParams
  marbleParams?: MarbleParams
  flowParams?: FlowParams
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
  {
    id: 'marble-01', // 冰蓝液态
    effect: 'marble',
    marbleParams: {
      colorMain: '#70c8ff',
      colorLow: '#578ee5',
      colorMid: '#004cff',
      colorHigh: '#ffffff',
      noiseScale: 1.10,
      warpPower: 0.22,
      fbmStrength: 1.35,
      fbmDamping: 0.15,
      blurRadius: 1.59,
      veinIntensity: 0.59,
      veinScale: 3.1,
      veinColor: '#6bf5ff',
      grain: 11,
      animated: true,
      speed: 0.7,
    },
  },
  {
    id: 'flow-03', // 暖光人像
    image: '/presets/flow-03.jpg',
    effect: 'flow',
    flowParams: {
      amplitude: 0.15,
      frequency: 35,
      complexity: 1.2,
      sharpness: 7.3,
      waveAngle: -3.3,
      yStart: 0.42,
      maskAngle: -59.4,
      spacerY: 0.43,
      spacerSize: 0.30,
      spacerFeather: 0.08,
      speed: 0.94,
    },
  },
  {
    id: 'flow-02', // 蓝光人像
    image: '/presets/flow-02.jpg',
    effect: 'flow',
    flowParams: {
      amplitude: 0.31,
      frequency: 51,
      complexity: 1.4,
      sharpness: 5.5,
      waveAngle: -154.4,
      yStart: 0.53,
      maskAngle: 113.0,
      spacerY: 1.00,
      spacerSize: 0.18,
      spacerFeather: 0.03,
      speed: 0.58,
    },
  },
  {
    id: 'flow-01', // 地球
    image: '/presets/flow-01.jpg',
    effect: 'flow',
    flowParams: {
      amplitude: 0.06,
      frequency: 40,
      complexity: 4.8,
      sharpness: 3.9,
      waveAngle: -58.4,
      yStart: 0.40,
      maskAngle: 16.9,
      spacerY: 0.89,
      spacerSize: 0.31,
      spacerFeather: 0.08,
      speed: 0.63,
    },
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
