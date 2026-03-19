import { describe, expect, it } from 'vitest'
import { getScanlinePitch, getScanlineRowProfile } from './glitch'

describe('getScanlinePitch', () => {
  it('returns null when scanlines are disabled', () => {
    expect(getScanlinePitch(0)).toBeNull()
  })

  it('makes scanlines denser as density increases', () => {
    const lowDensityPitch = getScanlinePitch(8)
    const highDensityPitch = getScanlinePitch(25)

    expect(lowDensityPitch).not.toBeNull()
    expect(highDensityPitch).not.toBeNull()
    expect(lowDensityPitch!).toBeGreaterThan(highDensityPitch!)
  })

  it('caps density at the old 25-level effect', () => {
    expect(getScanlinePitch(25)).toBe(7)
    expect(getScanlinePitch(50)).toBe(7)
  })
})

describe('getScanlineRowProfile', () => {
  it('keeps the lead row darker than the tail rows', () => {
    const profile = getScanlineRowProfile(0, 8, 3)
    const tailProfile = getScanlineRowProfile(6, 8, 3)

    expect(profile.darken).toBeGreaterThan(0)
    expect(profile.darken).toBeGreaterThan(tailProfile.darken)
  })

  it('still affects rows between main scanlines', () => {
    const profile = getScanlineRowProfile(6, 8, 3)

    expect(profile.darken).toBeGreaterThan(0)
  })
})

