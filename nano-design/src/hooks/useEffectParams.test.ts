import { describe, expect, it } from 'vitest'
import { appReducer, initialAppState } from './useEffectParams'

describe('appReducer', () => {
  it('sets glitch params without affecting other state', () => {
    const nextState = appReducer(initialAppState, {
      type: 'SET_GLITCH_PARAMS',
      payload: { rgbSplit: 10 },
    })

    expect(nextState.glitchParams.rgbSplit).toBe(10)
    expect(nextState.asciiParams).toBe(initialAppState.asciiParams)
  })

  it('updates scanline density without affecting other glitch params', () => {
    const nextState = appReducer(initialAppState, {
      type: 'SET_GLITCH_PARAMS',
      payload: { scanlineDensity: 24 },
    })

    expect(initialAppState.glitchParams.scanlineDensity).toBe(0)
    expect(nextState.glitchParams.scanlineDensity).toBe(24)
    expect(nextState.glitchParams.dotSize).toBe(initialAppState.glitchParams.dotSize)
  })

  it('sets ascii params without affecting other state', () => {
    const nextState = appReducer(initialAppState, {
      type: 'SET_ASCII_PARAMS',
      payload: {},
    })

    expect(nextState.asciiParams).toEqual(initialAppState.asciiParams)
  })
})
