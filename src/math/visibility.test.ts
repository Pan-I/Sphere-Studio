import { describe, expect, it } from 'vitest'
import type { Vec3 } from './quat'
import { splitByVisibility } from './sphere'

const at = (z: number, i = 0): Vec3 => [i, 0, z]

describe('splitByVisibility', () => {
    it('returns nothing for fewer than two points', () => {
        expect(splitByVisibility([])).toEqual([])
        expect(splitByVisibility([at(1)])).toEqual([])
    })

    it('keeps a fully front-facing line as one run', () => {
        const pts = [at(1, 0), at(0.5, 1), at(0.2, 2)]
        const runs = splitByVisibility(pts)
        expect(runs).toHaveLength(1)
        expect(runs[0].front).toBe(true)
        expect(runs[0].points).toEqual(pts)
    })

    it('keeps a fully back-facing line as one back run', () => {
        const runs = splitByVisibility([at(-1, 0), at(-0.5, 1), at(-0.2, 2)])
        expect(runs).toHaveLength(1)
        expect(runs[0].front).toBe(false)
    })

    it('splits where visibility changes, sharing the boundary point', () => {
        // Segment averages: +0.9, +0.25 (front), -0.65, -0.35 (back), +0.6 (front)
        const pts = [at(1, 0), at(0.8, 1), at(-0.3, 2), at(-1, 3), at(0.3, 4), at(0.9, 5)]
        const runs = splitByVisibility(pts)
        expect(runs.map((r) => r.front)).toEqual([true, false, true])
        for (let i = 1; i < runs.length; i++) {
            expect(runs[i].points[0]).toBe(runs[i - 1].points[runs[i - 1].points.length - 1])
        }
    })

    it('preserves every segment exactly once', () => {
        const pts = [at(1, 0), at(0.8, 1), at(-0.3, 2), at(-1, 3), at(0.3, 4), at(0.9, 5)]
        const segments = splitByVisibility(pts).reduce((n, r) => n + r.points.length - 1, 0)
        expect(segments).toBe(pts.length - 1)
    })

    it('treats a segment exactly at the horizon as front-facing', () => {
        expect(splitByVisibility([at(0.5, 0), at(-0.5, 1)])[0].front).toBe(true)
    })
})