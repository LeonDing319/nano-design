import { GlitchParams } from '@/types'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

// GPU 加速双色调：通过 SVG filter 实现，避免 getImageData/putImageData 的 CPU-GPU 同步
let duotoneSvg: SVGSVGElement | null = null
let duotoneLastLight = ''
let duotoneLastDark = ''
let duotoneTempCanvas: HTMLCanvasElement | null = null
let dotMaskTileCanvas: HTMLCanvasElement | null = null
let dotMaskTileKey = ''

function ensureDuotoneFilter(lightHex: string, darkHex: string) {
  if (duotoneSvg && duotoneLastLight === lightHex && duotoneLastDark === darkHex) return
  const light = hexToRgb(lightHex)
  const dark = hexToRgb(darkHex)

  if (!duotoneSvg) {
    duotoneSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    duotoneSvg.setAttribute('width', '0')
    duotoneSvg.setAttribute('height', '0')
    duotoneSvg.style.position = 'absolute'
    duotoneSvg.style.pointerEvents = 'none'
    document.body.appendChild(duotoneSvg)
  }

  // feColorMatrix saturate=0 → 灰度；feComponentTransfer linear → 灰度映射到双色
  duotoneSvg.innerHTML = `<filter id="nano-duotone" color-interpolation-filters="sRGB">
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncR type="linear" slope="${(light[0] - dark[0]) / 255}" intercept="${dark[0] / 255}"/>
      <feFuncG type="linear" slope="${(light[1] - dark[1]) / 255}" intercept="${dark[1] / 255}"/>
      <feFuncB type="linear" slope="${(light[2] - dark[2]) / 255}" intercept="${dark[2] / 255}"/>
    </feComponentTransfer>
  </filter>`
  duotoneLastLight = lightHex
  duotoneLastDark = darkHex
}

function applyDuotone(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lightHex: string,
  darkHex: string
) {
  ensureDuotoneFilter(lightHex, darkHex)

  // 复制当前画布内容到临时 canvas
  if (!duotoneTempCanvas) duotoneTempCanvas = document.createElement('canvas')
  if (duotoneTempCanvas.width !== width || duotoneTempCanvas.height !== height) {
    duotoneTempCanvas.width = width
    duotoneTempCanvas.height = height
  }
  const tc = duotoneTempCanvas.getContext('2d')!
  tc.clearRect(0, 0, width, height)
  tc.drawImage(ctx.canvas, 0, 0)

  // 用 SVG filter 重新绘制（GPU 加速，无像素遍历）
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.filter = 'url(#nano-duotone)'
  ctx.drawImage(duotoneTempCanvas, 0, 0)
  ctx.filter = 'none'
  ctx.restore()
}

function ensureDotMaskTile(dotSize: number) {
  const clampedSize = Math.max(0.01, Math.min(6, dotSize))
  // 棋盘式错位：奇偶行横向错开，形成“角对角”连接感
  const pitch = Math.max(3, Math.round(clampedSize * 2.0 + 1))
  const blockSize = Math.max(1, Math.min(pitch, Math.round(clampedSize * 1.7)))
  const offset = Math.floor((pitch - blockSize) / 2)
  const tileSize = pitch * 2
  const key = `${pitch}-${blockSize}-${offset}-checker`

  if (dotMaskTileCanvas && dotMaskTileKey === key) return dotMaskTileCanvas

  dotMaskTileCanvas = document.createElement('canvas')
  dotMaskTileCanvas.width = tileSize
  dotMaskTileCanvas.height = tileSize
  const tileCtx = dotMaskTileCanvas.getContext('2d')!
  tileCtx.clearRect(0, 0, tileSize, tileSize)
  tileCtx.fillStyle = 'rgba(0,0,0,0.95)'
  // 左上 + 右下两块，repeat 后得到交错棋盘分布
  tileCtx.fillRect(offset, offset, blockSize, blockSize)
  tileCtx.fillRect(pitch + offset, pitch + offset, blockSize, blockSize)
  dotMaskTileKey = key

  return dotMaskTileCanvas
}

function applyDotMaskLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dotSize: number,
  dotOpacity: number
) {
  if (dotOpacity <= 0 || dotSize <= 0) return

  const tile = ensureDotMaskTile(dotSize)
  const pattern = ctx.createPattern(tile, 'repeat')
  if (!pattern) return

  const opacity = Math.max(0, Math.min(0.7, dotOpacity))

  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = opacity
  ctx.fillStyle = pattern
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

function getStripeOffsetX(
  stripeIndex: number,
  displacement: number,
  scale: number,
  animationFrame: number | undefined
) {
  if (displacement === 0) return 0

  const amplitude = displacement * scale
  // 每层独立的相位和方向（确定性随机）
  const direction = Math.sin(stripeIndex * 2.39996) > 0 ? 1 : -1
  const phase = stripeIndex * 1.73 + stripeIndex * stripeIndex * 0.31
  const bias = Math.sin(phase) * amplitude * 0.3

  if (animationFrame === undefined) {
    return bias * direction
  }

  // 每层独立速度和方向的摆动
  const speed = 0.025 + Math.abs(Math.sin(stripeIndex * 3.17)) * 0.02
  const swing = Math.sin(animationFrame * speed + phase) * amplitude * 2.0 * direction
  return swing + bias
}

// 返回全局垂直偏移量（像素，基于画布坐标系）
function getGlobalVerticalOffset(
  verticalSpeed: number,
  scale: number,
  animationFrame: number | undefined,
  imageHeight: number
) {
  if (verticalSpeed === 0 || animationFrame === undefined) return 0

  // 线性速度映射：verticalSpeed 越大，单帧位移越大
  const pxPerFrame = verticalSpeed * scale * 0.18
  const loopHeight = Math.max(1, imageHeight)
  // 单向下落，超出后循环
  return (animationFrame * pxPerFrame) % loopHeight
}

interface StripeSegment {
  srcY: number
  srcH: number
  destY: number
  destH: number
}

function buildStripeSegments(
  sourceHeight: number,
  imageY: number,
  imageHeight: number,
  stripeCount: number,
  stripeGap: number
): StripeSegment[] {
  if (stripeCount <= 1) {
    return [{ srcY: 0, srcH: sourceHeight, destY: imageY, destH: imageHeight }]
  }

  const usableHeight = imageHeight - stripeGap * (stripeCount - 1)
  const weights = Array.from({ length: stripeCount }, (_, i) => {
    const hash = Math.sin(i * 2.39996 + stripeCount * 0.17) * 43758.5453
    const r = hash - Math.floor(hash) // 0~1 伪随机
    // 大部分是细条（权重小），少数粗条（权重大）
    // r^2 让小值更集中，再加底值避免太窄
    return 0.15 + r * r * 2.5
  })
  const totalWeight = weights.reduce((acc, w) => acc + w, 0)

  const segments: StripeSegment[] = []
  let srcCursor = 0
  let destCursor = imageY
  let usedSrc = 0
  let usedDest = 0

  for (let i = 0; i < stripeCount; i++) {
    const ratio = weights[i] / totalWeight
    const srcH = i === stripeCount - 1 ? sourceHeight - usedSrc : sourceHeight * ratio
    const destH = i === stripeCount - 1 ? usableHeight - usedDest : usableHeight * ratio
    segments.push({
      srcY: srcCursor,
      srcH,
      destY: destCursor,
      destH,
    })
    srcCursor += srcH
    usedSrc += srcH
    destCursor += destH + stripeGap
    usedDest += destH
  }

  return segments
}

function drawStripe(
  targetCtx: CanvasRenderingContext2D,
  sourceImage: HTMLImageElement,
  imgX: number,
  imgY: number,
  imgW: number,
  imgH: number,
  destY: number,
  stripeHeight: number,
  offsetX: number,
  layerShiftY: number = 0
) {
  const drawY = Math.floor(destY + layerShiftY)
  const drawH = Math.ceil(stripeHeight) + 1

  // 裁剪到条纹区域
  targetCtx.save()
  targetCtx.beginPath()
  targetCtx.rect(imgX - Math.abs(offsetX) - 2, drawY, imgW + Math.abs(offsetX) * 2 + 4, drawH)
  targetCtx.clip()

  // 画完整图片，底图采样位置固定，只让“条纹层位置”滚动
  targetCtx.drawImage(sourceImage, imgX + offsetX, imgY, imgW, imgH)

  // 左右边缘补齐
  if (offsetX > 0) {
    targetCtx.drawImage(sourceImage, 0, 0, 1, sourceImage.height, imgX, imgY, offsetX + 2, imgH)
  } else if (offsetX < 0) {
    targetCtx.drawImage(sourceImage, sourceImage.width - 1, 0, 1, sourceImage.height, imgX + imgW + offsetX - 2, imgY, -offsetX + 2, imgH)
  }

  targetCtx.restore()
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
  const {
    stripeDensity,
    displacement,
    verticalSpeed,
    rgbSplit,
    rgbSplitDirection,
    rgbSplitDirectionAnim,
    clipShape,
    dotSize,
    dotOpacity,
  } = params

  // 清除画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 计算图片在画布中的居中位置和缩放
  const scale = Math.min(canvasWidth / sourceImage.width, canvasHeight / sourceImage.height)
  const imgW = sourceImage.width * scale
  const imgH = sourceImage.height * scale
  const imgX = (canvasWidth - imgW) / 2
  const imgY = (canvasHeight - imgH) / 2

  // 先固定画框，再叠加额外形状裁切（circle）
  ctx.save()
  ctx.beginPath()
  ctx.rect(imgX, imgY, imgW, imgH)
  ctx.clip()
  if (clipShape === 'circle') {
    ctx.beginPath()
    const cx = canvasWidth / 2
    const cy = canvasHeight / 2
    const radius = Math.min(imgW, imgH) / 2
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.clip()
  }

  // 先画完整原图做底，避免条纹偏移后露出黑底
  ctx.drawImage(sourceImage, imgX, imgY, imgW, imgH)

  // 计算条纹数量：参数越大分层越细，50 对应最细档
  const stripeCount = stripeDensity === 0 ? 1 : Math.max(1, Math.round(stripeDensity))
  // displacement 为 0 且无垂直滚动时留 1px 间隙让条纹可见，否则无缝
  const stripeGap = displacement === 0 && verticalSpeed === 0 && stripeCount > 1 ? 1 : 0
  const stripeSegments = buildStripeSegments(sourceImage.height, imgY, imgH, stripeCount, stripeGap)
  const globalVerticalOffset = getGlobalVerticalOffset(verticalSpeed, scale, animationFrame, imgH)

  // RGB 通道分离渲染（用 multiply 混合 + 纯色遮罩替代像素级通道提取）
  if (rgbSplit > 0) {
    // 自动旋转模式：多频正弦叠加，产生不规则的顺/逆时针交替运动
    let effectiveDirection = rgbSplitDirection
    if (rgbSplitDirectionAnim && animationFrame !== undefined) {
      const t = animationFrame / 60 // 秒
      // 三个不同频率的正弦叠加，产生有机的非均匀旋转感
      effectiveDirection = (
        Math.sin(t * 0.68) * 150 +
        Math.sin(t * 0.28) * 120 +
        Math.sin(t * 1.24) * 50
      ) % 360
      if (effectiveDirection < 0) effectiveDirection += 360
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
    for (let i = 0; i < stripeSegments.length; i++) {
      const segment = stripeSegments[i]
      const offsetX = getStripeOffsetX(i, displacement, scale, animationFrame)
      drawStripe(
        stripeCtx, sourceImage, imgX, imgY, imgW, imgH,
        segment.destY, segment.destH,
        offsetX, globalVerticalOffset
      )
      if (globalVerticalOffset > 0) {
        drawStripe(
          stripeCtx, sourceImage, imgX, imgY, imgW, imgH,
          segment.destY - imgH, segment.destH,
          offsetX, globalVerticalOffset
        )
      }
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
    for (let i = 0; i < stripeSegments.length; i++) {
      const segment = stripeSegments[i]
      const offsetX = getStripeOffsetX(i, displacement, scale, animationFrame)
      drawStripe(
        ctx, sourceImage, imgX, imgY, imgW, imgH,
        segment.destY, segment.destH,
        offsetX, globalVerticalOffset
      )
      if (globalVerticalOffset > 0) {
        drawStripe(
          ctx, sourceImage, imgX, imgY, imgW, imgH,
          segment.destY - imgH, segment.destH,
          offsetX, globalVerticalOffset
        )
      }
    }
  }

  if (params.duotone) {
    applyDuotone(ctx, ctx.canvas.width, ctx.canvas.height, params.duotoneLightColor, params.duotoneDarkColor)
  }

  applyDotMaskLayer(ctx, canvasWidth, canvasHeight, dotSize, dotOpacity)

  ctx.restore()
}
