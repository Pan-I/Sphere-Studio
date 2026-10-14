import { describe, expect, it } from 'vitest'
import { horizonY, vanishingPoint } from '../../math/perspective'
import { MAX_SEED } from '../shared/seed'
import { fitSeed, pointsForSeed, poseFromSeed } from './pose'

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 3331)

describe('pointsForSeed and fitSeed', () => {
    it('cycles through 1, 2 and 3 points', () => {
        expect([0, 1, 2, 3].map(pointsForSeed)).toEqual([1, 2, 3, 1])
    })

    it('moves to a nearby seed with the chosen number of points', () => {
        for (const seed of [0, 1, 2, 48213, MAX_SEED - 1, MAX_SEED]) {
            for (const n of [1, 2, 3] as const) {
                const fitted = fitSeed(seed, String(n) as '1' | '2' | '3')
                expect(pointsForSeed(fitted)).toBe(n)
                expect(Math.abs(fitted - seed)).toBeLessThan(3)
                expect(fitted).toBeGreaterThanOrEqual(0)
                expect(fitted).toBeLessThanOrEqual(MAX_SEED)
            }
            expect(fitSeed(seed, 'any')).toBe(seed)
        }
    })
})

describe('poseFromSeed', () => {
    it('is deterministic and differs between seeds', () => {
        expect(poseFromSeed(48213)).toEqual(poseFromSeed(48213))
        expect(poseFromSeed(48213)).not.toEqual(poseFromSeed(48216))
    })

    it('keeps the horizon on the canvas', () => {
        for (const seed of SEEDS) {
            const y = horizonY(poseFromSeed(seed).camera)
            expect(y).toBeGreaterThan(0.05)
            expect(y).toBeLessThan(0.95)
        }
    })

    it('has as many vanishing points as the seed says, at least one on the canvas', () => {
        const inside = (p: readonly [number, number]) =>
            p[0] >= 0 && p[0] <= 1 && p[1] >= 0 && p[1] <= 1
        for (const seed of SEEDS) {
            const { points, camera } = poseFromSeed(seed)
            const vps = (
                [
                    [1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1],
                ] as const
            )
                .map((d) => vanishingPoint(camera, d))
                .filter((p) => p !== null)
            expect(vps).toHaveLength(points)
            expect(vps.some(inside)).toBe(true)
        }
    })

    it('puts the whole sample box in front of the eye', () => {
        for (const seed of SEEDS) {
            const { camera, box } = poseFromSeed(seed)
            const depth = Math.hypot(...box.center)
            const reach = Math.hypot(...box.half)
            expect(reach).toBeLessThan(depth * 0.6)
            expect(camera.focal).toBeGreaterThan(0)
        }
    })

    it('keeps grids stable, so shared links still show the same grid', () => {
        expect(poseFromSeed(48213).camera.center[0]).toBeCloseTo(0.706676, 6) // 1 point
        expect(poseFromSeed(48213).camera.center[1]).toBeCloseTo(0.417277, 6)
        expect(poseFromSeed(48214).camera.yaw).toBeCloseTo(0.397699, 6) // 2 point
        expect(poseFromSeed(48214).camera.focal).toBeCloseTo(0.474759, 6)
        expect(poseFromSeed(48212).camera.pitch).toBeCloseTo(0.666598, 6) // 3 point
    })
})
