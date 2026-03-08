import { AsciiParams } from '@/types'
import { ASCII_CHAR_SETS } from '@/presets/ascii-presets'

export function renderAscii(
  ctx: CanvasRenderingContext2D,
  sourceImage: HTMLImageElement,
  params: AsciiParams,
  canvasWidth: number,
  canvasHeight: number
) {
  const { charDensity, charSet, customChars, fontSize, colorMode, monoColor, bgColor, invert } = params

  // 获取字符集
  const chars = charSet === 'custom' && customChars
    ? customChars
    : ASCII_CHAR_SETS[charSet] || ASCII_CHAR_SETS.standard

  // 计算字符网格尺寸
  const charWidth = fontSize * 0.6 // 等宽字体宽高比约 0.6
  const cols = Math.max(1, Math.floor((canvasWidth * charDensity / 100) / charWidth))
  const rows = Math.max(1, Math.floor(cols * (sourceImage.height / sourceImage.width) * (charWidth / fontSize)))

  // 在临时 canvas 上缩放源图以采样
  const sampleCanvas = document.createElement('canvas')
  sampleCanvas.width = cols
  sampleCanvas.height = rows
  const sampleCtx = sampleCanvas.getContext('2d')!
  sampleCtx.drawImage(sourceImage, 0, 0, cols, rows)
  const imageData = sampleCtx.getImageData(0, 0, cols, rows)
  const pixels = imageData.data

  // 填充背景
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 设置字体
  ctx.font = `${fontSize}px monospace`
  ctx.textBaseline = 'top'

  // 计算居中偏移
  const totalWidth = cols * charWidth
  const totalHeight = rows * fontSize
  const offsetX = (canvasWidth - totalWidth) / 2
  const offsetY = (canvasHeight - totalHeight) / 2

  // 逐字符渲染
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) * 4
      const r = pixels[idx]
      const g = pixels[idx + 1]
      const b = pixels[idx + 2]

      // 计算亮度 (0-1)
      let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      if (invert) brightness = 1 - brightness

      // 映射到字符
      const charIndex = Math.floor(brightness * (chars.length - 1))
      const char = chars[charIndex]

      // 设置颜色
      if (colorMode === 'color') {
        ctx.fillStyle = `rgb(${r},${g},${b})`
      } else if (colorMode === 'mono') {
        ctx.fillStyle = monoColor || '#00FF00'
      } else {
        // bw
        const bwValue = Math.floor(brightness * 255)
        ctx.fillStyle = `rgb(${bwValue},${bwValue},${bwValue})`
      }

      ctx.fillText(char, offsetX + col * charWidth, offsetY + row * fontSize)
    }
  }
}
