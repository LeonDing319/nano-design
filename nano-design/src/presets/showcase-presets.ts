import { EffectType, GlitchParams, AsciiParams, MarbleParams } from '@/types'

export interface ShowcasePreset {
  id: string
  image: string  // path relative to /public, e.g. '/presets/ascii-01.jpg'
  effect: EffectType
  asciiParams?: AsciiParams
  glitchParams?: GlitchParams
  marbleParams?: MarbleParams
}

// Leon 的预设库 —— 每个效果对应一组预设（图片 + 调好的参数）
// 用户打开时默认展示第一个，点随机灵感循环切换

export const SHOWCASE_PRESETS: ShowcasePreset[] = [
  // 示例结构（等 Leon 上传图片和参数后填充）：
  // {
  //   id: 'ascii-01',
  //   image: '/presets/ascii-01.jpg',
  //   effect: 'ascii',
  //   asciiParams: { ...DEFAULT_ASCII_PARAMS, fontSize: 10, coverage: 80 },
  // },
]

export function getPresetsForEffect(effect: EffectType): ShowcasePreset[] {
  return SHOWCASE_PRESETS.filter(p => p.effect === effect)
}

export function getRandomPreset(effect: EffectType, excludeId?: string): ShowcasePreset | null {
  const presets = getPresetsForEffect(effect)
  if (presets.length === 0) return null
  if (presets.length === 1) return presets[0]
  const filtered = excludeId ? presets.filter(p => p.id !== excludeId) : presets
  return filtered[Math.floor(Math.random() * filtered.length)]
}
