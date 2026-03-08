import { AsciiParams, Preset } from '@/types'

export const ASCII_CHAR_SETS: Record<string, string> = {
  standard: ' .:-=+*#%@',
  minimal: ' .:+#',
  blocks: ' ░▒▓█',
}

export const ASCII_PRESETS: Preset<AsciiParams>[] = [
  {
    id: 'classic-terminal',
    name: 'Classic Terminal',
    nameZh: '经典终端',
    params: {
      charDensity: 50,
      charSet: 'standard',
      fontSize: 10,
      colorMode: 'mono',
      monoColor: '#00FF00',
      bgColor: '#000000',
      invert: false,
    },
  },
  {
    id: 'photo-detail',
    name: 'Photo Detail',
    nameZh: '照片细节',
    params: {
      charDensity: 80,
      charSet: 'standard',
      fontSize: 6,
      colorMode: 'color',
      bgColor: '#000000',
      invert: false,
    },
  },
  {
    id: 'minimal-sketch',
    name: 'Minimal Sketch',
    nameZh: '极简素描',
    params: {
      charDensity: 30,
      charSet: 'minimal',
      fontSize: 14,
      colorMode: 'bw',
      bgColor: '#FFFFFF',
      invert: false,
    },
  },
]

export const DEFAULT_ASCII_PARAMS: AsciiParams = {
  charDensity: 50,
  charSet: 'blocks',
  fontSize: 10,
  colorMode: 'mono',
  monoColor: '#ffffff',
  bgColor: '#1a2fd4',
  invert: false,
}
