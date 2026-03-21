import { AsciiParams, Preset } from '@/types'

export const ASCII_CHAR_SETS: Record<string, string> = {
  dense: 'Ñ@#W$9876543210?!abc;:+=-,._ ',
  classic: '@%#*+=-:. ',
  binary: '01 ',
  minimal: '#+-. ',
  retro: '░▒▓|/\\-=+. ',
}

export const ASCII_PRESETS: Preset<AsciiParams>[] = []

export const DEFAULT_ASCII_PARAMS: AsciiParams = {
  renderMode: 'brightness',
  charSet: 'dense',
  customChars: 'Ñ@#W$9876543210?!abc;:+=-,._ ',
  fontSize: 8,
  coverage: 100,
  edgeEmphasis: 100,
  bgColor: '#000000',
  bgBlur: 14,
  bgOpacity: 100,
  charOpacity: 55,
  brightness: 0,
  contrast: 0,
  charBrightness: 0,
  charContrast: 0,
  invert: false,
  dotGrid: false,
  animated: false,
  animSpeed: 1.5,
  animIntensity: 60,
  animRandomness: 50,
}
