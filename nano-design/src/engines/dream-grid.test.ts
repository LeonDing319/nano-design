import { describe, expect, it } from 'vitest'
import { DEFAULT_DREAM_GRID_PARAMS, buildDreamGridLayout, renderDreamGridOverlay } from './dream-grid'

describe('buildDreamGridLayout', () => {
  it('generates dense fullscreen geometry at maximum amount', () => {
    const layout = buildDreamGridLayout(900, 1200, {
      ...DEFAULT_DREAM_GRID_PARAMS,
      amount: 100,
    })

    // Assert that we have a high density of elements (lines array is unused in current impl)
    expect(layout.blocks.length).toBeGreaterThan(20)
    expect(layout.accents.length).toBeGreaterThan(20)
  })

  it('generates gradients for some accents', () => {
    const layout = buildDreamGridLayout(900, 1200, {
      ...DEFAULT_DREAM_GRID_PARAMS,
      amount: 100,
    })

    // At amount 100, there should be some accents using gradient (array of strings)
    const gradientAccents = layout.accents.filter((a) => Array.isArray(a.color))
    expect(gradientAccents.length).toBeGreaterThan(0)
  })

  it('generates some elements using blending modes', () => {
    const layout = buildDreamGridLayout(900, 1200, {
      ...DEFAULT_DREAM_GRID_PARAMS,
      amount: 100,
    })

    // Some blocks/accents should use screen or overlay blending
    const blendedElements = [...layout.blocks, ...layout.accents].filter(
      (el) => el.blendMode && el.blendMode !== 'source-over'
    )
    expect(blendedElements.length).toBeGreaterThan(0)
  })

  it('renders nothing when amount is zero', () => {
    const calls = { stroke: 0, strokeRect: 0, fillRect: 0, fill: 0 }
    const ctx = {
      save() {},
      restore() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() { calls.stroke++ },
      strokeRect() { calls.strokeRect++ },
      fillRect() { calls.fillRect++ },
      createLinearGradient() { return { addColorStop() {} } },
      arc() {},
      fill() { calls.fill++ },
      setLineDash() {},
      set lineWidth(_value: number) {},
      set strokeStyle(_value: string | CanvasGradient) {},
      set fillStyle(_value: string | CanvasGradient) {},
      set globalAlpha(_value: number) {},
      set globalCompositeOperation(_value: string) {},
      set shadowBlur(_value: number) {},
      set shadowColor(_value: string) {},
    } as unknown as CanvasRenderingContext2D

    renderDreamGridOverlay(ctx, 900, 1200, {
      ...DEFAULT_DREAM_GRID_PARAMS,
      amount: 0,
    })

    expect(calls.stroke + calls.strokeRect + calls.fillRect + calls.fill).toBe(0)
  })

  it('renders line, block and accent instructions when amount is positive', () => {
    const calls = { stroke: 0, strokeRect: 0, fillRect: 0, fill: 0 }
    const ctx = {
      save() {},
      restore() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() { calls.stroke++ },
      strokeRect() { calls.strokeRect++ },
      fillRect() { calls.fillRect++ },
      createLinearGradient() { return { addColorStop() {} } },
      arc() {},
      fill() { calls.fill++ },
      setLineDash() {},
      set lineWidth(_value: number) {},
      set strokeStyle(_value: string | CanvasGradient) {},
      set fillStyle(_value: string | CanvasGradient) {},
      set globalAlpha(_value: number) {},
      set globalCompositeOperation(_value: string) {},
      set shadowBlur(_value: number) {},
      set shadowColor(_value: string) {},
    } as unknown as CanvasRenderingContext2D

    renderDreamGridOverlay(ctx, 900, 1200, {
      ...DEFAULT_DREAM_GRID_PARAMS,
      amount: 85,
    })

    expect(calls.stroke).toBeGreaterThan(0) // lines + cross nodes
    expect(calls.strokeRect + calls.fillRect).toBeGreaterThan(0) // blocks + accents + square nodes + scanlines
  })
})
