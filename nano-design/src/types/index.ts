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
  scanlineDensity: number    // 0-25 (0 表示关闭故障格线)
}

export interface AsciiParams {
  // Characters
  renderMode: 'brightness' | 'edge' | 'dots'
  charSet: 'standard' | 'detailed' | 'minimal' | 'blocks' | 'custom'
  customChars: string
  fontSize: number           // 10-40

  // Intensity
  coverage: number           // 0-100
  edgeEmphasis: number       // 0-100

  // Background
  bgColor: string            // hex color
  bgBlur: number             // 0-80
  bgOpacity: number          // 0-100

  // Color & Tone
  blendMode: string
  charOpacity: number        // 0-100
  brightness: number         // -100 to 100
  contrast: number           // -100 to 100
  invert: boolean
  dotGrid: boolean

  // Animation
  animated: boolean
  animSpeed: number          // 500-5000
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
