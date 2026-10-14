import { describe, expect, it } from 'vitest'
import {
    blur,
    coverage,
    grayOf,
    lightnessOf,
    lightnessOfPixels,
    percentile,
    posterize,
    shapeEdges,
    stretch,
    valueScale,
} from './values'

const f32 = (...v: number[]) => Float32Array.from(v)

describe('lightness', () => {
    it('runs from 0 for black to 100 for white', () => {
        expect(lightnessOf(0, 0, 0)).toBe(0)
        expect(lightnessOf(255, 255, 255)).toBeCloseTo(100, 4)
    })

    it('puts sRGB gray 119 near the middle, as the eye sees it', () => {
        expect(lightnessOf(119, 119, 119)).toBeCloseTo(50, 0)
    })

    it('sees green as much lighter than blue of the same strength', () => {
        expect(lightnessOf(0, 255, 0)).toBeGreaterThan(80)
        expect(lightnessOf(0, 0, 255)).toBeLessThan(35)
    })

    it('turns back into the same gray', () => {
        for (let g = 0; g <= 255; g += 15) expect(grayOf(lightnessOf(g, g, g))).toBe(g)
    })

    it('reads RGBA pixel data, ignoring alpha', () => {
        const l = lightnessOfPixels([0, 0, 0, 255, 255, 255, 255, 0])
        expect(l[0]).toBe(0)
        expect(l[1]).toBeCloseTo(100, 4)
    })
})

describe('valueScale', () => {
    it('steps evenly from black to white', () => {
        expect(valueScale(3)).toEqual([0, 50, 100])
        expect(valueScale(5)).toEqual([0, 25, 50, 75, 100])
        expect(valueScale(7)).toHaveLength(7)
    })
})

describe('posterize', () => {
    it('cuts the range into equal bands, one per step', () => {
        expect([...posterize(f32(0, 33, 34, 66, 67, 100), 3)]).toEqual([0, 0, 1, 1, 2, 2])
        expect([...posterize(f32(10, 30, 50, 70, 99), 5)]).toEqual([0, 1, 2, 3, 4])
    })

    it('gives every step the same share of an even ramp', () => {
        const ramp = f32(...Array.from({ length: 700 }, (_, i) => (i + 0.5) / 7))
        expect(coverage(posterize(ramp, 7), 7).every((c) => Math.abs(c - 1 / 7) < 1e-9)).toBe(true)
    })

    it('keeps out-of-range values on the scale', () => {
        expect([...posterize(f32(-5, 120), 7)]).toEqual([0, 6])
    })
})

describe('coverage', () => {
    it('gives the share of the picture on each step', () => {
        expect(coverage(Uint8Array.from([0, 0, 2, 1]), 3)).toEqual([0.5, 0.25, 0.25])
    })

    it('adds up to the whole picture', () => {
        const steps = posterize(f32(...Array.from({ length: 100 }, (_, i) => i)), 7)
        expect(coverage(steps, 7).reduce((a, b) => a + b)).toBeCloseTo(1, 10)
    })
})

describe('blur', () => {
    it('leaves a flat picture flat', () => {
        expect(
            [...blur(new Float32Array(30).fill(40), 6, 5, 2)].every((v) => Math.abs(v - 40) < 1e-4),
        ).toBe(true)
    })

    it('softens a hard edge but keeps the average', () => {
        const w = 20
        const values = f32(...Array.from({ length: w }, (_, x) => (x < w / 2 ? 0 : 100)))
        const soft = blur(values, w, 1, 2)
        expect(soft[w / 2 - 1]).toBeGreaterThan(0)
        expect(soft[w / 2]).toBeLessThan(100)
        expect(soft[0]).toBe(0)
        expect(soft[w - 1]).toBe(100)
        const mean = (a: Float32Array) => a.reduce((s, v) => s + v, 0) / a.length
        expect(mean(soft)).toBeCloseTo(mean(values), 3)
    })

    it('does nothing at radius 0', () => {
        const values = f32(1, 2, 3)
        expect(blur(values, 3, 1, 0)).toBe(values)
    })
})

describe('stretch', () => {
    it('spreads a hazy picture over the full range', () => {
        const hazy = f32(...Array.from({ length: 1000 }, (_, i) => 40 + (i % 21)))
        expect(percentile(hazy, 0.5)).toBeCloseTo(50, 0)
        const full = stretch(hazy)
        expect(Math.min(...full)).toBe(0)
        expect(Math.max(...full)).toBe(100)
    })

    it('leaves a picture of one value alone', () => {
        const flat = new Float32Array(10).fill(30)
        expect(stretch(flat)).toBe(flat)
    })
})

describe('shapeEdges', () => {
    // Two shapes side by side: steps 0 0 1 1 in each of two rows.
    const steps = Uint8Array.from([0, 0, 1, 1, 0, 0, 1, 1])

    it('marks the border between two shapes', () => {
        expect([...shapeEdges(steps, 4, 2, 1)]).toEqual([0, 1, 0, 0, 0, 1, 0, 0])
    })

    it('draws thicker lines when asked', () => {
        expect([...shapeEdges(steps, 4, 2, 2)]).toEqual([0, 1, 1, 0, 0, 1, 1, 0])
    })

    it('marks nothing inside one shape', () => {
        expect(shapeEdges(new Uint8Array(9), 3, 3, 1).every((e) => e === 0)).toBe(true)
    })
})
