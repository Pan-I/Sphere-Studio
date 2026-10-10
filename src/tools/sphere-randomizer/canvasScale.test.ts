import { describe, expect, it } from 'vitest'
import { MAX_BUFFER_SCALE, bufferScale } from './canvasScale'

describe('bufferScale', () => {
    it('uses the screen pixel ratio up to the cap', () => {
        expect(bufferScale(1)).toBe(1)
        expect(bufferScale(1.5)).toBe(1.5)
        expect(bufferScale(2)).toBe(2)
    })

    it('caps high-density phone screens', () => {
        expect(bufferScale(3)).toBe(MAX_BUFFER_SCALE)
        expect(bufferScale(4.5)).toBe(MAX_BUFFER_SCALE)
    })

    it('never goes below 1, even when the browser is zoomed out', () => {
        expect(bufferScale(0.75)).toBe(1)
        expect(bufferScale(0)).toBe(1)
    })

    it('falls back to 1 for invalid values', () => {
        expect(bufferScale(NaN)).toBe(1)
        expect(bufferScale(Infinity)).toBe(1)
        expect(bufferScale(-2)).toBe(1)
    })
})
