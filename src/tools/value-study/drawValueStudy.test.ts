import { describe, expect, it } from 'vitest'
import { frameFor, percentLabel } from './drawValueStudy'
import { samplePicture } from './picture'

describe('frameFor', () => {
    it('fits a wide photo to the width, centred together with the scale', () => {
        const f = frameFor(2, 480, true)
        expect(f.width).toBe(480)
        expect(f.height).toBe(240)
        const band = 480 * 0.12
        expect(f.y).toBeCloseTo(480 - (f.y + f.height + band))
    })

    it('leaves room for the scale under a square picture', () => {
        const f = frameFor(1, 480, true)
        expect(f.y).toBeCloseTo(0)
        expect(f.height).toBeCloseTo(480 * 0.88)
    })

    it('fits a tall photo to the height, centred across', () => {
        const f = frameFor(0.5, 480, false)
        expect(f.height).toBe(480)
        expect(f.width).toBe(240)
        expect(f.x).toBe(120)
    })
})

describe('percentLabel', () => {
    it('rounds to whole percent, and shows slivers as <1%', () => {
        expect(percentLabel(0.256)).toBe('26%')
        expect(percentLabel(0)).toBe('0%')
        expect(percentLabel(0.001)).toBe('<1%')
    })
})

describe('samplePicture', () => {
    it('is the same for the same seed and different for another', () => {
        const a = samplePicture(48213).pixels(40, 40).lightness
        expect(samplePicture(48213).pixels(40, 40).lightness).toEqual(a)
        expect(samplePicture(7).pixels(40, 40).lightness).not.toEqual(a)
    })

    it('has light and dark in it, so there is something to group', () => {
        const l = samplePicture(48213).pixels(60, 60).lightness
        expect(Math.min(...l)).toBeLessThan(40)
        expect(Math.max(...l)).toBeGreaterThan(90)
    })

    it('keeps its pixels for the size last asked for', () => {
        const picture = samplePicture(1)
        expect(picture.pixels(20, 20)).toBe(picture.pixels(20, 20))
    })
})
