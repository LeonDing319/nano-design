import { MarbleParams } from '@/types'

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function randomizeMarbleColors(): Pick<MarbleParams, 'colorMain' | 'colorLow' | 'colorMid' | 'colorHigh'> {
  const baseHue = Math.random() * 360
  const sat = Math.random() * 40 + 60
  return {
    colorMain: hslToHex(baseHue, sat, Math.random() * 20 + 70),
    colorLow: hslToHex((baseHue + Math.random() * 30 - 15) % 360, sat, Math.random() * 30 + 40),
    colorMid: hslToHex((baseHue + 120 + Math.random() * 30 - 15) % 360, sat, Math.random() * 20 + 50),
    colorHigh: hslToHex((baseHue + 240 + Math.random() * 30 - 15) % 360, Math.random() * 20 + 10, Math.random() * 15 + 85),
  }
}

export function randomizeMarbleParams(): MarbleParams {
  const colors = randomizeMarbleColors()
  return {
    ...colors,
    noiseScale: 0.5 + Math.random() * 2.5,
    warpPower: Math.random(),
    fbmStrength: 0.1 + Math.random() * 2.9,
    fbmDamping: 0.1 + Math.random() * 0.9,
    blurRadius: 0.1 + Math.random() * 2.9,
    veinIntensity: Math.random() * 0.8,
    veinScale: 1 + Math.random() * 9,
    veinColor: hslToHex(Math.random() * 360, Math.random() * 30 + 10, Math.random() * 20 + 5),
    grain: Math.random() * 40,
    animated: Math.random() > 0.75,
    speed: 0.3 + Math.random() * 2.2,
  }
}

export const DEFAULT_MARBLE_PARAMS: MarbleParams = {
  colorMain: '#c4a882',
  colorLow: '#5a3d2b',
  colorMid: '#2b6b5a',
  colorHigh: '#e8dcd0',
  noiseScale: 1.25,
  warpPower: 0.35,
  fbmStrength: 1.2,
  fbmDamping: 0.55,
  blurRadius: 1.0,
  veinIntensity: 0,
  veinScale: 3.0,
  veinColor: '#1a1a2e',
  grain: 0,
  animated: false,
  speed: 1.0,
}
