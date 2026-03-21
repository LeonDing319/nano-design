import type { AsciiParams } from '@/types'
import { ASCII_CHAR_SETS } from '@/presets/ascii-presets'

type ImageSource = HTMLImageElement | HTMLVideoElement

/**
 * Sobel edge map — matches Budarina's mx() exactly.
 * Grayscale normalised to [0,1], edge magnitudes clamped to [0,1] (no global normalisation).
 */
function computeEdgeMap(pixels: Uint8ClampedArray, w: number, h: number): Float32Array {
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const off = i * 4
    gray[i] = (pixels[off] * 0.299 + pixels[off + 1] * 0.587 + pixels[off + 2] * 0.114) / 255
  }

  const edges = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const tl = gray[(y - 1) * w + (x - 1)]
      const tc = gray[(y - 1) * w + x]
      const tr = gray[(y - 1) * w + (x + 1)]
      const ml = gray[y * w + (x - 1)]
      const mr = gray[y * w + (x + 1)]
      const bl = gray[(y + 1) * w + (x - 1)]
      const bc = gray[(y + 1) * w + x]
      const br = gray[(y + 1) * w + (x + 1)]

      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br
      edges[y * w + x] = Math.min(1, Math.sqrt(gx * gx + gy * gy))
    }
  }
  return edges
}

export function renderAscii(
  ctx: CanvasRenderingContext2D,
  sourceImage: ImageSource,
  params: AsciiParams,
  canvasWidth: number,
  canvasHeight: number,
  animationFrame?: number
) {
  const w = canvasWidth
  const h = canvasHeight
  if (w <= 0 || h <= 0) return

  // --- Sample source at canvas resolution ---
  const samplerCanvas = document.createElement('canvas')
  samplerCanvas.width = w
  samplerCanvas.height = h
  const samplerCtx = samplerCanvas.getContext('2d', { willReadFrequently: true })!
  samplerCtx.drawImage(sourceImage, 0, 0, w, h)
  const pixels = samplerCtx.getImageData(0, 0, w, h).data

  // --- Edge map at full resolution ---
  const edgeMap = computeEdgeMap(pixels, w, h)

  // --- Background ---
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = params.bgColor
  ctx.fillRect(0, 0, w, h)

  const bgAlpha = params.bgOpacity / 100
  if (bgAlpha > 0) {
    const bgCanvas = document.createElement('canvas')
    bgCanvas.width = w
    bgCanvas.height = h
    const bgCtx = bgCanvas.getContext('2d')!
    if (params.bgBlur > 0) {
      const blur = params.bgBlur
      bgCtx.filter = `blur(${blur}px)`
      bgCtx.drawImage(sourceImage, -blur * 2, -blur * 2, w + blur * 4, h + blur * 4)
      bgCtx.filter = 'none'
    } else {
      bgCtx.drawImage(sourceImage, 0, 0, w, h)
    }
    ctx.save()
    ctx.globalAlpha = bgAlpha
    ctx.drawImage(bgCanvas, 0, 0)
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // --- Parameters ---
  const S = Math.max(5, params.fontSize)
  const colW = S * 0.62
  const rowH = S * 1.15
  const chars = params.charSet === 'custom'
    ? params.customChars
    : (ASCII_CHAR_SETS[params.charSet] || ASCII_CHAR_SETS.dense)
  if (!chars || chars.length === 0) return
  const numChars = chars.length

  const V = params.coverage / 100
  const X = params.edgeEmphasis / 100
  const invertMapping = params.invert

  // charBrightness / charContrast (Budarina's char-level color adjustments)
  const cbVal = params.charBrightness
  const ccVal = params.charContrast
  const cbOffset = (cbVal / 100) * 128
  const ccFactor = ccVal >= 0 ? 1 + ccVal / 100 : 1 / (1 - ccVal / 100)

  // --- Build cells (matching Budarina's Is() loop) ---
  interface Cell { cx: number; cy: number; ch: string; fillStyle: string; phase: number }
  const cells: Cell[] = []

  for (let cellY = 0; cellY < h; cellY += rowH) {
    for (let cellX = 0; cellX < w; cellX += colW) {
      // Sample center pixel
      const sampleX = Math.min(w - 1, Math.floor(cellX + colW / 2))
      const sampleY = Math.min(h - 1, Math.floor(cellY + rowH / 2))
      const pixIdx = (sampleY * w + sampleX) * 4

      let r = pixels[pixIdx]
      let g = pixels[pixIdx + 1]
      let b = pixels[pixIdx + 2]

      // Luminance from original pixels
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255

      // Average edge value in cell region (step by 2)
      const x0 = Math.max(0, Math.floor(cellX))
      const x1 = Math.min(w - 1, Math.floor(cellX + colW))
      const y0 = Math.max(0, Math.floor(cellY))
      const y1 = Math.min(h - 1, Math.floor(cellY + rowH))
      let edgeSum = 0
      let edgeCount = 0
      for (let ey = y0; ey <= y1; ey += 2) {
        for (let ex = x0; ex <= x1; ex += 2) {
          edgeSum += edgeMap[ey * w + ex]
          edgeCount++
        }
      }
      const edgeAvg = edgeCount > 0 ? edgeSum / edgeCount : 0

      // Coverage filter
      if (V < 1 && lum > V) continue

      // Char score
      let charScore = params.renderMode === 'edges'
        ? 1 - Math.min(1, edgeAvg / (1 - V + 0.001))
        : lum

      if (invertMapping) charScore = 1 - charScore

      // Edge emphasis blending
      charScore = Math.max(0, Math.min(1,
        charScore * (1 - X) + (1 - edgeAvg) * X * charScore
      ))

      // Pick character
      const ch = chars[Math.floor(charScore * (numChars - 1))]
      if (!ch || ch === ' ') continue

      // Apply charBrightness / charContrast to color (Budarina's exact formula)
      if (cbVal !== 0 || ccVal !== 0) {
        r = Math.max(0, Math.min(255, (r + cbOffset - 128) * ccFactor + 128))
        g = Math.max(0, Math.min(255, (g + cbOffset - 128) * ccFactor + 128))
        b = Math.max(0, Math.min(255, (b + cbOffset - 128) * ccFactor + 128))
      }

      const fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`

      cells.push({ cx: cellX + colW / 2, cy: cellY + rowH / 2, ch, fillStyle, phase: Math.random() * Math.PI * 2 })
    }
  }

  // --- Dot grid ---
  if (params.dotGrid) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    for (let y = 0; y < h; y += rowH) {
      for (let x = 0; x < w; x += colW) {
        ctx.beginPath()
        ctx.arc(x + colW / 2, y + rowH / 2, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // --- Draw cells (matching Budarina's Ls()) ---
  ctx.save()

  const charAlpha = params.charOpacity / 100
  const animIntensityNorm = params.animIntensity / 100
  const animRandomnessNorm = params.animRandomness / 100
  const animSpeedVal = Math.max(0.1, params.animSpeed)

  ctx.font = `bold ${S}px monospace`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const animTime = (animationFrame ?? 0) / 60

  for (const cell of cells) {
    if (params.animated && animationFrame !== undefined) {
      const wave = Math.sin(animTime * animSpeedVal * Math.PI * 2 + cell.phase) * 0.5 + 0.5
      const jitter = Math.random()
      const blended = wave * (1 - animRandomnessNorm) + jitter * animRandomnessNorm
      const alpha = Math.max(0, Math.min(1,
        charAlpha * (1 - animIntensityNorm + animIntensityNorm * blended)
      ))
      ctx.globalAlpha = alpha
    } else {
      ctx.globalAlpha = charAlpha
    }

    ctx.fillStyle = cell.fillStyle
    ctx.fillText(cell.ch, cell.cx, cell.cy)
  }

  ctx.globalAlpha = 1
  ctx.restore()
}
