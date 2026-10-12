import { describe, expect, it } from 'vitest'
import { bounds, distance, overlaps } from '../../math/circles'
import { FRAME, layoutFromSeed } from './layout'

const SEEDS = Array.from({ length: 5000 }, (_, i) => i)

describe('layoutFromSeed', () => {
    it('gives the same layout for the same seed', () => {
        expect(layoutFromSeed(1234)).toEqual(layoutFromSeed(1234))
    })

    it('keeps layouts stable, so links shared earlier still show the same picture', () => {
        const expected = [
            [-0.2171908621383791, -0.2403278945029304, 0.41345542727038265],
            [0.5262224704677829, 0.057048461450251164, 0.3565077503863722],
            [0.3601214771388629, -0.2491867929268926, 0.18141791537427443],
        ]
        layoutFromSeed(48213).forEach((c, i) => {
            expect(c.center[0]).toBeCloseTo(expected[i][0], 10)
            expect(c.center[1]).toBeCloseTo(expected[i][1], 10)
            expect(c.radius).toBeCloseTo(expected[i][2], 10)
        })
    })

    it('gives different layouts for different seeds', () => {
        expect(layoutFromSeed(1)).not.toEqual(layoutFromSeed(2))
    })

    it('always makes the small circle the smallest', () => {
        for (const seed of SEEDS) {
            const [a, b, s] = layoutFromSeed(seed)
            expect(s.radius).toBeLessThan(a.radius)
            expect(s.radius).toBeLessThan(b.radius)
        }
    })

    it('keeps every circle inside the frame', () => {
        for (const seed of SEEDS) {
            const box = bounds(layoutFromSeed(seed))
            expect(box.minX).toBeGreaterThanOrEqual(-FRAME - 1e-9)
            expect(box.minY).toBeGreaterThanOrEqual(-FRAME - 1e-9)
            expect(box.maxX).toBeLessThanOrEqual(FRAME + 1e-9)
            expect(box.maxY).toBeLessThanOrEqual(FRAME + 1e-9)
        }
    })

    it('usually overlaps the large circles, but not always', () => {
        const overlapping = SEEDS.filter((seed) => {
            const [a, b] = layoutFromSeed(seed)
            return overlaps(a, b)
        }).length
        expect(overlapping / SEEDS.length).toBeGreaterThan(0.7) // expected about 0.82
        expect(overlapping / SEEDS.length).toBeLessThan(0.9)
    })

    it('rarely makes the two large circles the same size', () => {
        const similar = SEEDS.filter((seed) => {
            const [a, b] = layoutFromSeed(seed)
            return Math.abs(a.radius - b.radius) < 0.02
        }).length
        expect(similar / SEEDS.length).toBeLessThan(0.05) // expected about 0.02
    })

    it('keeps the small circle touching at least one large circle', () => {
        for (const seed of SEEDS) {
            const [a, b, s] = layoutFromSeed(seed)
            expect(overlaps(a, s) || overlaps(b, s)).toBe(true)
        }
    })

    it('places the small circle between the large ones, measured along the line', () => {
        for (const seed of SEEDS) {
            const [a, b, s] = layoutFromSeed(seed)
            const ab = distance(a.center, b.center)
            // How far along the A→B line the small centre sits, as a fraction of the gap.
            const t =
                ((s.center[0] - a.center[0]) * (b.center[0] - a.center[0]) +
                    (s.center[1] - a.center[1]) * (b.center[1] - a.center[1])) /
                (ab * ab)
            expect(t).toBeGreaterThanOrEqual(0.3 - 1e-9)
            expect(t).toBeLessThanOrEqual(0.7 + 1e-9)
        }
    })
})
