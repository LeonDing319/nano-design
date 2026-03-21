import type { AsciiParams } from '@/types'
import { ASCII_CHAR_SETS } from '@/presets/ascii-presets'

function clamp(min: number, max: number, v: number): number {
  return v < min ? min : v > max ? max : v
}

interface EdgeMap {
  data: Float32Array
  width: number
  height: number
}

function computeEdgeMap(imageData: ImageData, w: number, h: number): EdgeMap {
  const pixels = imageData.data
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const off = i * 4
    gray[i] = 0.299 * pixels[off] + 0.587 * pixels[off + 1] + 0.114 * pixels[off + 2]
  }

  const edges = new Float32Array(w * h)
  let maxEdge = 0

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x
      const gx =
        -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)]
        - 2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)]
        - gray[(y + 1) * w + (x - 1)] + gray[(y + 1) * w + (x + 1)]
      const gy =
        -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)]
        + gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)]
      const mag = Math.sqrt(gx * gx + gy * gy)
      edges[idx] = mag
      if (mag > maxEdge) maxEdge = mag
    }
  }

  if (maxEdge > 0) {
    const inv = 1 / maxEdge
    for (let i = 0; i < edges.length; i++) {
      edges[i] *= inv
    }
  }

  return { data: edges, width: w, height: h }
}

let samplerCanvas: HTMLCanvasElement | null = null

type ImageSource = HTMLImageElement | HTMLVideoElement

function sourceWidth(src: ImageSource): number {
  return src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth
}
function sourceHeight(src: ImageSource): number {
  return src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight
}

export function renderAscii(
  ctx: CanvasRenderingContext2D,
  sourceImage: ImageSource,
  params: AsciiParams,
  canvasWidth: number,
  canvasHeight: number,
  animationFrame?: number
) {
  const {
    renderMode,
    charSet,
    customChars,
    fontSize,
    coverage,
    edgeEmphasis,
    bgColor,
    bgBlur,
    bgOpacity,
    blendMode,
    charOpacity,
    brightness,
    contrast,
    invert,
    dotGrid,
    animated,
    animSpeed,
    animIntensity,
    animRandomness,
  } = params

  const charW = fontSize * 0.6
  const charH = fontSize
  const cols = Math.floor(canvasWidth / charW)
  const rows = Math.floor(canvasHeight / charH)

  if (cols <= 0 || rows <= 0) return

  const chars = charSet === 'custom' ? customChars : (ASCII_CHAR_SETS[charSet] || ASCII_CHAR_SETS.standard)
  if (!chars || chars.length === 0) return

  // Compute layout at full resolution (needed for background drawing)
  const srcW = sourceWidth(sourceImage)
  const srcH = sourceHeight(sourceImage)
  const scale = Math.min(canvasWidth / srcW, canvasHeight / srcH)
  const imgW = srcW * scale
  const imgH = srcH * scale
  const imgX = (canvasWidth - imgW) / 2
  const imgY = (canvasHeight - imgH) / 2

  // Draw source to temp canvas at LOW resolution (cols × rows) for sampling
  if (!samplerCanvas) samplerCanvas = document.createElement('canvas')
  if (samplerCanvas.width !== cols || samplerCanvas.height !== rows) {
    samplerCanvas.width = cols
    samplerCanvas.height = rows
  }
  const samplerCtx = samplerCanvas.getContext('2d')!
  samplerCtx.clearRect(0, 0, cols, rows)

  // Stretch source to fill entire grid — char aspect ratio (0.6:1) compensates on render
  samplerCtx.drawImage(sourceImage, 0, 0, cols, rows)

  const imageData = samplerCtx.getImageData(0, 0, cols, rows)
  const pixels = imageData.data

  const edgeMap = computeEdgeMap(imageData, cols, rows)

  // Contrast/brightness mapping
  const contrastMapped = contrast * 2.55
  const contrastFactor = (259 * (contrastMapped + 255)) / (255 * (259 - contrastMapped))
  const brightnessMapped = (brightness / 100) * 255

  const edgeWeight = renderMode === 'edge'
    ? (edgeEmphasis / 100) * 2.0
    : (edgeEmphasis / 100)

  const coverageThreshold = 1 - coverage / 100

  // --- Background ---
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 1. Fill background color
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 2. Draw source image with blur and opacity
  const bgAlpha = bgOpacity / 100
  if (bgAlpha > 0) {
    const offscreen = document.createElement('canvas')
    offscreen.width = canvasWidth
    offscreen.height = canvasHeight
    const offCtx = offscreen.getContext('2d')!
    if (bgBlur > 0) {
      const extend = bgBlur * 2
      offCtx.filter = `blur(${bgBlur}px)`
      offCtx.drawImage(sourceImage, imgX - extend, imgY - extend, imgW + extend * 2, imgH + extend * 2)
      offCtx.filter = 'none'
    } else {
      offCtx.drawImage(sourceImage, imgX, imgY, imgW, imgH)
    }
    ctx.save()
    ctx.globalAlpha = bgAlpha
    ctx.drawImage(offscreen, 0, 0)
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // --- Dot grid ---
  if (dotGrid) {
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
    const dotR = Math.max(0.5, fontSize * 0.06)
    ctx.beginPath()
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        ctx.moveTo((col + 0.5) * charW + dotR, (row + 0.5) * charH)
        ctx.arc((col + 0.5) * charW, (row + 0.5) * charH, dotR, 0, Math.PI * 2)
      }
    }
    ctx.fill()
    ctx.restore()
  }

  // --- Set blend mode ---
  ctx.save()
  ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation

  ctx.font = `${fontSize}px "Courier New", Courier, monospace`
  ctx.textBaseline = 'top'

  // --- Render characters / dots ---
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Sample directly from low-res buffer using row/col index
      const pixIdx = (row * cols + col) * 4
      let r = pixels[pixIdx]
      let g = pixels[pixIdx + 1]
      let b = pixels[pixIdx + 2]
      const a = pixels[pixIdx + 3]

      if (a === 0) continue

      // Apply brightness & contrast
      r = clamp(0, 255, contrastFactor * (r - 128) + 128 + brightnessMapped)
      g = clamp(0, 255, contrastFactor * (g - 128) + 128 + brightnessMapped)
      b = clamp(0, 255, contrastFactor * (b - 128) + 128 + brightnessMapped)

      const lum = 0.299 * r + 0.587 * g + 0.114 * b

      const edgeIdx = row * cols + col
      const edgeVal = edgeMap.data[edgeIdx]

      const brightnessScore = lum / 255
      const amplifiedEdge = Math.pow(edgeVal, 0.3)
      const edgeBoost = amplifiedEdge * edgeWeight * 4.0
      const visibility = Math.min(1, brightnessScore + edgeBoost)

      if (visibility < coverageThreshold) continue

      let normLum = lum / 255
      if (invert) normLum = 1 - normLum

      if (renderMode === 'dots') {
        const maxR = Math.min(charW, charH) * 0.5
        const dotRadius = maxR * (0.15 + 0.85 * normLum)
        if (dotRadius < 0.3) continue

        let finalAlpha = charOpacity / 100

        if (animated && animationFrame !== undefined) {
          const randomness = animRandomness / 100
          const scanPhase = row / rows
          const randPhase = ((col * 7919 + row * 6271 + col * col * 3571) % 10000) / 10000
          const phase = scanPhase * (1 - randomness) + randPhase * randomness
          const jitter = randomness * ((col * 1301 + row * 9377) % 1000) / 1000 * 0.3
          const t = ((animationFrame / (animSpeed / 16.67)) + phase + jitter) % 1
          const wave = Math.sin(t * Math.PI * 2)
          const intensity = animIntensity / 100
          const minAlpha = 1 - intensity
          finalAlpha = (charOpacity / 100) * (minAlpha + (1 - minAlpha) * (0.5 + 0.5 * wave))
        }

        ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${finalAlpha})`
        ctx.beginPath()
        ctx.arc((col + 0.5) * charW, (row + 0.5) * charH, dotRadius, 0, Math.PI * 2)
        ctx.fill()
      } else {
        let charScore: number
        if (renderMode === 'edge') {
          const edgeScore = Math.pow(edgeVal, 0.3) * (edgeEmphasis / 100) * 3.0
          charScore = clamp(0, 1, edgeScore + normLum * 0.15)
        } else {
          charScore = clamp(0, 1, normLum + edgeBoost * 1.5)
        }
        const charIdx = Math.min(chars.length - 1, Math.floor((1 - charScore) * chars.length))
        let finalChar = chars[charIdx]
        let finalAlpha = charOpacity / 100

        if (animated && animationFrame !== undefined) {
          const randomness = animRandomness / 100
          const scanPhase = row / rows
          const randPhase = ((col * 7919 + row * 6271 + col * col * 3571) % 10000) / 10000
          const phase = scanPhase * (1 - randomness) + randPhase * randomness
          const jitter = randomness * ((col * 1301 + row * 9377) % 1000) / 1000 * 0.3
          const t = ((animationFrame / (animSpeed / 16.67)) + phase + jitter) % 1
          const wave = Math.sin(t * Math.PI * 2)
          const intensity = animIntensity / 100
          const minAlpha = 1 - intensity
          finalAlpha = (charOpacity / 100) * (minAlpha + (1 - minAlpha) * (0.5 + 0.5 * wave))

          // Character shimmer
          if (intensity > 0.2 && chars.length > 1) {
            const shimmerChance = wave < (-0.3 + randomness * 0.5)
            if (shimmerChance) {
              const shift = (((randPhase * 100 + animationFrame * 0.01) | 0) % 3) - 1
              const newIdx = clamp(0, chars.length - 1, charIdx + shift)
              finalChar = chars[newIdx]
            }
          }
        }

        ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${finalAlpha})`
        ctx.fillText(finalChar, col * charW, row * charH)
      }
    }
  }

  ctx.restore()
}
