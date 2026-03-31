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
}
