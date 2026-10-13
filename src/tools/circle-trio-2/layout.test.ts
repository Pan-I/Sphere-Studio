import { describe, expect, it } from 'vitest'
import { bounds, distance, type Circle } from '../../math/circles'
import { FRAME } from '../circle-trio/layout'
import { layoutFromSeed } from './layout'

const SEEDS = Array.from({ length: 5000 }, (_, i) => i)

/** Where a small circle sits against the large one's edge. */
function where(large: Circle, small: Circle): 'inside' | 'across' | 'outside' {
    const d = distance(large.center, small.center)
    if (d <= large.radius - small.radius) return 'inside'
    if (d >= large.radius + small.radius) return 'outside'
    return 'across'
}

const share = (count: number) => count / (2 * SEEDS.length)

describe('Circle Trio 2 layoutFromSeed', () => {
    it('gives the same layout for the same seed', () => {
        expect(layoutFromSeed(1234)).toEqual(layoutFromSeed(1234))
    })

    it('keeps layouts stable, so shared links keep showing the same picture', () => {
        const expected = [
            [-0.2754839172355905, 0.34753960381432264, 0.4634920554514974],
            [0.40859464631444253, 0.6211811723627929, 0.23314368837712363],
            [0.30807854659723577, 0.055433773691464516, 0.24304665295430547],
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

    it('makes the small circles a third to two thirds of the large one, and similar in size', () => {
        for (const seed of SEEDS) {
            const [large, a, b] = layoutFromSeed(seed)
            expect(a.radius).toBeGreaterThanOrEqual(0.35 * large.radius - 1e-9)
            expect(a.radius).toBeLessThanOrEqual(0.55 * large.radius + 1e-9)
            expect(b.radius / a.radius).toBeGreaterThanOrEqual(0.8 - 1e-9)
            expect(b.radius / a.radius).toBeLessThanOrEqual(1.2 + 1e-9)
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

    it('places the large circle in different spots on the canvas', () => {
        const xs = SEEDS.map((seed) => layoutFromSeed(seed)[0].center[0])
        expect(Math.min(...xs)).toBeLessThan(-0.2)
        expect(Math.max(...xs)).toBeGreaterThan(0.2)
    })

    it('never puts both small circles fully outside the large one', () => {
        for (const seed of SEEDS) {
            const [large, a, b] = layoutFromSeed(seed)
            expect(where(large, a) === 'outside' && where(large, b) === 'outside').toBe(false)
        }
    })

    it('puts small circles inside, across the edge and outside, mostly across', () => {
        const counts = { inside: 0, across: 0, outside: 0 }
        for (const seed of SEEDS) {
            const [large, a, b] = layoutFromSeed(seed)
            counts[where(large, a)]++
            counts[where(large, b)]++
        }
        expect(share(counts.inside)).toBeGreaterThan(0.1) // expected about 0.15
        expect(share(counts.across)).toBeGreaterThan(0.6) // expected about 0.73
        expect(share(counts.outside)).toBeGreaterThan(0.08) // expected about 0.12
        expect(share(counts.outside)).toBeLessThan(0.2)
    })

    it('keeps the two small circles near each other', () => {
        for (const seed of SEEDS) {
            const [large, a, b] = layoutFromSeed(seed)
            const gap = distance(a.center, b.center)
            const da = distance(large.center, a.center)
            const db = distance(large.center, b.center)
            // 0.75 to 1.25 times their radii apart, unless their distances from the large centre
            // make that impossible: then they're as close or as far as those allow.
            expect(gap).toBeLessThanOrEqual(
                Math.max(1.25 * (a.radius + b.radius), Math.abs(da - db)) + 1e-9,
            )
            expect(gap).toBeGreaterThanOrEqual(
                Math.min(0.75 * (a.radius + b.radius), da + db) - 1e-9,
            )
        }
    })

    it('never leaves a space between the small circles wider than the smaller radius', () => {
        for (const seed of SEEDS) {
            const [, a, b] = layoutFromSeed(seed)
            const space = distance(a.center, b.center) - a.radius - b.radius
            expect(space).toBeLessThan(Math.min(a.radius, b.radius))
        }
    })
})
