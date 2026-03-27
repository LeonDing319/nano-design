import { AsciiParams, Preset } from '@/types'

export const ASCII_CHAR_SETS: Record<string, string> = {
  dense: 'Ñ@#W$9876543210?!abc;:+=-,._ ',
  classic: '@%#*+=-:. ',
  binary: '01 ',
  minimal: '#+-. ',
  retro: '░▒▓|/\\-=+. ',
}

export const ASCII_PRESETS: Preset<AsciiParams>[] = []

const CHAR_SET_KEYS: AsciiParams['charSet'][] = ['dense', 'classic', 'binary', 'minimal', 'retro']

export function randomizeAsciiParams(): AsciiParams {
  return {
    charSet: CHAR_SET_KEYS[Math.floor(Math.random() * CHAR_SET_KEYS.length)],
    customChars: 'Ñ@#W$9876543210?!abc;:+=-,._ ',
    fontSize: (Math.floor(Math.random() * 12) + 3) * 2,  // 6-28, step 2
    coverage: 40 + Math.floor(Math.random() * 61),
    edgeEmphasis: Math.floor(Math.random() * 101),
    bgColor: '#000000',
    bgBlur: Math.floor(Math.random() * 81),
    bgOpacity: 50 + Math.floor(Math.random() * 51),
    charOpacity: 30 + Math.floor(Math.random() * 71),
    charBrightness: Math.floor(Math.random() * 101) - 50,
    charContrast: Math.floor(Math.random() * 101) - 50,
    invert: Math.random() > 0.7,
    dotGrid: Math.random() > 0.8,
    animated: Math.random() > 0.75,
    animSpeed: 0.5 + Math.random() * 3,
    animIntensity: 20 + Math.floor(Math.random() * 81),
    animRandomness: Math.floor(Math.random() * 101),
    colorTint: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
    colorTintOpacity: Math.random() > 0.6 ? Math.floor(Math.random() * 61) : 0,
    colorTintBlend: (['multiply', 'overlay', 'screen', 'color', 'hue', 'saturation', 'luminosity', 'soft-light', 'hard-light'] as const)[Math.floor(Math.random() * 9)] as GlobalCompositeOperation,
  }
}

export const DEFAULT_ASCII_PARAMS: AsciiParams = {
  charSet: 'dense',
  customChars: 'Ñ@#W$9876543210?!abc;:+=-,._ ',
  fontSize: 8,
  coverage: 100,
  edgeEmphasis: 100,
  bgColor: '#000000',
  bgBlur: 14,
  bgOpacity: 100,
  charOpacity: 55,
  charBrightness: 0,
  charContrast: 0,
  invert: false,
  dotGrid: false,
  animated: false,
  animSpeed: 1.5,
  animIntensity: 60,
  animRandomness: 50,
  colorTint: '#ff6600',
  colorTintOpacity: 0,
  colorTintBlend: 'multiply',
}
