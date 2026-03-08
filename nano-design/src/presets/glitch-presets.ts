import { GlitchParams, Preset } from '@/types'

export const GLITCH_PRESETS: Preset<GlitchParams>[] = [
  {
    id: 'light-glitch',
    name: 'Light Glitch',
    nameZh: '轻微故障',
    params: {
      stripeDensity: 20,
      displacement: 15,
      rgbSplit: 5,
      rgbSplitDirection: 'right',
      clipShape: 'none',
      randomSeed: 42,
      animation: false,
      animationSpeed: 5,
    },
  },
  {
    id: 'heavy-damage',
    name: 'Heavy Damage',
    nameZh: '重度损坏',
    params: {
      stripeDensity: 60,
      displacement: 80,
      rgbSplit: 30,
      rgbSplitDirection: 'right',
      clipShape: 'none',
      randomSeed: 42,
      animation: false,
      animationSpeed: 5,
    },
  },
  {
    id: 'retro-crt',
    name: 'Retro CRT',
    nameZh: '复古 CRT',
    params: {
      stripeDensity: 80,
      displacement: 10,
      rgbSplit: 15,
      rgbSplitDirection: 'right',
      clipShape: 'none',
      randomSeed: 42,
      animation: true,
      animationSpeed: 3,
    },
  },
  {
    id: 'cyber-pulse',
    name: 'Cyber Pulse',
    nameZh: '赛博脉冲',
    params: {
      stripeDensity: 40,
      displacement: 50,
      rgbSplit: 25,
      rgbSplitDirection: 'right',
      clipShape: 'none',
      randomSeed: 42,
      animation: true,
      animationSpeed: 7,
    },
  },
]

export const DEFAULT_GLITCH_PARAMS: GlitchParams = {
  stripeDensity: 0,
  displacement: 0,
  rgbSplit: 0,
  rgbSplitDirection: 'right',
  clipShape: 'none',
  randomSeed: 0,
  animation: false,
  animationSpeed: 5,
}
