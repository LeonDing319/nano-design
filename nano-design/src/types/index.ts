export type EffectType = 'ascii' | 'glitch' | 'other'

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
  corruption: number         // 0-100 故障腐蚀强度
  scanlines: boolean         // 扫描线开关
}

export interface AsciiParams {
  // Characters
  charSet: 'dense' | 'classic' | 'binary' | 'minimal' | 'retro' | 'custom'
  customChars: string
  fontSize: number           // 6-28, step 2

  // Intensity
  coverage: number           // 0-100
  edgeEmphasis: number       // 0-100

  // Background
  bgColor: string            // hex color
  bgBlur: number             // 0-80
  bgOpacity: number          // 0-100

  // Color & Tone
  charOpacity: number        // 10-100
  charBrightness: number     // -100 to 100
  charContrast: number       // -100 to 100
  invert: boolean
  dotGrid: boolean

  // Animation
  animated: boolean
  animSpeed: number          // 0.1-5 频率倍率
  animIntensity: number      // 0-100
  animRandomness: number     // 0-100
}

export type ExportFormat = 'png' | 'gif' | 'html' | 'canvas-code'

export interface VideoPlaybackState {
  playing: boolean
  currentTime: number
  duration: number
  speed: number
  fps: number
}

export interface AppState {
  image: HTMLImageElement | null
  video: HTMLVideoElement | null
  videoPlayback: VideoPlaybackState
  activeEffect: EffectType
  glitchParams: GlitchParams
  asciiParams: AsciiParams
  locale: 'zh' | 'en'
  theme: 'dark'
}

export interface Preset<T> {
  id: string
  name: string
  nameZh: string
  params: T
}
