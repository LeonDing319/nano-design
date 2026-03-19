import { DreamGridParams } from '@/types'

export interface DreamGridLine {
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  alpha: number
  color: string
  dash?: number[]
}

export interface DreamGridBlock {
  x: number
  y: number
  width: number
  height: number
  alpha: number
  stroke: boolean
  color: string | string[]
  blendMode?: GlobalCompositeOperation
  pattern?: boolean
}

export interface DreamGridScanline {
  y: number
  height: number
  alpha: number
}

export interface DreamGridNode {
  x: number
  y: number
  size: number
  type: 'square' | 'cross'
  alpha: number
  color: string
}

export interface DreamGridLayout {
  lines: DreamGridLine[]
  blocks: DreamGridBlock[]
  accents: DreamGridBlock[]
  scanlines: DreamGridScanline[]
  nodes: DreamGridNode[]
}

export const DEFAULT_DREAM_GRID_PARAMS: DreamGridParams = {
  amount: 0,
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) return value < edge0 ? 0 : 1
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return x * x * (3 - 2 * x)
}

function fract(value: number) {
  return value - Math.floor(value)
}

function noise(seed: number) {
  return fract(Math.sin(seed * 12.9898 + 78.233) * 43758.5453123)
}

const SKELETON_COLORS = ['#f5f9ff', '#dff2ff', '#eef4ff', '#ebf3ff', '#333333', '#666666', '#999999']
const ACCENT_COLORS = [
  '#c8ff19',
  '#7dff00',
  '#25e8ff',
  '#3f7bff',
  '#ff4fd8',
  '#7f5cff',
  '#ff8b1f',
  '#ffe54a',
  '#3cf7ff',
  '#ff63b7',
]
const ACCENT_PAIRS: [string, string][] = [
  ['#c8ff19', '#7dff00'],
  ['#25e8ff', '#3f7bff'],
  ['#ff4fd8', '#7f5cff'],
  ['#ff8b1f', '#ffe54a'],
  ['#3cf7ff', '#ff63b7'],
  ['#ff0055', '#00ffcc'],
  ['#00ffcc', '#ffff00'],
]

function choosePalette(index: number) {
  return ACCENT_PAIRS[Math.floor(noise(index * 4.2) * ACCENT_PAIRS.length) % ACCENT_PAIRS.length]
}

function chooseAccentColor(index: number) {
  return ACCENT_COLORS[Math.floor(noise(index * 6.1) * ACCENT_COLORS.length) % ACCENT_COLORS.length]
}

function pickSkeletonColor(index: number) {
  return SKELETON_COLORS[Math.floor(noise(index * 5.1) * SKELETON_COLORS.length) % SKELETON_COLORS.length]
}

// Grid Snapping Helper
function snap(value: number, gridSize: number) {
  return Math.round(value / gridSize) * gridSize
}

// Gaussian-like random centered around 0.5 (range roughly 0 to 1)
function gaussianRandom(seed: number) {
  const u = 1 - noise(seed)
  const v = noise(seed + 100)
  return Math.max(0, Math.min(1, Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) / 6.0 + 0.5))
}

function centerWeightedPoint(width: number, height: number, seed: number, spread: number = 0.6) {
  // Use a softer gaussian approximation that doesn't collapse entirely to the center
  const u = noise(seed * 2.1)
  const v = noise(seed * 3.4)
  const radius = spread * Math.sqrt(-2.0 * Math.log(u === 0 ? 0.0001 : u))
  const theta = 2.0 * Math.PI * v
  
  const cx = 0.5 + radius * Math.cos(theta) * 0.15
  const cy = 0.5 + radius * Math.sin(theta) * 0.15
  
  return {
    x: clamp(cx * width, width * 0.15, width * 0.85),
    y: clamp(cy * height, height * 0.15, height * 0.85),
  }
}

export function buildDreamGridLayout(
  canvasWidth: number,
  canvasHeight: number,
  params: DreamGridParams
): DreamGridLayout {
  const amount = clamp(params.amount, 0, 100)
  const t = amount / 100
  const density = smoothstep(0, 1, t)
  const surge = smoothstep(0.55, 1, t)

  // Use a base grid size for snapping, scales with canvas
  const gridSize = Math.max(8, Math.round(canvasWidth / 60))

  const lines: DreamGridLine[] = []
  const blocks: DreamGridBlock[] = []
  const accents: DreamGridBlock[] = []
  const scanlines: DreamGridScanline[] = []
  const nodes: DreamGridNode[] = []

  // Background Grid blocks (instead of long lines)
  const bgBlockCount = Math.max(0, Math.round(mix(20, 80, density) + surge * 40))
  for (let i = 0; i < bgBlockCount; i++) {
    const nx = mix(noise(i * 11.1), gaussianRandom(i * 11.1), 0.5)
    const ny = mix(noise(i * 17.1), gaussianRandom(i * 17.1), 0.5)
    const x = snap(nx * canvasWidth, gridSize)
    const y = snap(ny * canvasHeight, gridSize)
    
    // 1:1 or 4:3 small blocks
    const sizeBase = gridSize * Math.max(1, Math.floor(noise(i * 3.1) * 3))
    const w = sizeBase * (noise(i) > 0.5 ? 1 : 1.33)
    const h = sizeBase * (noise(i) > 0.5 ? 1 : 1.33)

    blocks.push({
      x: snap(x - w * 0.5, gridSize),
      y: snap(y - h * 0.5, gridSize),
      width: Math.max(gridSize, snap(w, gridSize)),
      height: Math.max(gridSize, snap(h, gridSize)),
      alpha: mix(0.02, 0.08, density),
      stroke: noise(i * 4.2) > 0.5,
      color: pickSkeletonColor(i),
    })
  }

  // Cyberpunk Accents & Gradients (Main visual blocks)
  const accentCount = Math.max(0, Math.round(mix(40, 200, density) + surge * 150))
  for (let i = 0; i < accentCount; i++) {
    const pt = centerWeightedPoint(canvasWidth, canvasHeight, i + 301, 1.2)
    
    // Mix of 1:1, 4:3, 5:3, and small square dots
    const shapeTypeRoll = noise(i * 2.9 + 4.4)
    let rawW, rawH
    if (shapeTypeRoll < 0.25) {
      // Small square dots (particles)
      rawW = gridSize * (noise(i * 7.1) > 0.5 ? 0.5 : 1)
      rawH = rawW
    } else if (shapeTypeRoll < 0.5) {
      // 1:1 Square
      const size = canvasWidth * mix(0.015, 0.06, noise(i))
      rawW = size
      rawH = size
    } else if (shapeTypeRoll < 0.8) {
      // 4:3 Rectangle
      const base = canvasWidth * mix(0.015, 0.06, noise(i))
      if (noise(i * 1.1) > 0.5) {
        rawW = base * 1.33
        rawH = base
      } else {
        rawW = base
        rawH = base * 1.33
      }
    } else {
      // 5:3 Rectangle
      const base = canvasWidth * mix(0.01, 0.05, noise(i))
      if (noise(i * 1.2) > 0.5) {
        rawW = base * 1.66
        rawH = base
      } else {
        rawW = base
        rawH = base * 1.66
      }
    }
    
    // Tiny fragments can be smaller than gridSize, others snap to grid
    const w = shapeTypeRoll < 0.25 ? rawW : Math.max(gridSize, snap(rawW, gridSize))
    const h = shapeTypeRoll < 0.25 ? rawH : Math.max(gridSize, snap(rawH, gridSize))
    
    // Snap position, and offset by half size to keep centered on point but aligned to grid
    const x = shapeTypeRoll < 0.25 ? pt.x : snap(pt.x - w * 0.5, gridSize)
    const y = shapeTypeRoll < 0.25 ? pt.y : snap(pt.y - h * 0.5, gridSize)
    
    const fillAccent = noise(i * 7.4) < mix(0.5, 0.85, surge)
    const useGradient = fillAccent && noise(i * 8.8) > 0.4
    
    let color: string | string[]
    if (useGradient) {
      color = choosePalette(i)
    } else {
      color = fillAccent ? chooseAccentColor(i + 300) : pickSkeletonColor(i + 400)
    }
    
    const isDarkBlock = noise(i * 12.3) > 0.8
    if (isDarkBlock) {
      color = noise(i) > 0.5 ? '#000000' : '#111111'
    }

    accents.push({
      x, y, width: w, height: h,
      alpha: isDarkBlock ? 0.9 : (fillAccent ? mix(0.7, 1.0, density) : mix(0.3, 0.6, density)),
      stroke: !fillAccent && !isDarkBlock,
      color: color,
      blendMode: (fillAccent && !isDarkBlock && noise(i * 3.1) > 0.8) ? 'screen' : 'source-over',
      pattern: noise(i * 4.5) > 0.7 
    })

    // Nodes (Crosses and Squares) - cluster around accents
    if (noise(i * 3.6) > mix(0.6, 0.3, surge)) {
      const isCross = noise(i * 1.1) > 0.5
      const nodeX = snap(pt.x, gridSize)
      const nodeY = snap(pt.y, gridSize)
      nodes.push({
        x: nodeX,
        y: nodeY,
        size: isCross ? gridSize * 0.5 : gridSize * 0.3,
        type: isCross ? 'cross' : 'square',
        alpha: mix(0.7, 1.0, density),
        color: chooseAccentColor(i * 2),
      })
    }
  }

  // Small background outline blocks
  const blockCount = Math.max(0, Math.round(mix(20, 80, density) + surge * 50))
  for (let i = 0; i < blockCount; i++) {
    const pt = centerWeightedPoint(canvasWidth, canvasHeight, i + 101, 1.5)
    
    // Mix of 1:1, 4:3
    const isSquare = noise(i * 6.3) > 0.5
    const baseRaw = canvasWidth * mix(0.01, 0.05, noise(i))
    let wRaw = baseRaw
    let hRaw = baseRaw
    
    if (!isSquare) {
      if (noise(i * 2.1) > 0.5) {
        wRaw *= 1.33
      } else {
        hRaw *= 1.33
      }
    }
    
    const w = Math.max(gridSize, snap(wRaw, gridSize))
    const h = Math.max(gridSize, snap(hRaw, gridSize))
    
    const isStroke = noise(i * 9.9) > 0.2 // heavily favor strokes for background structure
    
    blocks.push({
      x: snap(pt.x - w * 0.5, gridSize),
      y: snap(pt.y - h * 0.5, gridSize),
      width: w,
      height: h,
      alpha: mix(0.2, 0.4, density),
      stroke: isStroke,
      color: pickSkeletonColor(i + 200),
      blendMode: 'source-over',
      pattern: !isStroke && noise(i * 5.5) > 0.5
    })
  }

  // Scanlines
  const scanlineCount = Math.max(0, Math.round(mix(2, 8, density) + surge * 5))
  for (let i = 0; i < scanlineCount; i++) {
    const y = noise(i * 14.2 + 3) * canvasHeight
    scanlines.push({
      y: y,
      height: 1 + Math.round(noise(i * 2.1 + 8) * 3),
      alpha: mix(0.02, 0.08, density),
    })
  }

  return { lines, blocks, accents, scanlines, nodes }
}

export function renderDreamGridOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  params: DreamGridParams
) {
  if (params.amount <= 0 || canvasWidth <= 0 || canvasHeight <= 0) return

  const layout = buildDreamGridLayout(canvasWidth, canvasHeight, params)
  
  const t = clamp(params.amount, 0, 100) / 100
  const surge = smoothstep(0.55, 1, t)
  const glow = 0.0 // Remove massive glow to avoid hazy look

  ctx.save()

  // Draw lines
  for (const line of layout.lines) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(line.x1, line.y1)
    ctx.lineTo(line.x2, line.y2)
    ctx.lineWidth = line.width
    ctx.strokeStyle = line.color
    ctx.globalAlpha = line.alpha
    if (line.dash) {
      ctx.setLineDash(line.dash)
    }
    // Minimal or no shadow blur for sharper mechanical feel
    ctx.stroke()
    ctx.restore()
  }

  // Helper for drawing blocks
  const drawBlock = (block: DreamGridBlock, isAccent: boolean) => {
    ctx.save()
    ctx.globalAlpha = block.alpha
    if (block.blendMode) {
      ctx.globalCompositeOperation = block.blendMode
    }

    if (block.stroke) {
      ctx.strokeStyle = block.color as string
      ctx.lineWidth = isAccent ? 0.6 + surge * 0.2 : 0.3 + surge * 0.1
      ctx.strokeRect(block.x, block.y, block.width, block.height)
    } else {
      if (Array.isArray(block.color)) {
        const grad = ctx.createLinearGradient(block.x, block.y, block.x + block.width, block.y + block.height)
        grad.addColorStop(0, block.color[0])
        grad.addColorStop(1, block.color[1])
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = block.color
      }
      ctx.fillRect(block.x, block.y, block.width, block.height)

      if (block.pattern && !Array.isArray(block.color)) {
        ctx.save()
        // Draw dark dense stripes over the color block
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = 'rgba(0,0,0,0.8)'
        for(let py = block.y; py < block.y + block.height; py += 3) {
          ctx.fillRect(block.x, py, block.width, 1.5)
        }
        ctx.restore()
      }
    }
    ctx.restore()
  }

  for (const block of layout.blocks) {
    drawBlock(block, false)
  }

  for (const accent of layout.accents) {
    drawBlock(accent, true)
  }

  for (const node of layout.nodes) {
    ctx.save()
    ctx.fillStyle = node.color
    ctx.strokeStyle = node.color
    ctx.globalAlpha = node.alpha
    // Minimal shadow for sharp rendering
    if (glow > 0) {
      ctx.shadowBlur = 5 * glow
      ctx.shadowColor = node.color
    }

    if (node.type === 'square') {
      ctx.fillRect(node.x - node.size * 0.5, node.y - node.size * 0.5, node.size, node.size)
    } else if (node.type === 'cross') {
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(node.x - node.size, node.y)
      ctx.lineTo(node.x + node.size, node.y)
      ctx.moveTo(node.x, node.y - node.size)
      ctx.lineTo(node.x, node.y + node.size)
      ctx.stroke()
    }
    ctx.restore()
  }

  for (const scanline of layout.scanlines) {
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = scanline.alpha
    ctx.fillRect(0, scanline.y, canvasWidth, scanline.height)
    ctx.restore()
  }

  ctx.restore()
}