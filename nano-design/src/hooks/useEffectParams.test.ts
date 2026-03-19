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
})
