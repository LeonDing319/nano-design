import { describe, expect, it } from 'vitest'
import { appReducer, initialAppState } from './useEffectParams'

describe('appReducer dreamGrid state', () => {
  it('updates only dreamGrid amount without affecting other params', () => {
    const nextState = appReducer(initialAppState, {
      type: 'SET_DREAM_GRID_PARAMS',
      payload: {
        amount: 61,
      },
    })

    expect(nextState.dreamGridParams.amount).toBe(61)
    expect(nextState.glitchParams).toBe(initialAppState.glitchParams)
    expect(nextState.asciiParams).toBe(initialAppState.asciiParams)
  })
})
