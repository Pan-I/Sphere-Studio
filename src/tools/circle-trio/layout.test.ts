import { describe, expect, it } from 'vitest'
import { bounds, distance, overlaps, type Circle } from '../../math/circles'
import { ALONG_OVERSHOOT, FRAME, layoutFromSeed } from './layout'

const SEEDS = Array.from({ length: 5000 }, (_, i) => i)

describe('layoutFromSeed', () => {
    it('gives the same layout for the same seed', () => {
        expect(layoutFromSeed(1234)).toEqual(layoutFromSeed(1234))
    })

    it('keeps layouts stable, so links shared earlier still show the same picture', () => {
        const expected = [
            [-0.3696252695151931, -0.2037850474206515, 0.41345542727038265],
            [0.37378806309096896, 0.09359130853253006, 0.3565077503863722],
            [0.7110857314477164, -0.49086180544961633, 0.18141791537427443],
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

    it('usually keeps the small circle touching a large one, but lets it float free', () => {
        const free = SEEDS.filter((seed) => {
            const [a, b, s] = layoutFromSeed(seed)
            return !overlaps(a, s) && !overlaps(b, s)
        }).length
        expect(free / SEEDS.length).toBeGreaterThan(0.1) // expected about 0.16
        expect(free / SEEDS.length).toBeLessThan(0.22)
    })

    it('places the small circle along the line, up to a quarter of the gap past either centre', () => {
        let beyond = 0
        for (const seed of SEEDS) {
            const { t } = placement(layoutFromSeed(seed))
            expect(t).toBeGreaterThanOrEqual(-ALONG_OVERSHOOT - 1e-9)
            expect(t).toBeLessThanOrEqual(1 + ALONG_OVERSHOOT + 1e-9)
            if (t < 0 || t > 1) beyond++
        }
        expect(beyond / SEEDS.length).toBeGreaterThan(0.25) // expected 1/3
    })

    it('drifts the small circle sideways up to 4.2 times its radius, three times the old reach', () => {
        let far = 0
        for (const seed of SEEDS) {
            const layout = layoutFromSeed(seed)
            const { side } = placement(layout)
            expect(Math.abs(side)).toBeLessThanOrEqual(4.2 * layout[2].radius + 1e-9)
            if (Math.abs(side) > 1.4 * layout[2].radius) far++
        }
        expect(far / SEEDS.length).toBeGreaterThan(0.4) // expected about 0.48
    })
})

/**
 * Where the small centre sits: t is how far along the A→B line, as a fraction of the gap, and
 * side is its distance off that line.
 */
function placement([a, b, s]: readonly Circle[]) {
    const ab = distance(a.center, b.center)
    const dx = (b.center[0] - a.center[0]) / ab
    const dy = (b.center[1] - a.center[1]) / ab
    const sx = s.center[0] - a.center[0]
    const sy = s.center[1] - a.center[1]
    return { t: (sx * dx + sy * dy) / ab, side: -sx * dy + sy * dx }
}
