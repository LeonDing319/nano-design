# 2049 Design V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web-based image art effect generator with Glitch and ASCII Art effects, preset templates, 4 export formats, and i18n support.

**Architecture:** Single-page Next.js app with Canvas-based unified rendering. Pure logic in `engines/`, React components for UI, useReducer+Context for state. All image processing client-side.

**Tech Stack:** Next.js 15 (App Router, SSG), Tailwind CSS 4, next-intl, gif.js, lucide-react

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: Initialize Next.js project**

```bash
cd "/Users/admin/Leon/VibeCoding/2049 Design"
npx create-next-app@latest 2049-design --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

When prompted: use defaults (App Router, src dir, Tailwind, ESLint).

**Step 2: Install dependencies**

```bash
cd "/Users/admin/Leon/VibeCoding/2049 Design/2049-design"
npm install next-intl lucide-react gif.js
npm install -D @types/gif.js
```

**Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on localhost:3000, default Next.js page renders.

**Step 4: Clean up default files**

Remove default content from `src/app/page.tsx`, keep only a simple placeholder:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen">
      <h1>2049 Design</h1>
    </main>
  )
}
```

Clean `src/app/globals.css` to keep only Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 5: Verify clean state**

```bash
npm run dev
```

Expected: Page shows "2049 Design" text on white background.

**Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js project with Tailwind and dependencies"
```

---

## Task 2: Type Definitions & Presets

**Files:**
- Create: `src/types/index.ts`
- Create: `src/presets/glitch-presets.ts`
- Create: `src/presets/ascii-presets.ts`

**Step 1: Create type definitions**

Create `src/types/index.ts`:

```typescript
export type EffectType = 'glitch' | 'ascii'

export interface GlitchParams {
  stripeDensity: number      // 1-100
  displacement: number       // 0-100
  rgbSplit: number           // 0-50
  clipShape: 'circle' | 'rectangle' | 'none'
  randomSeed: number         // 0-9999
  animation: boolean
  animationSpeed: number     // 1-10
}

export interface AsciiParams {
  charDensity: number        // 1-100
  charSet: 'standard' | 'minimal' | 'blocks' | 'custom'
  customChars?: string
  fontSize: number           // 4-24
  colorMode: 'bw' | 'color' | 'mono'
  monoColor?: string
  bgColor: string
  invert: boolean
}

export type ExportFormat = 'png' | 'gif' | 'html' | 'canvas-code'

export interface AppState {
  image: HTMLImageElement | null
  activeEffect: EffectType
  glitchParams: GlitchParams
  asciiParams: AsciiParams
  locale: 'zh' | 'en'
}

export interface Preset<T> {
  id: string
  name: string
  nameZh: string
  params: T
}
```

**Step 2: Create Glitch presets**

Create `src/presets/glitch-presets.ts`:

```typescript
import { GlitchParams, Preset } from '@/types'

export const GLITCH_PRESETS: Preset<GlitchParams>[] = [
  {
    id: 'light-glitch',
    name: 'Light Glitch',
    nameZh: '轻微故障',
    params: {
      stripeDensity: 20,
      displacement: 15,
      rgbSplit: 5,
      clipShape: 'none',
      randomSeed: 42,
      animation: false,
      animationSpeed: 5,
    },
  },
  {
    id: 'heavy-damage',
    name: 'Heavy Damage',
    nameZh: '重度损坏',
    params: {
      stripeDensity: 60,
      displacement: 80,
      rgbSplit: 30,
      clipShape: 'none',
      randomSeed: 42,
      animation: false,
      animationSpeed: 5,
    },
  },
  {
    id: 'retro-crt',
    name: 'Retro CRT',
    nameZh: '复古 CRT',
    params: {
      stripeDensity: 80,
      displacement: 10,
      rgbSplit: 15,
      clipShape: 'rectangle',
      randomSeed: 42,
      animation: true,
      animationSpeed: 3,
    },
  },
  {
    id: 'cyber-pulse',
    name: 'Cyber Pulse',
    nameZh: '赛博脉冲',
    params: {
      stripeDensity: 40,
      displacement: 50,
      rgbSplit: 25,
      clipShape: 'circle',
      randomSeed: 42,
      animation: true,
      animationSpeed: 7,
    },
  },
]

export const DEFAULT_GLITCH_PARAMS: GlitchParams = GLITCH_PRESETS[0].params
```

**Step 3: Create ASCII presets**

Create `src/presets/ascii-presets.ts`:

```typescript
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

export const DEFAULT_ASCII_PARAMS: AsciiParams = ASCII_PRESETS[0].params
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 5: Commit**

```bash
git add src/types/ src/presets/
git commit -m "feat: add type definitions and preset templates"
```

---

## Task 3: State Management (useReducer + Context)

**Files:**
- Create: `src/hooks/useEffectParams.ts`
- Create: `src/hooks/useImageUpload.ts`

**Step 1: Create effect params hook with reducer**

Create `src/hooks/useEffectParams.ts`:

```typescript
'use client'

import { useReducer, createContext, useContext } from 'react'
import { AppState, EffectType, GlitchParams, AsciiParams } from '@/types'
import { DEFAULT_GLITCH_PARAMS } from '@/presets/glitch-presets'
import { DEFAULT_ASCII_PARAMS } from '@/presets/ascii-presets'

type Action =
  | { type: 'SET_IMAGE'; payload: HTMLImageElement | null }
  | { type: 'SET_EFFECT'; payload: EffectType }
  | { type: 'SET_GLITCH_PARAMS'; payload: Partial<GlitchParams> }
  | { type: 'SET_ASCII_PARAMS'; payload: Partial<AsciiParams> }
  | { type: 'SET_GLITCH_PRESET'; payload: GlitchParams }
  | { type: 'SET_ASCII_PRESET'; payload: AsciiParams }
  | { type: 'SET_LOCALE'; payload: 'zh' | 'en' }

const initialState: AppState = {
  image: null,
  activeEffect: 'glitch',
  glitchParams: DEFAULT_GLITCH_PARAMS,
  asciiParams: DEFAULT_ASCII_PARAMS,
  locale: 'en',
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_IMAGE':
      return { ...state, image: action.payload }
    case 'SET_EFFECT':
      return { ...state, activeEffect: action.payload }
    case 'SET_GLITCH_PARAMS':
      return { ...state, glitchParams: { ...state.glitchParams, ...action.payload } }
    case 'SET_ASCII_PARAMS':
      return { ...state, asciiParams: { ...state.asciiParams, ...action.payload } }
    case 'SET_GLITCH_PRESET':
      return { ...state, glitchParams: action.payload }
    case 'SET_ASCII_PRESET':
      return { ...state, asciiParams: action.payload }
    case 'SET_LOCALE':
      return { ...state, locale: action.payload }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
}

export const AppContext = createContext<AppContextType | null>(null)

export function useAppState() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppState must be used within AppProvider')
  return context
}

export function useAppReducer() {
  return useReducer(reducer, initialState)
}
```

**Step 2: Create image upload hook**

Create `src/hooks/useImageUpload.ts`:

```typescript
'use client'

import { useCallback } from 'react'
import { useAppState } from './useEffectParams'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function useImageUpload() {
  const { dispatch } = useAppState()

  const loadImage = useCallback((file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        reject(new Error('Unsupported file type. Use JPG, PNG, or WebP.'))
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error('File too large. Maximum size is 10MB.'))
        return
      }

      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image.'))
      }
      img.src = url
    })
  }, [])

  const handleUpload = useCallback(async (file: File) => {
    try {
      const img = await loadImage(file)
      dispatch({ type: 'SET_IMAGE', payload: img })
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }, [loadImage, dispatch])

  return { handleUpload }
}
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat: add state management with useReducer and image upload hook"
```

---

## Task 4: Glitch Rendering Engine

**Files:**
- Create: `src/engines/glitch.ts`

**Step 1: Implement Glitch engine**

Create `src/engines/glitch.ts`:

```typescript
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
  const { stripeDensity, displacement, rgbSplit, clipShape, randomSeed, animation, animationSpeed } = params

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

  // 计算条纹数量
  const stripeCount = Math.max(1, Math.floor(stripeDensity * 0.5))
  const stripeHeight = imgH / stripeCount

  // RGB 通道分离渲染
  if (rgbSplit > 0) {
    const offsets = [
      { color: 'red', dx: rgbSplit * scale },
      { color: 'green', dx: 0 },
      { color: 'blue', dx: -rgbSplit * scale },
    ]

    ctx.globalCompositeOperation = 'screen'

    for (const { color, dx } of offsets) {
      // 创建临时 canvas 做通道分离
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvasWidth
      tempCanvas.height = canvasHeight
      const tempCtx = tempCanvas.getContext('2d')!

      // 绘制条纹 + 位移
      const stripeRandom = seededRandom(effectiveSeed)
      for (let i = 0; i < stripeCount; i++) {
        const sy = imgY + i * stripeHeight
        const offsetX = (stripeRandom() - 0.5) * displacement * scale * 2
        tempCtx.drawImage(
          sourceImage,
          0, (i * sourceImage.height) / stripeCount,
          sourceImage.width, sourceImage.height / stripeCount,
          imgX + offsetX + dx, sy,
          imgW, stripeHeight + 1
        )
      }

      // 提取单色通道
      const imageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight)
      const data = imageData.data
      for (let j = 0; j < data.length; j += 4) {
        if (color === 'red') { data[j + 1] = 0; data[j + 2] = 0 }
        else if (color === 'green') { data[j] = 0; data[j + 2] = 0 }
        else { data[j] = 0; data[j + 1] = 0 }
      }
      tempCtx.putImageData(imageData, 0, 0)
      ctx.drawImage(tempCanvas, 0, 0)
    }

    ctx.globalCompositeOperation = 'source-over'
  } else {
    // 无 RGB 分离，直接条纹位移
    const stripeRandom = seededRandom(effectiveSeed)
    for (let i = 0; i < stripeCount; i++) {
      const sy = imgY + i * stripeHeight
      const offsetX = (stripeRandom() - 0.5) * displacement * scale * 2
      ctx.drawImage(
        sourceImage,
        0, (i * sourceImage.height) / stripeCount,
        sourceImage.width, sourceImage.height / stripeCount,
        imgX + offsetX, sy,
        imgW, stripeHeight + 1
      )
    }
  }

  if (clipShape !== 'none') {
    ctx.restore()
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/engines/glitch.ts
git commit -m "feat: implement Glitch rendering engine with stripe displacement and RGB split"
```

---

## Task 5: ASCII Art Rendering Engine

**Files:**
- Create: `src/engines/ascii.ts`

**Step 1: Implement ASCII engine**

Create `src/engines/ascii.ts`:

```typescript
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
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/engines/ascii.ts
git commit -m "feat: implement ASCII Art rendering engine with character mapping"
```

---

## Task 6: Export Engine

**Files:**
- Create: `src/engines/exporter.ts`

**Step 1: Implement export engine**

Create `src/engines/exporter.ts`:

```typescript
import { ExportFormat, GlitchParams, AsciiParams, EffectType } from '@/types'

export async function exportPNG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.png`
      a.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
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

export function generateHTMLCode(
  effect: EffectType,
  params: GlitchParams | AsciiParams
): string {
  if (effect === 'glitch') {
    return generateGlitchHTML(params as GlitchParams)
  }
  return generateAsciiHTML(params as AsciiParams)
}

export function generateCanvasCode(
  effect: EffectType,
  params: GlitchParams | AsciiParams
): string {
  if (effect === 'glitch') {
    return generateGlitchCanvasCode(params as GlitchParams)
  }
  return generateAsciiCanvasCode(params as AsciiParams)
}

function generateGlitchHTML(params: GlitchParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Glitch Effect - Generated by 2049 Design</title>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
    canvas { max-width: 100%; max-height: 100vh; }
  </style>
</head>
<body>
  <canvas id="glitchCanvas"></canvas>
  <script>
    // Glitch Effect - Generated by 2049 Design
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

    function seededRandom(seed) {
      return function() {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    let frame = 0;
    function renderGlitch() {
      const seed = params.animation ? params.randomSeed + Math.floor(frame * params.animationSpeed * 0.1) : params.randomSeed;
      const random = seededRandom(seed);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const stripeCount = Math.max(1, Math.floor(params.stripeDensity * 0.5));
      const stripeHeight = canvas.height / stripeCount;

      for (let i = 0; i < stripeCount; i++) {
        const offsetX = (random() - 0.5) * params.displacement * 2;
        ctx.drawImage(img, 0, (i * img.height) / stripeCount, img.width, img.height / stripeCount,
          offsetX, i * stripeHeight, canvas.width, stripeHeight + 1);
      }

      if (params.animation) {
        frame++;
        requestAnimationFrame(renderGlitch);
      }
    }
  </script>
</body>
</html>`
}

function generateAsciiHTML(params: AsciiParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASCII Art - Generated by 2049 Design</title>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: ${params.bgColor}; }
    canvas { max-width: 100%; max-height: 100vh; }
  </style>
</head>
<body>
  <canvas id="asciiCanvas"></canvas>
  <script>
    // ASCII Art Effect - Generated by 2049 Design
    // Parameters: ${JSON.stringify(params, null, 2)}

    const canvas = document.getElementById('asciiCanvas');
    const ctx = canvas.getContext('2d');
    const params = ${JSON.stringify(params)};
    const charSets = { standard: ' .:-=+*#%@', minimal: ' .:+#', blocks: ' ░▒▓█' };
    const chars = params.charSet === 'custom' && params.customChars ? params.customChars : charSets[params.charSet] || charSets.standard;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = 800;
      canvas.height = 600;
      renderAscii();
    };
    img.src = 'YOUR_IMAGE_URL_HERE';

    function renderAscii() {
      const charWidth = params.fontSize * 0.6;
      const cols = Math.max(1, Math.floor((canvas.width * params.charDensity / 100) / charWidth));
      const rows = Math.max(1, Math.floor(cols * (img.height / img.width) * (charWidth / params.fontSize)));

      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = cols; sampleCanvas.height = rows;
      const sCtx = sampleCanvas.getContext('2d');
      sCtx.drawImage(img, 0, 0, cols, rows);
      const pixels = sCtx.getImageData(0, 0, cols, rows).data;

      ctx.fillStyle = params.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = params.fontSize + 'px monospace';
      ctx.textBaseline = 'top';

      const oX = (canvas.width - cols * charWidth) / 2;
      const oY = (canvas.height - rows * params.fontSize) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = (r * cols + c) * 4;
          let b = (0.299 * pixels[i] + 0.587 * pixels[i+1] + 0.114 * pixels[i+2]) / 255;
          if (params.invert) b = 1 - b;
          const ch = chars[Math.floor(b * (chars.length - 1))];
          ctx.fillStyle = params.colorMode === 'color' ? 'rgb('+pixels[i]+','+pixels[i+1]+','+pixels[i+2]+')' : params.colorMode === 'mono' ? (params.monoColor || '#0f0') : 'rgb('+Math.floor(b*255)+','+Math.floor(b*255)+','+Math.floor(b*255)+')';
          ctx.fillText(ch, oX + c * charWidth, oY + r * params.fontSize);
        }
      }
    }
  </script>
</body>
</html>`
}

function generateGlitchCanvasCode(params: GlitchParams): string {
  return `// Glitch Effect - Canvas Code
// Generated by 2049 Design
// Parameters: ${JSON.stringify(params)}

function seededRandom(seed) {
  return function() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function renderGlitch(ctx, img, params, frame) {
  const seed = params.animation ? params.randomSeed + Math.floor(frame * params.animationSpeed * 0.1) : params.randomSeed;
  const random = seededRandom(seed);
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  const stripeCount = Math.max(1, Math.floor(params.stripeDensity * 0.5));
  const stripeHeight = h / stripeCount;

  for (let i = 0; i < stripeCount; i++) {
    const offsetX = (random() - 0.5) * params.displacement * 2;
    ctx.drawImage(img, 0, (i * img.height) / stripeCount, img.width, img.height / stripeCount,
      offsetX, i * stripeHeight, w, stripeHeight + 1);
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

function generateAsciiCanvasCode(params: AsciiParams): string {
  return `// ASCII Art - Canvas Code
// Generated by 2049 Design
// Parameters: ${JSON.stringify(params)}

const charSets = { standard: ' .:-=+*#%@', minimal: ' .:+#', blocks: ' ░▒▓█' };

function renderAscii(ctx, img, params) {
  const chars = params.charSet === 'custom' && params.customChars ? params.customChars : charSets[params.charSet] || charSets.standard;
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const charWidth = params.fontSize * 0.6;
  const cols = Math.max(1, Math.floor((w * params.charDensity / 100) / charWidth));
  const rows = Math.max(1, Math.floor(cols * (img.height / img.width) * (charWidth / params.fontSize)));

  const sc = document.createElement('canvas');
  sc.width = cols; sc.height = rows;
  sc.getContext('2d').drawImage(img, 0, 0, cols, rows);
  const px = sc.getContext('2d').getImageData(0, 0, cols, rows).data;

  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, w, h);
  ctx.font = params.fontSize + 'px monospace';
  ctx.textBaseline = 'top';
  const oX = (w - cols * charWidth) / 2, oY = (h - rows * params.fontSize) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 4;
      let b = (0.299 * px[i] + 0.587 * px[i+1] + 0.114 * px[i+2]) / 255;
      if (params.invert) b = 1 - b;
      ctx.fillStyle = params.colorMode === 'color' ? 'rgb('+px[i]+','+px[i+1]+','+px[i+2]+')' : params.colorMode === 'mono' ? (params.monoColor || '#0f0') : 'rgb('+Math.floor(b*255)+','+Math.floor(b*255)+','+Math.floor(b*255)+')';
      ctx.fillText(chars[Math.floor(b * (chars.length - 1))], oX + c * charWidth, oY + r * params.fontSize);
    }
  }
}

// Usage:
// const canvas = document.getElementById('myCanvas');
// const ctx = canvas.getContext('2d');
// const img = new Image();
// img.onload = () => renderAscii(ctx, img, ${JSON.stringify(params)});
// img.src = 'your-image.jpg';
`
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
```

**Step 2: Copy gif.js worker to public**

```bash
cp node_modules/gif.js/dist/gif.worker.js public/gif.worker.js
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/engines/exporter.ts public/gif.worker.js
git commit -m "feat: implement export engine (PNG, GIF, HTML, Canvas code)"
```

---

## Task 7: i18n Setup

**Files:**
- Create: `src/i18n/config.ts`
- Create: `src/i18n/zh.json`
- Create: `src/i18n/en.json`
- Modify: `src/app/layout.tsx`
- Create: `src/i18n/request.ts`
- Modify: `next.config.js`

**Step 1: Create translation files**

Create `src/i18n/zh.json`:

```json
{
  "app": {
    "title": "2049 Design",
    "description": "图像艺术效果生成工具"
  },
  "effects": {
    "glitch": "故障效果",
    "ascii": "字符画"
  },
  "upload": {
    "title": "上传图片",
    "dragHint": "拖拽图片到此处或点击上传",
    "formats": "支持 JPG、PNG、WebP，最大 10MB",
    "error": {
      "type": "不支持的文件类型，请使用 JPG、PNG 或 WebP",
      "size": "文件过大，最大支持 10MB",
      "load": "图片加载失败"
    }
  },
  "params": {
    "presets": "预设模板",
    "stripeDensity": "条纹密度",
    "displacement": "偏移强度",
    "rgbSplit": "色彩通道分离",
    "clipShape": "裁切形状",
    "randomSeed": "随机种子",
    "randomize": "随机",
    "animation": "动画",
    "animationSpeed": "动画速度",
    "charDensity": "字符密度",
    "charSet": "字符集",
    "fontSize": "字体大小",
    "colorMode": "颜色模式",
    "bgColor": "背景色",
    "invert": "反转",
    "clipShapeOptions": {
      "none": "无裁切",
      "circle": "圆形",
      "rectangle": "矩形"
    },
    "charSetOptions": {
      "standard": "标准",
      "minimal": "简约",
      "blocks": "方块",
      "custom": "自定义"
    },
    "colorModeOptions": {
      "bw": "黑白",
      "color": "彩色",
      "mono": "单色"
    }
  },
  "export": {
    "title": "导出",
    "button": "导出",
    "png": "PNG 图片",
    "gif": "GIF 动画",
    "html": "HTML 代码",
    "canvasCode": "Canvas 代码",
    "pngDesc": "导出静态图片",
    "gifDesc": "导出动画效果（仅动画模式）",
    "htmlDesc": "完整 HTML + CSS + JS 代码",
    "canvasCodeDesc": "Canvas API 代码片段",
    "copy": "复制代码",
    "copied": "已复制！",
    "processing": "处理中...",
    "close": "关闭"
  },
  "settings": {
    "language": "语言"
  }
}
```

Create `src/i18n/en.json`:

```json
{
  "app": {
    "title": "2049 Design",
    "description": "Image Art Effect Generator"
  },
  "effects": {
    "glitch": "Glitch",
    "ascii": "ASCII Art"
  },
  "upload": {
    "title": "Upload Image",
    "dragHint": "Drag & drop image here or click to upload",
    "formats": "JPG, PNG, WebP supported, max 10MB",
    "error": {
      "type": "Unsupported file type. Use JPG, PNG, or WebP.",
      "size": "File too large. Maximum size is 10MB.",
      "load": "Failed to load image."
    }
  },
  "params": {
    "presets": "Presets",
    "stripeDensity": "Stripe Density",
    "displacement": "Displacement",
    "rgbSplit": "RGB Split",
    "clipShape": "Clip Shape",
    "randomSeed": "Random Seed",
    "randomize": "Randomize",
    "animation": "Animation",
    "animationSpeed": "Animation Speed",
    "charDensity": "Character Density",
    "charSet": "Character Set",
    "fontSize": "Font Size",
    "colorMode": "Color Mode",
    "bgColor": "Background Color",
    "invert": "Invert",
    "clipShapeOptions": {
      "none": "None",
      "circle": "Circle",
      "rectangle": "Rectangle"
    },
    "charSetOptions": {
      "standard": "Standard",
      "minimal": "Minimal",
      "blocks": "Blocks",
      "custom": "Custom"
    },
    "colorModeOptions": {
      "bw": "B&W",
      "color": "Color",
      "mono": "Mono"
    }
  },
  "export": {
    "title": "Export",
    "button": "Export",
    "png": "PNG Image",
    "gif": "GIF Animation",
    "html": "HTML Code",
    "canvasCode": "Canvas Code",
    "pngDesc": "Export static image",
    "gifDesc": "Export animation (animation mode only)",
    "htmlDesc": "Complete HTML + CSS + JS code",
    "canvasCodeDesc": "Canvas API code snippet",
    "copy": "Copy Code",
    "copied": "Copied!",
    "processing": "Processing...",
    "close": "Close"
  },
  "settings": {
    "language": "Language"
  }
}
```

**Step 2: Configure next-intl**

Create `src/i18n/config.ts`:

```typescript
export const locales = ['en', 'zh'] as const
export type Locale = (typeof locales)[number]

export function getDefaultLocale(): Locale {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase()
    if (lang.startsWith('zh')) return 'zh'
  }
  return 'en'
}
```

Create `src/i18n/request.ts`:

```typescript
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
  const locale = 'en' // SSG default, client will detect and switch
  return {
    locale,
    messages: (await import(`./${locale}.json`)).default,
  }
})
```

**Step 3: Update next.config.js**

Update `next.config.js` to include next-intl plugin:

```javascript
const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = withNextIntl(nextConfig)
```

**Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: No errors.

**Step 5: Commit**

```bash
git add src/i18n/ next.config.js
git commit -m "feat: add i18n support with next-intl (zh/en)"
```

---

## Task 8: UI Control Components

**Files:**
- Create: `src/components/controls/Slider.tsx`
- Create: `src/components/controls/Select.tsx`
- Create: `src/components/controls/Toggle.tsx`
- Create: `src/components/controls/ColorPicker.tsx`
- Create: `src/components/controls/PresetPicker.tsx`

**Step 1: Create Slider component**

Create `src/components/controls/Slider.tsx`:

```tsx
'use client'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function Slider({ label, value, min, max, step = 1, onChange, disabled }: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500 tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  )
}
```

**Step 2: Create Select component**

Create `src/components/controls/Select.tsx`:

```tsx
'use client'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function Select({ label, value, options, onChange, disabled }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
```

**Step 3: Create Toggle component**

Create `src/components/controls/Toggle.tsx`:

```tsx
'use client'

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          checked ? 'bg-gray-900' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
```

**Step 4: Create ColorPicker component**

Create `src/components/controls/ColorPicker.tsx`:

```tsx
'use client'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

export function ColorPicker({ label, value, onChange, disabled }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-mono">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-8 h-8 rounded border border-gray-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  )
}
```

**Step 5: Create PresetPicker component**

Create `src/components/controls/PresetPicker.tsx`:

```tsx
'use client'

import { Preset } from '@/types'

interface PresetPickerProps<T> {
  label: string
  presets: Preset<T>[]
  activePresetId?: string
  onSelect: (params: T, presetId: string) => void
  locale: 'zh' | 'en'
  disabled?: boolean
}

export function PresetPicker<T>({ label, presets, activePresetId, onSelect, locale, disabled }: PresetPickerProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.params, preset.id)}
            disabled={disabled}
            className={`px-3 py-1 text-xs rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              activePresetId === preset.id
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {locale === 'zh' ? preset.nameZh : preset.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 7: Commit**

```bash
git add src/components/controls/
git commit -m "feat: add UI control components (Slider, Select, Toggle, ColorPicker, PresetPicker)"
```

---

## Task 9: Image Uploader Component

**Files:**
- Create: `src/components/upload/ImageUploader.tsx`

**Step 1: Implement ImageUploader**

Create `src/components/upload/ImageUploader.tsx`:

```tsx
'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useTranslations } from 'next-intl'

interface ImageUploaderProps {
  hasImage: boolean
}

export function ImageUploader({ hasImage }: ImageUploaderProps) {
  const { handleUpload } = useImageUpload()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('upload')

  const onFile = useCallback(async (file: File) => {
    setError(null)
    try {
      await handleUpload(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }, [handleUpload])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setIsDragging(false), [])

  const onClick = useCallback(() => fileInputRef.current?.click(), [])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }, [onFile])

  if (hasImage) {
    return (
      <button
        onClick={onClick}
        className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {t('title')}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
      </button>
    )
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        isDragging
          ? 'border-gray-900 bg-gray-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <Upload className="w-8 h-8 text-gray-400" />
      <p className="text-sm text-gray-600 text-center">{t('dragHint')}</p>
      <p className="text-xs text-gray-400">{t('formats')}</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/upload/
git commit -m "feat: add ImageUploader component with drag-and-drop support"
```

---

## Task 10: Canvas Rendering Component

**Files:**
- Create: `src/components/canvas/EffectCanvas.tsx`

**Step 1: Implement EffectCanvas**

Create `src/components/canvas/EffectCanvas.tsx`:

```tsx
'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { renderGlitch } from '@/engines/glitch'
import { renderAscii } from '@/engines/ascii'
import { Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function EffectCanvas() {
  const { state } = useAppState()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const frameRef = useRef<number>(0)
  const t = useTranslations('upload')

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !state.image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 根据容器大小设置 canvas 尺寸
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    ctx.scale(dpr, dpr)

    if (state.activeEffect === 'glitch') {
      renderGlitch(ctx, state.image, state.glitchParams, rect.width, rect.height, frameRef.current)
    } else {
      renderAscii(ctx, state.image, state.asciiParams, rect.width, rect.height)
    }
  }, [state])

  useEffect(() => {
    if (!state.image) return

    const isAnimating = state.activeEffect === 'glitch' && state.glitchParams.animation

    if (isAnimating) {
      const animate = () => {
        frameRef.current++
        render()
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
    } else {
      frameRef.current = 0
      render()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [state, render])

  // 处理窗口 resize
  useEffect(() => {
    const handleResize = () => render()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [render])

  if (!state.image) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Upload className="w-12 h-12 mb-3" />
        <p className="text-sm">{t('dragHint')}</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/canvas/
git commit -m "feat: add EffectCanvas component with unified rendering pipeline"
```

---

## Task 11: Layout Components (Header + Sidebar)

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Sidebar.tsx`

**Step 1: Create Header component**

Create `src/components/layout/Header.tsx`:

```tsx
'use client'

import { useAppState } from '@/hooks/useEffectParams'
import { EffectType } from '@/types'
import { Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function Header() {
  const { state, dispatch } = useAppState()
  const t = useTranslations()

  const tabs: { id: EffectType; label: string }[] = [
    { id: 'glitch', label: t('effects.glitch') },
    { id: 'ascii', label: t('effects.ascii') },
  ]

  const toggleLocale = () => {
    dispatch({ type: 'SET_LOCALE', payload: state.locale === 'en' ? 'zh' : 'en' })
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-gray-900 tracking-tight">2049 Design</h1>
      </div>

      <nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_EFFECT', payload: tab.id })}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              state.activeEffect === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <button
        onClick={toggleLocale}
        className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{state.locale === 'en' ? 'EN' : '中'}</span>
      </button>
    </header>
  )
}
```

**Step 2: Create Sidebar component**

Create `src/components/layout/Sidebar.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { ImageUploader } from '@/components/upload/ImageUploader'
import { Slider } from '@/components/controls/Slider'
import { Select } from '@/components/controls/Select'
import { Toggle } from '@/components/controls/Toggle'
import { ColorPicker } from '@/components/controls/ColorPicker'
import { PresetPicker } from '@/components/controls/PresetPicker'
import { GLITCH_PRESETS } from '@/presets/glitch-presets'
import { ASCII_PRESETS } from '@/presets/ascii-presets'
import { GlitchParams, AsciiParams } from '@/types'
import { useTranslations } from 'next-intl'

export function Sidebar({ onExport }: { onExport: () => void }) {
  const { state, dispatch } = useAppState()
  const [activePresetId, setActivePresetId] = useState<string>(GLITCH_PRESETS[0].id)
  const t = useTranslations('params')
  const tExport = useTranslations('export')
  const hasImage = !!state.image
  const disabled = !hasImage

  const setGlitch = (key: keyof GlitchParams, value: GlitchParams[keyof GlitchParams]) => {
    dispatch({ type: 'SET_GLITCH_PARAMS', payload: { [key]: value } })
    setActivePresetId('')
  }

  const setAscii = (key: keyof AsciiParams, value: AsciiParams[keyof AsciiParams]) => {
    dispatch({ type: 'SET_ASCII_PARAMS', payload: { [key]: value } })
    setActivePresetId('')
  }

  return (
    <aside className="w-80 h-full border-r border-gray-200 bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 图片上传 */}
        <ImageUploader hasImage={hasImage} />

        {/* 预设 */}
        {state.activeEffect === 'glitch' ? (
          <>
            <PresetPicker
              label={t('presets')}
              presets={GLITCH_PRESETS}
              activePresetId={activePresetId}
              onSelect={(params, id) => {
                dispatch({ type: 'SET_GLITCH_PRESET', payload: params })
                setActivePresetId(id)
              }}
              locale={state.locale}
              disabled={disabled}
            />

            <div className="space-y-3">
              <Slider label={t('stripeDensity')} value={state.glitchParams.stripeDensity} min={1} max={100} onChange={(v) => setGlitch('stripeDensity', v)} disabled={disabled} />
              <Slider label={t('displacement')} value={state.glitchParams.displacement} min={0} max={100} onChange={(v) => setGlitch('displacement', v)} disabled={disabled} />
              <Slider label={t('rgbSplit')} value={state.glitchParams.rgbSplit} min={0} max={50} onChange={(v) => setGlitch('rgbSplit', v)} disabled={disabled} />

              <Select
                label={t('clipShape')}
                value={state.glitchParams.clipShape}
                options={[
                  { value: 'none', label: t('clipShapeOptions.none') },
                  { value: 'circle', label: t('clipShapeOptions.circle') },
                  { value: 'rectangle', label: t('clipShapeOptions.rectangle') },
                ]}
                onChange={(v) => setGlitch('clipShape', v)}
                disabled={disabled}
              />

              <div className="flex items-center gap-2">
                <Slider label={t('randomSeed')} value={state.glitchParams.randomSeed} min={0} max={9999} onChange={(v) => setGlitch('randomSeed', v)} disabled={disabled} />
                <button
                  onClick={() => setGlitch('randomSeed', Math.floor(Math.random() * 10000))}
                  disabled={disabled}
                  className="mt-5 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {t('randomize')}
                </button>
              </div>

              <Toggle label={t('animation')} checked={state.glitchParams.animation} onChange={(v) => setGlitch('animation', v)} disabled={disabled} />
              {state.glitchParams.animation && (
                <Slider label={t('animationSpeed')} value={state.glitchParams.animationSpeed} min={1} max={10} onChange={(v) => setGlitch('animationSpeed', v)} disabled={disabled} />
              )}
            </div>
          </>
        ) : (
          <>
            <PresetPicker
              label={t('presets')}
              presets={ASCII_PRESETS}
              activePresetId={activePresetId}
              onSelect={(params, id) => {
                dispatch({ type: 'SET_ASCII_PRESET', payload: params })
                setActivePresetId(id)
              }}
              locale={state.locale}
              disabled={disabled}
            />

            <div className="space-y-3">
              <Slider label={t('charDensity')} value={state.asciiParams.charDensity} min={1} max={100} onChange={(v) => setAscii('charDensity', v)} disabled={disabled} />

              <Select
                label={t('charSet')}
                value={state.asciiParams.charSet}
                options={[
                  { value: 'standard', label: t('charSetOptions.standard') },
                  { value: 'minimal', label: t('charSetOptions.minimal') },
                  { value: 'blocks', label: t('charSetOptions.blocks') },
                  { value: 'custom', label: t('charSetOptions.custom') },
                ]}
                onChange={(v) => setAscii('charSet', v)}
                disabled={disabled}
              />

              <Slider label={t('fontSize')} value={state.asciiParams.fontSize} min={4} max={24} onChange={(v) => setAscii('fontSize', v)} disabled={disabled} />

              <Select
                label={t('colorMode')}
                value={state.asciiParams.colorMode}
                options={[
                  { value: 'bw', label: t('colorModeOptions.bw') },
                  { value: 'color', label: t('colorModeOptions.color') },
                  { value: 'mono', label: t('colorModeOptions.mono') },
                ]}
                onChange={(v) => setAscii('colorMode', v)}
                disabled={disabled}
              />

              {state.asciiParams.colorMode === 'mono' && (
                <ColorPicker label={t('colorMode')} value={state.asciiParams.monoColor || '#00FF00'} onChange={(v) => setAscii('monoColor', v)} disabled={disabled} />
              )}

              <ColorPicker label={t('bgColor')} value={state.asciiParams.bgColor} onChange={(v) => setAscii('bgColor', v)} disabled={disabled} />

              <Toggle label={t('invert')} checked={state.asciiParams.invert} onChange={(v) => setAscii('invert', v)} disabled={disabled} />
            </div>
          </>
        )}
      </div>

      {/* 导出按钮 */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onExport}
          disabled={disabled}
          className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {tExport('button')}
        </button>
      </div>
    </aside>
  )
}
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add Header and Sidebar layout components"
```

---

## Task 12: Export Dialog Component

**Files:**
- Create: `src/components/export/ExportDialog.tsx`

**Step 1: Implement ExportDialog**

Create `src/components/export/ExportDialog.tsx`:

```tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Image, Film, Code, FileCode } from 'lucide-react'
import { useAppState } from '@/hooks/useEffectParams'
import { exportPNG, exportGIF, generateHTMLCode, generateCanvasCode, copyToClipboard } from '@/engines/exporter'
import { renderGlitch } from '@/engines/glitch'
import { useTranslations } from 'next-intl'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function ExportDialog({ open, onClose, canvasRef }: ExportDialogProps) {
  const { state } = useAppState()
  const [codeContent, setCodeContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [processing, setProcessing] = useState(false)
  const t = useTranslations('export')

  const handleExportPNG = useCallback(async () => {
    if (!canvasRef.current) return
    setProcessing(true)
    await exportPNG(canvasRef.current, '2049-design-export')
    setProcessing(false)
  }, [canvasRef])

  const handleExportGIF = useCallback(async () => {
    if (!canvasRef.current || !state.image) return
    setProcessing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    await exportGIF(
      canvas,
      (frameIndex) => {
        renderGlitch(ctx, state.image!, state.glitchParams, canvas.width, canvas.height, frameIndex)
      },
      { frames: 30, delay: 100, filename: '2049-design-export' }
    )
    setProcessing(false)
  }, [canvasRef, state])

  const handleExportHTML = useCallback(() => {
    const params = state.activeEffect === 'glitch' ? state.glitchParams : state.asciiParams
    const code = generateHTMLCode(state.activeEffect, params)
    setCodeContent(code)
  }, [state])

  const handleExportCanvasCode = useCallback(() => {
    const params = state.activeEffect === 'glitch' ? state.glitchParams : state.asciiParams
    const code = generateCanvasCode(state.activeEffect, params)
    setCodeContent(code)
  }, [state])

  const handleCopy = useCallback(async () => {
    if (!codeContent) return
    await copyToClipboard(codeContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [codeContent])

  if (!open) return null

  const isGlitchAnimation = state.activeEffect === 'glitch' && state.glitchParams.animation

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
          <button onClick={() => { onClose(); setCodeContent(null) }} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {codeContent ? (
          <div className="p-4">
            <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-80 font-mono text-gray-700">
              {codeContent}
            </pre>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCopy} className="flex-1 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                {copied ? t('copied') : t('copy')}
              </button>
              <button onClick={() => setCodeContent(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                {t('close')}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 gap-3">
            <button onClick={handleExportPNG} disabled={processing} className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
              <Image className="w-6 h-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{t('png')}</span>
              <span className="text-xs text-gray-500">{t('pngDesc')}</span>
            </button>

            <button onClick={handleExportGIF} disabled={processing || !isGlitchAnimation} className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
              <Film className="w-6 h-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{t('gif')}</span>
              <span className="text-xs text-gray-500">{t('gifDesc')}</span>
            </button>

            <button onClick={handleExportHTML} disabled={processing} className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
              <Code className="w-6 h-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{t('html')}</span>
              <span className="text-xs text-gray-500">{t('htmlDesc')}</span>
            </button>

            <button onClick={handleExportCanvasCode} disabled={processing} className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
              <FileCode className="w-6 h-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{t('canvasCode')}</span>
              <span className="text-xs text-gray-500">{t('canvasCodeDesc')}</span>
            </button>

            {processing && (
              <div className="col-span-2 text-center text-sm text-gray-500 py-2">
                {t('processing')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/export/
git commit -m "feat: add ExportDialog with PNG, GIF, HTML, and Canvas code export"
```

---

## Task 13: Main Page Assembly

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Step 1: Create AppProvider wrapper**

Create `src/components/AppProvider.tsx`:

```tsx
'use client'

import { ReactNode, useEffect } from 'react'
import { AppContext, useAppReducer } from '@/hooks/useEffectParams'
import { getDefaultLocale } from '@/i18n/config'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useAppReducer()

  // 检测浏览器语言
  useEffect(() => {
    const locale = getDefaultLocale()
    dispatch({ type: 'SET_LOCALE', payload: locale })
  }, [dispatch])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}
```

**Step 2: Update layout.tsx**

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { AppProvider } from '@/components/AppProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '2049 Design',
  description: 'Image Art Effect Generator',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()

  return (
    <html lang="en">
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AppProvider>
            {children}
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

**Step 3: Update page.tsx**

Update `src/app/page.tsx`:

```tsx
'use client'

import { useState, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { EffectCanvas } from '@/components/canvas/EffectCanvas'
import { ExportDialog } from '@/components/export/ExportDialog'

export default function Home() {
  const [showExport, setShowExport] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onExport={() => setShowExport(true)} />
        <main className="flex-1 p-6">
          <div className="w-full h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
            <EffectCanvas />
          </div>
        </main>
      </div>
      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        canvasRef={canvasRef}
      />
    </div>
  )
}
```

**Step 4: Update globals.css**

Update `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  height: 100%;
  overflow: hidden;
}
```

**Step 5: Verify dev server and full page**

```bash
npm run dev
```

Expected: Full layout renders — header with tabs, sidebar with upload area and disabled controls, empty canvas area.

**Step 6: Commit**

```bash
git add src/app/ src/components/AppProvider.tsx
git commit -m "feat: assemble main page with Header, Sidebar, Canvas, and ExportDialog"
```

---

## Task 14: Drag-and-Drop Full-Screen Overlay

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add drag-and-drop overlay to page**

Add a global drag-and-drop handler to `page.tsx` that shows a full-screen overlay when dragging files over the page:

```tsx
// Add to Home component: state and handlers for drag overlay
const [isDraggingOver, setIsDraggingOver] = useState(false)

const handleDragEnter = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDraggingOver(true)
}
const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault()
  if (e.currentTarget === e.target) setIsDraggingOver(false)
}
const handleDragOver = (e: React.DragEvent) => e.preventDefault()
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDraggingOver(false)
  // File handling is done by ImageUploader
}

// Add to JSX: overlay div when dragging
{isDraggingOver && (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/20 border-4 border-dashed border-gray-400 pointer-events-none">
    <p className="text-lg text-gray-600 font-medium">Drop image here</p>
  </div>
)}
```

**Step 2: Verify drag-and-drop overlay shows**

Open dev server, drag a file over the page.

Expected: Full-screen overlay with dashed border appears.

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add full-screen drag-and-drop overlay"
```

---

## Task 15: Wire Canvas Ref for Export

**Files:**
- Modify: `src/components/canvas/EffectCanvas.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Expose canvas ref from EffectCanvas**

Update `EffectCanvas` to accept and use a forwarded ref:

```tsx
// Change EffectCanvas to use forwardRef
import { forwardRef } from 'react'

export const EffectCanvas = forwardRef<HTMLCanvasElement>(function EffectCanvas(_, ref) {
  // ... existing code, but use the forwarded ref for the canvas element
  // Assign both local ref and forwarded ref to the canvas
})
```

Use `useImperativeHandle` or a callback ref to expose the canvas element.

**Step 2: Connect ref in page.tsx**

Pass `canvasRef` to `EffectCanvas` and `ExportDialog`.

**Step 3: Test export works end-to-end**

Upload an image, apply Glitch effect, click Export, click PNG.

Expected: PNG file downloads.

**Step 4: Commit**

```bash
git add src/components/canvas/EffectCanvas.tsx src/app/page.tsx
git commit -m "feat: wire canvas ref for export functionality"
```

---

## Task 16: Final Polish & Build Verification

**Files:**
- Various minor fixes

**Step 1: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Run production server**

```bash
npm start
```

Expected: App loads and functions correctly.

**Step 3: Test all features manually**

1. Upload image (click + drag) — works
2. Glitch effect with all params — renders correctly
3. ASCII Art effect with all params — renders correctly
4. Preset selection — params update, canvas re-renders
5. Effect tab switching — preserves image
6. Export PNG — downloads file
7. Export GIF (with animation on) — downloads file
8. Export HTML code — shows code, copy works
9. Export Canvas code — shows code, copy works
10. Language switch — UI updates

**Step 4: Commit final state**

```bash
git add .
git commit -m "chore: final polish and build verification for V1 MVP"
```

---

## Verification Checklist

- [ ] Project scaffolded with Next.js + Tailwind
- [ ] Type definitions and preset templates created
- [ ] State management with useReducer + Context
- [ ] Glitch engine renders correctly
- [ ] ASCII Art engine renders correctly
- [ ] Export PNG works
- [ ] Export GIF works (animation mode)
- [ ] Export HTML code works
- [ ] Export Canvas code works
- [ ] All UI controls functional (Slider, Select, Toggle, ColorPicker, PresetPicker)
- [ ] Image upload (click + drag-and-drop)
- [ ] Preset selection updates params and re-renders
- [ ] Effect tab switching preserves image
- [ ] i18n working (zh/en switch)
- [ ] Production build succeeds
- [ ] 30fps+ rendering performance

## Failure Conditions

- Build fails (`npm run build` errors)
- Canvas rendering produces blank or corrupted output
- Export produces empty/corrupted files
- i18n translation keys missing or showing raw keys
- Performance below 30fps during parameter adjustment
- Memory leak from animation frames not being cleaned up
