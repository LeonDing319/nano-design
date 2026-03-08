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

export function renderGlitch(
  ctx: CanvasRenderingContext2D,
  sourceImage: HTMLImageElement,
  params: GlitchParams,
  canvasWidth: number,
  canvasHeight: number,
  animationFrame?: number
) {
  const { stripeDensity, displacement, rgbSplit, rgbSplitDirection, clipShape, randomSeed, animation, animationSpeed } = params

  // 计算实际 seed（动画模式下混入帧号）
  const effectiveSeed = animation && animationFrame !== undefined
    ? randomSeed + Math.floor(animationFrame * animationSpeed * 0.1)
    : randomSeed

  const random = seededRandom(effectiveSeed)

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
    // 根据方向计算 dx/dy 分量
    const dirMap: Record<string, [number, number]> = {
      'right':      [ 1,  0],
      'left':       [-1,  0],
      'down':       [ 0,  1],
      'up':         [ 0, -1],
      'down-right': [ 0.707,  0.707],
      'down-left':  [-0.707,  0.707],
      'up-right':   [ 0.707, -0.707],
      'up-left':    [-0.707, -0.707],
    }
    const [dirX, dirY] = dirMap[rgbSplitDirection] || [1, 0]
    const splitAmount = rgbSplit * scale

    const channelColors = [
      { hex: '#ff0000', dx: dirX * splitAmount, dy: dirY * splitAmount },
      { hex: '#00ff00', dx: 0, dy: 0 },
      { hex: '#0000ff', dx: -dirX * splitAmount, dy: -dirY * splitAmount },
    ]

    ctx.globalCompositeOperation = 'screen'

    for (const { hex, dx, dy } of channelColors) {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvasWidth
      tempCanvas.height = canvasHeight
      const tempCtx = tempCanvas.getContext('2d')!

      // 绘制条纹 + 位移
      const stripeRandom = seededRandom(effectiveSeed)
      for (let i = 0; i < stripeCount; i++) {
        const sy = imgY + i * (stripeHeight + stripeGap)
        const offsetX = (stripeRandom() - 0.5) * displacement * scale * 2
        tempCtx.drawImage(
          sourceImage,
          0, (i * sourceImage.height) / stripeCount,
          sourceImage.width, sourceImage.height / stripeCount,
          imgX + offsetX + dx, sy + dy,
          imgW, stripeHeight
        )
      }

      // 用 multiply 混合纯色遮罩提取单通道，无需 getImageData 像素遍历
      tempCtx.globalCompositeOperation = 'multiply'
      tempCtx.fillStyle = hex
      tempCtx.fillRect(0, 0, canvasWidth, canvasHeight)

      ctx.drawImage(tempCanvas, 0, 0)
    }

    ctx.globalCompositeOperation = 'source-over'
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
