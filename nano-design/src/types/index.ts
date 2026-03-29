export type EffectType = 'ascii' | 'glitch' | 'marble' | 'flow'

export interface GlitchParams {
  stripeDensity: number      // 0-50
  displacement: number       // 0-20
  verticalSpeed: number      // 0-20 垂直滚动速度
  rgbSplit: number           // 0-50
  rgbSplitDirection: number  // 0-360 角度
  rgbSplitDirectionAnim: boolean // 自动旋转 0->360->0
  clipShape: 'circle' | 'rectangle' | 'none'
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

  // Color Tint
  colorTint: string          // hex color
  colorTintOpacity: number   // 0-100
  colorTintBlend: GlobalCompositeOperation // blend mode
}

export interface MarbleParams {
  colorMain: string
  colorLow: string
  colorMid: string
  colorHigh: string
  noiseScale: number         // 0.5-3.0
  warpPower: number          // 0-1
  fbmStrength: number        // 0.1-3.0
  fbmDamping: number         // 0.1-1.0
  blurRadius: number         // 0.1-3.0
  veinIntensity: number      // 0-1
  veinScale: number          // 1-10
  veinColor: string
  grain: number              // 0-100
  animated: boolean
  speed: number              // 0.1-3.0
}

export interface FlowParams {
  amplitude: number          // 0-1 波浪振幅
  frequency: number          // 1-100 波浪频率
  complexity: number         // 0-5 复杂度
  sharpness: number          // 1-20 锐度
  yStart: number             // 0-1 安全区域起点
  speed: number              // 0-1 动画速度
  maskAngle: number          // -180 to 180 遮罩角度
  waveAngle: number          // -180 to 180 波浪角度
  spacerY: number            // 0-1 间隔带位置
  spacerSize: number         // 0-0.5 间隔带大小
  spacerFeather: number      // 0-0.2 间隔带羽化
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
  marbleParams: MarbleParams
  flowParams: FlowParams
  locale: 'zh'
  theme: 'dark'
  showAbout: boolean
}

export interface Preset<T> {
  id: string
  name: string
  nameZh: string
  params: T
}
