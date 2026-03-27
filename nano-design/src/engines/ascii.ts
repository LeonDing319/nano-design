import type { AsciiParams } from '@/types'
import { ASCII_CHAR_SETS } from '@/presets/ascii-presets'

type ImageSource = HTMLImageElement | HTMLVideoElement

// Sobel edge detection at half resolution for performance
function sobelEdgeDetect(pixels: Uint8ClampedArray, w: number, h: number): { data: Float32Array; w: number; h: number } {
  const hw = w >> 1
  const hh = h >> 1
  // Downsample luminance to half res
  const lum = new Float32Array(hw * hh)
  for (let y = 0; y < hh; y++) {
    const sy = y * 2
    for (let x = 0; x < hw; x++) {
      const sx = x * 2
      const p = (sy * w + sx) * 4
      lum[y * hw + x] = (pixels[p] * 0.299 + pixels[p + 1] * 0.587 + pixels[p + 2] * 0.114) / 255
    }
  }
  const edges = new Float32Array(hw * hh)
  for (let y = 1; y < hh - 1; y++) {
    for (let x = 1; x < hw - 1; x++) {
      const tl = lum[(y - 1) * hw + (x - 1)]
      const t  = lum[(y - 1) * hw + x]
      const tr = lum[(y - 1) * hw + (x + 1)]
      const l  = lum[y * hw + (x - 1)]
      const r  = lum[y * hw + (x + 1)]
      const bl = lum[(y + 1) * hw + (x - 1)]
      const b  = lum[(y + 1) * hw + x]
      const br = lum[(y + 1) * hw + (x + 1)]
      const gx = -tl - 2 * l - bl + tr + 2 * r + br
      const gy = -tl - 2 * t - tr + bl + 2 * b + br
      edges[y * hw + x] = Math.min(1, Math.sqrt(gx * gx + gy * gy))
    }
  }
  return { data: edges, w: hw, h: hh }
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

  // --- Edge detection (half resolution for performance) ---
  const edge = sobelEdgeDetect(pixels, w, h)
  const edgeEmphasis = (params.edgeEmphasis ?? 100) / 100

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

      // Sample edge value at cell center (from half-res edge map)
      const edgeX = Math.min(edge.w - 1, (sampleX >> 1))
      const edgeY = Math.min(edge.h - 1, (sampleY >> 1))
      const edgeVal = edge.data[edgeY * edge.w + edgeX]

      // Coverage filter
      if (V < 1 && lum > V) continue

      let charScore = lum
      if (invertMapping) charScore = 1 - charScore

      // Apply edge emphasis (Budarina's formula: Se = Se*(1-X) + (1-He)*X*Se)
      charScore = Math.max(0, Math.min(1,
        charScore * (1 - edgeEmphasis) + (1 - edgeVal) * edgeEmphasis * charScore
      ))

      // Pick character
      const ch = params.charSet === 'custom'
        ? chars[(Math.floor(cellX / colW) + Math.floor(cellY / rowH)) % numChars]
        : chars[Math.floor(charScore * (numChars - 1))]
      if (!ch || ch === ' ') continue

      // Apply charBrightness / charContrast to color (Budarina's exact formula)
      if (cbVal !== 0 || ccVal !== 0) {
        r = Math.max(0, Math.min(255, (r + cbOffset - 128) * ccFactor + 128))
        g = Math.max(0, Math.min(255, (g + cbOffset - 128) * ccFactor + 128))
        b = Math.max(0, Math.min(255, (b + cbOffset - 128) * ccFactor + 128))
      }

      const fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`

      // Deterministic phase based on cell position for stable animation
      const cellCol = Math.floor(cellX / colW)
      const cellRow = Math.floor(cellY / rowH)
      const phase = ((cellCol * 7 + cellRow * 13) % 100) / 100 * Math.PI * 2
      cells.push({ cx: cellX + colW / 2, cy: cellY + rowH / 2, ch, fillStyle, phase })
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

  // --- Color tint overlay ---
  if (params.colorTintOpacity > 0) {
    ctx.save()
    ctx.globalAlpha = params.colorTintOpacity / 100
    ctx.globalCompositeOperation = params.colorTintBlend
    ctx.fillStyle = params.colorTint
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }
}
