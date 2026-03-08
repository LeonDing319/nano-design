export type EffectType = 'glitch' | 'ascii'

export type SplitDirection = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right'

export interface GlitchParams {
  stripeDensity: number      // 1-100
  displacement: number       // 0-100
  rgbSplit: number           // 0-50
  rgbSplitDirection: SplitDirection
  clipShape: 'circle' | 'rectangle' | 'none'
  randomSeed: number         // 0-9999
  animation: boolean
  animationSpeed: number     // 1-10
}

export interface AsciiParams {
  charDensity: number        // 1-100
  charSet: 'standard' | 'minimal' | 'blocks' | 'custom'
  customChars?: string
  fontSize: number           // 4-24
  colorMode: 'bw' | 'color' | 'mono'
  monoColor?: string
  bgColor: string
  invert: boolean
}

export type ExportFormat = 'png' | 'gif' | 'html' | 'canvas-code'

export interface AppState {
  image: HTMLImageElement | null
  activeEffect: EffectType
  glitchParams: GlitchParams
  asciiParams: AsciiParams
  locale: 'zh' | 'en'
  theme: 'dark' | 'light'
}

export interface Preset<T> {
  id: string
  name: string
  nameZh: string
  params: T
}
