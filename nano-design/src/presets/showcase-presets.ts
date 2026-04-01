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
    id: 'ascii-07', // 赛博街景
    image: '/presets/ascii-07.jpg',
    effect: 'ascii',
    asciiParams: { ...DEFAULT_ASCII_PARAMS, charSet: 'dense', fontSize: 16, coverage: 100, edgeEmphasis: 100, charOpacity: 55, animated: true, animSpeed: 3.9, animIntensity: 30, animRandomness: 0 },
  },
  {
    id: 'glitch-06', // 绿隧独行
    image: '/presets/glitch-06.jpg',
    effect: 'glitch',
    glitchParams: {
      rgbSplit: 12,
      rgbSplitDirection: 196,
      rgbSplitDirectionAnim: true,
      displacement: 18,
      stripeDensity: 28,
      verticalSpeed: 0,
      clipShape: 'none',
      dotSize: 0,
      dotOpacity: 0.62,
      corruption: 15,
      scanlines: false,
    },
  },
  {
    id: 'glitch-05', // 红雾剪影
    image: '/presets/glitch-05.jpg',
    effect: 'glitch',
    glitchParams: {
      rgbSplit: 25,
      rgbSplitDirection: 171,
      rgbSplitDirectionAnim: false,
      displacement: 4,
      stripeDensity: 28,
      verticalSpeed: 1,
      clipShape: 'none',
      dotSize: 0,
      dotOpacity: 0.46,
      corruption: 16,
      scanlines: true,
    },
  },
  {
    id: 'glitch-04', // 少女胸像
    image: '/presets/glitch-04.webp',
    effect: 'glitch',
    glitchParams: {
      rgbSplit: 0,
      rgbSplitDirection: 0,
      rgbSplitDirectionAnim: false,
      displacement: 4,
      stripeDensity: 30,
      verticalSpeed: 5,
      clipShape: 'none',
      dotSize: 0,
      dotOpacity: 0,
      corruption: 0,
      scanlines: true,
    },
  },
  {
    id: 'glitch-03', // 石膏像
    image: '/presets/glitch-03.webp',
    effect: 'glitch',
    glitchParams: {
      rgbSplit: 25,
      rgbSplitDirection: 0,
      rgbSplitDirectionAnim: true,
      displacement: 10,
      stripeDensity: 5,
      verticalSpeed: 14,
      clipShape: 'none',
      dotSize: 0,
      dotOpacity: 0,
      corruption: 0,
      scanlines: false,
    },
  },
  {
    id: 'glitch-02', // 红厅对峙
    image: '/presets/glitch-02.jpg',
    effect: 'glitch',
    glitchParams: {
      rgbSplit: 3,
      rgbSplitDirection: 99,
      rgbSplitDirectionAnim: true,
      displacement: 2,
      stripeDensity: 7,
      verticalSpeed: 9,
      clipShape: 'none',
      dotSize: 2.4,
      dotOpacity: 0.03,
      corruption: 27,
      scanlines: false,
    },
  },
  {
    id: 'glitch-01', // 雨巷追踪
    image: '/presets/glitch-01.jpg',
    effect: 'glitch',
    glitchParams: {
      rgbSplit: 4,
      rgbSplitDirection: 0,
      rgbSplitDirectionAnim: false,
      displacement: 2,
      stripeDensity: 20,
      verticalSpeed: 12,
      clipShape: 'none',
      dotSize: 0,
      dotOpacity: 0,
      corruption: 0,
      scanlines: true,
    },
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
    id: 'flow-05', // 霓虹侧脸
    image: '/presets/flow-05.jpg',
    effect: 'flow',
    flowParams: {
      amplitude: 0.04,
      frequency: 45,
      complexity: 1.6,
      sharpness: 9.7,
      waveAngle: 152.8,
      yStart: 0.62,
      maskAngle: 24.7,
      spacerY: 0.67,
      spacerSize: 0.08,
      spacerFeather: 0.05,
      speed: 1.00,
    },
  },
  {
    id: 'flow-04', // 蓝光女生
    image: '/presets/flow-04.jpg',
    effect: 'flow',
    flowParams: {
      amplitude: 0.27,
      frequency: 85,
      complexity: 2.1,
      sharpness: 3.0,
      waveAngle: 180.0,
      yStart: 0.51,
      maskAngle: 57.9,
      spacerY: 1.00,
      spacerSize: 0.50,
      spacerFeather: 0.20,
      speed: 0.89,
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
