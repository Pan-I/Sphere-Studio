// src/math/meet.test.ts
import { describe, expect, it } from 'vitest'
import { meetLine, shareInside } from './meet'
import type { Vec3 } from './quat'
import { inside, type Solid } from './solids'

const ball = (centre: Vec3, scale = 1): Solid => ({
    kind: 'sphere',
    centre,
    scale,
    q: [0, 0, 0, 1],
    proportion: 1,
})
const box: Solid = {
    kind: 'box',
    centre: [0.8, 0.1, 0],
    scale: 1,
    q: [0.2, 0.3, 0.1, Math.sqrt(1 - 0.14)],
    proportion: 1,
}

describe('meetLine', () => {
    it('finds the circle where two spheres meet', () => {
        // Unit spheres 1 apart meet in a circle at x = 0.5, of radius √(1 − 0.25).
        const segments = meetLine(ball([0, 0, 0]), ball([1, 0, 0]), 64)
        expect(segments.length).toBeGreaterThan(40)
        for (const [a, b] of segments) {
            for (const p of [a, b]) {
                expect(p[0]).toBeCloseTo(0.5, 8)
                expect(Math.hypot(p[1], p[2])).toBeCloseTo(Math.sqrt(0.75), 8)
            }
        }
    })

    it('puts every point on both surfaces', () => {
        const sphere = ball([0, 0, 0], 0.9)
        for (const [first, second] of [
            [sphere, box],
            [box, sphere],
        ]) {
            const segments = meetLine(first, second, 64)
            expect(segments.length).toBeGreaterThan(20)
            for (const [a, b] of segments) {
                for (const p of [a, b]) {
                    expect(inside(sphere, p)).toBeCloseTo(0, 8)
                    expect(inside(box, p)).toBeCloseTo(0, 8)
                }
            }
        }
    })

    it('is empty for forms that do not touch', () => {
        expect(meetLine(ball([0, 0, 0]), ball([3, 0, 0]), 64)).toEqual([])
    })
})

describe('shareInside', () => {
    it('measures how much of one surface is inside another', () => {
        // A sphere's cap past x = 0.5 is a quarter of its area.
        expect(shareInside(ball([0, 0, 0]), ball([1, 0, 0]), 64)).toBeCloseTo(0.25, 1)
        expect(shareInside(ball([0, 0, 0]), ball([3, 0, 0]), 64)).toBe(0)
        expect(shareInside(ball([0, 0, 0], 0.5), ball([0, 0, 0]), 64)).toBe(1)
    })
})
