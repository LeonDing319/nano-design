export type EffectType = 'glitch' | 'ascii' | 'other'

export interface GlitchParams {
  stripeDensity: number      // 0-50
  displacement: number       // 0-20
  verticalSpeed: number      // 0-20 垂直滚动速度
  rgbSplit: number           // 0-50
  rgbSplitDirection: number  // 0-360 角度
  rgbSplitDirectionAnim: boolean // 自动旋转 0->360->0
  clipShape: 'circle' | 'rectangle' | 'none'
  duotone: boolean
  duotoneLightColor: string
  duotoneDarkColor: string
  dotSize: number            // 0-6 (0 表示关闭点阵)
  dotOpacity: number         // 0-0.7
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
