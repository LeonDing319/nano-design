import { GlitchParams } from '@/types'

// 确定性伪随机数生成器 (mulberry32)
function seededRandom(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function drawShiftedWithEdgeExtend(
  targetCtx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  dx: number,
  dy: number,
  width: number,
  height: number
) {
  // 扩展画布边缘像素，模拟 clamp-to-edge 采样，避免偏移后出现透明边
  const padX = Math.ceil(Math.abs(dx)) + 2
  const padY = Math.ceil(Math.abs(dy)) + 2

  const expandedCanvas = document.createElement('canvas')
  expandedCanvas.width = width + padX * 2
  expandedCanvas.height = height + padY * 2
  const expandedCtx = expandedCanvas.getContext('2d')!

  // 中心原图
  expandedCtx.drawImage(sourceCanvas, padX, padY)

  // 四边延展
  expandedCtx.drawImage(sourceCanvas, 0, 0, 1, height, 0, padY, padX, height)
  expandedCtx.drawImage(sourceCanvas, width - 1, 0, 1, height, padX + width, padY, padX, height)
  expandedCtx.drawImage(sourceCanvas, 0, 0, width, 1, padX, 0, width, padY)
  expandedCtx.drawImage(sourceCanvas, 0, height - 1, width, 1, padX, padY + height, width, padY)

  // 四角延展
  expandedCtx.drawImage(sourceCanvas, 0, 0, 1, 1, 0, 0, padX, padY)
  expandedCtx.drawImage(sourceCanvas, width - 1, 0, 1, 1, padX + width, 0, padX, padY)
  expandedCtx.drawImage(sourceCanvas, 0, height - 1, 1, 1, 0, padY + height, padX, padY)
  expandedCtx.drawImage(sourceCanvas, width - 1, height - 1, 1, 1, padX + width, padY + height, padX, padY)

  // 从扩展画布采样平移后的区域
  targetCtx.drawImage(
    expandedCanvas,
    padX - dx,
    padY - dy,
    width,
    height,
    0,
    0,
    width,
    height
  )
}

export function renderGlitch(
  ctx: CanvasRenderingContext2D,
  sourceImage: HTMLImageElement,
  params: GlitchParams,
  canvasWidth: number,
  canvasHeight: number,
  animationFrame?: number
) {
  const { stripeDensity, displacement, rgbSplit, rgbSplitDirection, rgbSplitDirectionAnim, clipShape, randomSeed, animation, animationSpeed } = params

  // 计算实际 seed（动画模式下混入帧号）
  const effectiveSeed = animation && animationFrame !== undefined
    ? randomSeed + Math.floor(animationFrame * animationSpeed * 0.1)
    : randomSeed

  // 清除画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 计算图片在画布中的居中位置和缩放
  const scale = Math.min(canvasWidth / sourceImage.width, canvasHeight / sourceImage.height)
  const imgW = sourceImage.width * scale
  const imgH = sourceImage.height * scale
  const imgX = (canvasWidth - imgW) / 2
  const imgY = (canvasHeight - imgH) / 2

  // 应用裁切形状
  if (clipShape !== 'none') {
    ctx.save()
    ctx.beginPath()
    if (clipShape === 'circle') {
      const cx = canvasWidth / 2
      const cy = canvasHeight / 2
      const radius = Math.min(imgW, imgH) / 2
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    } else {
      ctx.rect(imgX, imgY, imgW, imgH)
    }
    ctx.clip()
  }

  // 计算条纹数量，stripeDensity=0 时退化为单条（整图）
  const stripeCount = stripeDensity === 0 ? 1 : Math.max(1, Math.floor(stripeDensity * 0.5))
  // displacement 为 0 时留 1px 间隙，让条纹可见
  const stripeGap = displacement === 0 && stripeCount > 1 ? 1 : 0
  const stripeHeight = (imgH - stripeGap * (stripeCount - 1)) / stripeCount

  // RGB 通道分离渲染（用 multiply 混合 + 纯色遮罩替代像素级通道提取）
  if (rgbSplit > 0) {
    // 自动旋转模式：用三角波在 0->360->0 之间往返，周期约 4 秒（240 帧 @60fps）
    let effectiveDirection = rgbSplitDirection
    if (rgbSplitDirectionAnim && animationFrame !== undefined) {
      const cycle = 1200
      const pos = animationFrame % cycle
      effectiveDirection = pos < cycle / 2
        ? (pos / (cycle / 2)) * 360
        : (1 - (pos - cycle / 2) / (cycle / 2)) * 360
    }
    const rad = effectiveDirection * Math.PI / 180
    const dirX = Math.cos(rad)
    const dirY = Math.sin(rad)
    const splitAmount = rgbSplit * scale * 4.0

    const channelColors = [
      { hex: '#ff0000', dx: dirX * splitAmount, dy: dirY * splitAmount },
      { hex: '#00ff00', dx: 0, dy: 0 },
      { hex: '#0000ff', dx: -dirX * splitAmount, dy: -dirY * splitAmount },
    ]

    // 预渲染条纹（不含通道偏移），供三通道复用
    const stripeCanvas = document.createElement('canvas')
    stripeCanvas.width = canvasWidth
    stripeCanvas.height = canvasHeight
    const stripeCtx = stripeCanvas.getContext('2d')!
    const stripeRandom = seededRandom(effectiveSeed)
    for (let i = 0; i < stripeCount; i++) {
      const sy = imgY + i * (stripeHeight + stripeGap)
      const offsetX = (stripeRandom() - 0.5) * displacement * scale * 2
      stripeCtx.drawImage(
        sourceImage,
        0, (i * sourceImage.height) / stripeCount,
        sourceImage.width, sourceImage.height / stripeCount,
        imgX + offsetX, sy,
        imgW, stripeHeight
      )
    }

    // RGB split 效果合成到独立 canvas
    const rgbCanvas = document.createElement('canvas')
    rgbCanvas.width = canvasWidth
    rgbCanvas.height = canvasHeight
    const rgbCtx = rgbCanvas.getContext('2d')!
    rgbCtx.globalCompositeOperation = 'screen'

    for (const { hex, dx, dy } of channelColors) {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvasWidth
      tempCanvas.height = canvasHeight
      const tempCtx = tempCanvas.getContext('2d')!

      drawShiftedWithEdgeExtend(tempCtx, stripeCanvas, dx, dy, canvasWidth, canvasHeight)

      tempCtx.globalCompositeOperation = 'multiply'
      tempCtx.fillStyle = hex
      tempCtx.fillRect(0, 0, canvasWidth, canvasHeight)

      tempCtx.globalCompositeOperation = 'destination-in'
      tempCtx.drawImage(stripeCanvas, 0, 0)

      rgbCtx.drawImage(tempCanvas, 0, 0)
    }

    // 再次约束 alpha，确保输出区域与条纹底图一致
    rgbCtx.globalCompositeOperation = 'destination-in'
    rgbCtx.drawImage(stripeCanvas, 0, 0)
    ctx.drawImage(rgbCanvas, 0, 0)
  } else {
    // 无 RGB 分离，直接条纹位移
    const stripeRandom = seededRandom(effectiveSeed)
    for (let i = 0; i < stripeCount; i++) {
      const sy = imgY + i * (stripeHeight + stripeGap)
      const offsetX = (stripeRandom() - 0.5) * displacement * scale * 2
      ctx.drawImage(
        sourceImage,
        0, (i * sourceImage.height) / stripeCount,
        sourceImage.width, sourceImage.height / stripeCount,
        imgX + offsetX, sy,
        imgW, stripeHeight
      )
    }
  }

  if (clipShape !== 'none') {
    ctx.restore()
  }
}
