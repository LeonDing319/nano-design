import { AsciiParams, Preset } from '@/types'

export const ASCII_CHAR_SETS: Record<string, string> = {
  standard: '@#S08Xx+=-;:,.',
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
  minimal: '@#*+=-:. ',
  blocks: '\u2588\u2593\u2592\u2591 ',
}

export const ASCII_PRESETS: Preset<AsciiParams>[] = []

export const DEFAULT_ASCII_PARAMS: AsciiParams = {
  renderMode: 'brightness',
  charSet: 'standard',
  customChars: '@#S08Xx+=-;:,.',
  fontSize: 14,
  coverage: 85,
  edgeEmphasis: 60,
  bgColor: '#000000',
  bgBlur: 40,
  bgOpacity: 100,
  blendMode: 'source-over',
  charOpacity: 100,
  brightness: 0,
  contrast: 0,
  invert: false,
  dotGrid: false,
  animated: false,
  animSpeed: 1500,
  animIntensity: 60,
  animRandomness: 50,
}
