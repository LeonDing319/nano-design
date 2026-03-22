import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import { GlitchParams, EffectType } from '@/types'

export async function exportPNG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return
      downloadBlob(blob, `${filename}.png`)
      resolve()
    }, 'image/png')
  })
}

export async function exportJPEG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return
      downloadBlob(blob, `${filename}.jpg`)
      resolve()
    }, 'image/jpeg', 0.92)
  })
}

export async function exportSVG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const dataURL = canvas.toDataURL('image/png')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
  <image href="${dataURL}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  downloadBlob(blob, `${filename}.svg`)
}

export async function exportPDF(canvas: HTMLCanvasElement, _filename: string): Promise<void> {
  const dataURL = canvas.toDataURL('image/png')
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>Export PDF</title><style>@media print{@page{size:${canvas.width}px ${canvas.height}px;margin:0}body{margin:0}}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000}</style></head><body><img src="${dataURL}" style="max-width:100%;max-height:100vh" onload="setTimeout(()=>{window.print();window.close()},200)"/></body></html>`)
  win.document.close()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportGIF(
  canvas: HTMLCanvasElement,
  renderFrame: (frameIndex: number) => void,
  options: { frames: number; delay: number; filename: string }
): Promise<void> {
  const { default: GIF } = await import('gif.js')

  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: canvas.width,
    height: canvas.height,
    workerScript: '/gif.worker.js',
  })

  for (let i = 0; i < options.frames; i++) {
    renderFrame(i)
    gif.addFrame(canvas, { copy: true, delay: options.delay })
  }

  return new Promise((resolve) => {
    gif.on('finished', (blob: Blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${options.filename}.gif`
      a.click()
      URL.revokeObjectURL(url)
      resolve()
    })
    gif.render()
  })
}


export async function exportMP4(
  canvas: HTMLCanvasElement,
  renderFrame: (frameIndex: number) => void,
  options: {
    duration: number
    fps: number
    filename: string
    onProgress?: (progress: number) => void
  }
): Promise<void> {
  const totalFrames = Math.round(options.duration * options.fps)
  const width = canvas.width % 2 === 0 ? canvas.width : canvas.width + 1
  const height = canvas.height % 2 === 0 ? canvas.height : canvas.height + 1

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: 'in-memory',
  })

  let codec = 'avc1.640028'
  try {
    const support = await VideoEncoder.isConfigSupported({
      codec,
      width,
      height,
      bitrate: 5_000_000,
    })
    if (!support.supported) codec = 'avc1.42001f'
  } catch {
    codec = 'avc1.42001f'
  }

  let encoderError: DOMException | Error | null = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta ?? undefined),
    error: (e) => { encoderError = e },
  })

  encoder.configure({
    codec,
    width,
    height,
    bitrate: 5_000_000,
    framerate: options.fps,
  })

  const frameDuration = 1_000_000 / options.fps // microseconds

  for (let i = 0; i < totalFrames; i++) {
    if (encoder.state === 'closed') {
      throw encoderError || new Error('VideoEncoder closed unexpectedly')
    }

    renderFrame(i)

    const frame = new VideoFrame(canvas, {
      timestamp: i * frameDuration,
      duration: frameDuration,
    })

    const keyFrame = i % (options.fps * 2) === 0
    encoder.encode(frame, { keyFrame })
    frame.close()

    // Throttle encoding queue
    while (encoder.encodeQueueSize > 5) {
      if (encoder.state === 'closed') break
      await new Promise(r => setTimeout(r, 1))
    }

    options.onProgress?.(i / totalFrames)
  }

  await encoder.flush()
  encoder.close()
  muxer.finalize()

  const buffer = (muxer.target as ArrayBufferTarget).buffer
  const blob = new Blob([buffer], { type: 'video/mp4' })
  downloadBlob(blob, `${options.filename}.mp4`)
  options.onProgress?.(1)
}

export async function exportVideoMP4(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  renderCurrentFrame: () => void,
  options: {
    fps: number
    filename: string
    onProgress?: (progress: number) => void
  }
): Promise<void> {
  const duration = video.duration
  const totalFrames = Math.round(duration * options.fps)
  const width = canvas.width % 2 === 0 ? canvas.width : canvas.width + 1
  const height = canvas.height % 2 === 0 ? canvas.height : canvas.height + 1

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: 'in-memory',
  })

  let codec = 'avc1.640028'
  try {
    const support = await VideoEncoder.isConfigSupported({
      codec, width, height, bitrate: 5_000_000,
    })
    if (!support.supported) codec = 'avc1.42001f'
  } catch {
    codec = 'avc1.42001f'
  }

  let encoderError: DOMException | Error | null = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta ?? undefined),
    error: (e) => { encoderError = e },
  })

  encoder.configure({
    codec, width, height,
    bitrate: 5_000_000,
    framerate: options.fps,
  })

  const frameDuration = 1_000_000 / options.fps
  const wasPlaying = !video.paused
  video.pause()

  for (let i = 0; i < totalFrames; i++) {
    if (encoder.state === 'closed') {
      throw encoderError || new Error('VideoEncoder closed unexpectedly')
    }

    const targetTime = (i / totalFrames) * duration
    video.currentTime = targetTime
    await new Promise<void>(r => {
      video.onseeked = () => r()
    })

    renderCurrentFrame()

    const frame = new VideoFrame(canvas, {
      timestamp: i * frameDuration,
      duration: frameDuration,
    })

    const keyFrame = i % (options.fps * 2) === 0
    encoder.encode(frame, { keyFrame })
    frame.close()

    while (encoder.encodeQueueSize > 5) {
      if (encoder.state === 'closed') break
      await new Promise(r => setTimeout(r, 1))
    }

    options.onProgress?.(i / totalFrames)
  }

  await encoder.flush()
  encoder.close()
  muxer.finalize()

  const buffer = (muxer.target as ArrayBufferTarget).buffer
  const blob = new Blob([buffer], { type: 'video/mp4' })
  downloadBlob(blob, `${options.filename}.mp4`)
  options.onProgress?.(1)

  if (wasPlaying) video.play()
}

export function generateHTMLCode(
  effect: EffectType,
  params: GlitchParams
): string {
  return generateGlitchHTML(params)
}

export function generateCanvasCode(
  effect: EffectType,
  params: GlitchParams
): string {
  return generateGlitchCanvasCode(params)
}

function generateGlitchHTML(params: GlitchParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Glitch Effect - Generated by Nano Design</title>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
    canvas { max-width: 100%; max-height: 100vh; }
  </style>
</head>
<body>
  <canvas id="glitchCanvas"></canvas>
  <script>
    // Glitch Effect - Generated by Nano Design
    // Parameters: ${JSON.stringify(params, null, 2)}

    const canvas = document.getElementById('glitchCanvas');
    const ctx = canvas.getContext('2d');
    const params = ${JSON.stringify(params)};

    // Replace with your image source
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      renderGlitch();
    };
    img.src = 'YOUR_IMAGE_URL_HERE';

    let frame = 0;
    function buildStripeSegments(sourceHeight, imageHeight, stripeCount, stripeGap) {
      if (stripeCount <= 1) {
        return [{ srcY: 0, srcH: sourceHeight, destY: 0, destH: imageHeight }];
      }
      const usableHeight = imageHeight - stripeGap * (stripeCount - 1);
      const weights = Array.from({ length: stripeCount }, (_, i) => {
        const waveA = Math.sin(i * 1.73 + stripeCount * 0.11);
        const waveB = Math.sin(i * 3.11 + 0.79);
        return Math.max(0.25, 1 + waveA * 0.45 + waveB * 0.25);
      });
      const totalWeight = weights.reduce((acc, w) => acc + w, 0);
      const segments = [];
      let srcCursor = 0;
      let destCursor = 0;
      let usedSrc = 0;
      let usedDest = 0;
      for (let i = 0; i < stripeCount; i++) {
        const ratio = weights[i] / totalWeight;
        const srcH = i === stripeCount - 1 ? sourceHeight - usedSrc : sourceHeight * ratio;
        const destH = i === stripeCount - 1 ? usableHeight - usedDest : usableHeight * ratio;
        segments.push({ srcY: srcCursor, srcH, destY: destCursor, destH });
        srcCursor += srcH; usedSrc += srcH;
        destCursor += destH + stripeGap; usedDest += destH;
      }
      return segments;
    }

    function getStripeOffset(stripeIndex) {
      if (params.displacement === 0) return 0;
      const amplitude = params.displacement;
      const phase = stripeIndex * 0.37;
      const bias = Math.sin(stripeIndex * 1.73) * amplitude * 0.25;
      const speed = 0.026;
      const globalSwing = Math.sin(frame * speed) * amplitude * 2.5;
      const localSwing = Math.sin(frame * speed * 1.25 + phase) * amplitude * 0.45;
      return bias + globalSwing + localSwing;
    }

    function getVerticalOffset() {
      if (params.verticalSpeed === 0) return 0;
      const pxPerFrame = params.verticalSpeed * 0.18;
      return (frame * pxPerFrame) % canvas.height;
    }

    function drawStripeWithVerticalWrap(segment, offsetX, verticalOffset) {
      const drawStripeAt = (drawY) => {
        const stripeH = Math.ceil(segment.destH) + 1;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-Math.abs(offsetX) - 2, drawY, canvas.width + Math.abs(offsetX) * 2 + 4, stripeH);
        ctx.clip();
        // 保持底图采样固定，只让条纹层位置滚动
        ctx.drawImage(img, offsetX, 0, canvas.width, canvas.height);
        if (offsetX > 0) {
          ctx.drawImage(img, 0, 0, 1, img.height, 0, 0, offsetX + 2, canvas.height);
        } else if (offsetX < 0) {
          ctx.drawImage(img, img.width - 1, 0, 1, img.height, canvas.width + offsetX - 2, 0, -offsetX + 2, canvas.height);
        }
        ctx.restore();
      };

      drawStripeAt(Math.floor(segment.destY + verticalOffset));
      if (verticalOffset > 0) {
        drawStripeAt(Math.floor(segment.destY + verticalOffset - canvas.height));
      }
    }

    function renderGlitch() {
      const shouldAnimate = params.rgbSplitDirectionAnim || params.displacement > 0 || params.verticalSpeed > 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const stripeCount = params.stripeDensity === 0 ? 1 : Math.max(1, Math.round(params.stripeDensity));
      const stripeGap = params.displacement === 0 && params.verticalSpeed === 0 && stripeCount > 1 ? 1 : 0;
      const stripeSegments = buildStripeSegments(img.height, canvas.height, stripeCount, stripeGap);
      const verticalOffset = getVerticalOffset();

      for (let i = 0; i < stripeSegments.length; i++) {
        const segment = stripeSegments[i];
        const offsetX = getStripeOffset(i);
        drawStripeWithVerticalWrap(segment, offsetX, verticalOffset);
      }

      if (shouldAnimate) {
        frame++;
        requestAnimationFrame(renderGlitch);
      }
    }
  </script>
</body>
</html>`
}

function generateGlitchCanvasCode(params: GlitchParams): string {
  return `// Glitch Effect - Canvas Code
// Generated by Nano Design
// Parameters: ${JSON.stringify(params)}

function renderGlitch(ctx, img, params, frame) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const stripeCount = params.stripeDensity === 0 ? 1 : Math.max(1, Math.round(params.stripeDensity));
  const stripeGap = params.displacement === 0 && params.verticalSpeed === 0 && stripeCount > 1 ? 1 : 0;
  const usableHeight = h - stripeGap * (stripeCount - 1);
  const verticalOffset = params.verticalSpeed === 0 ? 0 : (frame * params.verticalSpeed * 0.18) % h;
  const weights = Array.from({ length: stripeCount }, (_, i) => {
    const waveA = Math.sin(i * 1.73 + stripeCount * 0.11);
    const waveB = Math.sin(i * 3.11 + 0.79);
    return Math.max(0.25, 1 + waveA * 0.45 + waveB * 0.25);
  });
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let destCursor = 0, usedDest = 0;

  for (let i = 0; i < stripeCount; i++) {
    const amplitude = params.displacement;
    const phase = i * 0.37;
    const bias = Math.sin(i * 1.73) * amplitude * 0.25;
    const speed = 0.026;
    const globalSwing = Math.sin(frame * speed) * amplitude * 2.5;
    const localSwing = Math.sin(frame * speed * 1.25 + phase) * amplitude * 0.45;
    const offsetX = params.displacement === 0 ? 0 : (bias + globalSwing + localSwing);
    const ratio = weights[i] / totalWeight;
    const destH = i === stripeCount - 1 ? usableHeight - usedDest : usableHeight * ratio;
    const drawY = destCursor + verticalOffset;

    const drawStripeAt = (y) => {
      const stripeH = Math.ceil(destH) + 1;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-Math.abs(offsetX) - 2, y, w + Math.abs(offsetX) * 2 + 4, stripeH);
      ctx.clip();
      ctx.drawImage(img, offsetX, 0, w, h);
      if (offsetX > 0) {
        ctx.drawImage(img, 0, 0, 1, h, 0, 0, offsetX + 2, h);
      } else if (offsetX < 0) {
        ctx.drawImage(img, w - 1, 0, 1, h, w + offsetX - 2, 0, -offsetX + 2, h);
      }
      ctx.restore();
    };

    drawStripeAt(drawY);
    if (verticalOffset > 0) {
      drawStripeAt(drawY - h);
    }

    destCursor += destH + stripeGap; usedDest += destH;
  }
}

// Usage:
// const canvas = document.getElementById('myCanvas');
// const ctx = canvas.getContext('2d');
// const img = new Image();
// img.onload = () => renderGlitch(ctx, img, ${JSON.stringify(params)}, 0);
// img.src = 'your-image.jpg';
`
}


export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
