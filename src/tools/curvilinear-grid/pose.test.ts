import { describe, expect, it } from 'vitest'
import { CORNERS, EDGES } from '../../math/cube'
import { inView, projectSegment } from '../../math/curvilinear'
import type { Vec3 } from '../../math/quat'
import { MAX_SEED } from '../shared/seed'
import { vanishingPoints } from './drawCurvilinearGrid'
import { fitSeed, lensForSeed, poseFromSeed } from './pose'

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 3331)

const corners = ({ center, half }: { center: Vec3; half: Vec3 }) =>
    CORNERS.map((c): Vec3 => [0, 1, 2].map((i) => center[i] + Math.sign(c[i]) * half[i]) as never)

describe('lensForSeed and fitSeed', () => {
    it('alternates fish-eye and panoramic', () => {
        expect([0, 1, 2, 3].map(lensForSeed)).toEqual([
            'fisheye',
            'panoramic',
            'fisheye',
            'panoramic',
        ])
    })

    it('moves to a neighbouring seed with the chosen lens', () => {
        for (const seed of [0, 1, 2, 48213, MAX_SEED - 1, MAX_SEED]) {
            for (const lens of ['fisheye', 'panoramic'] as const) {
                const fitted = fitSeed(seed, lens)
                expect(lensForSeed(fitted)).toBe(lens)
                expect(Math.abs(fitted - seed)).toBeLessThan(2)
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
        expect(poseFromSeed(48213)).not.toEqual(poseFromSeed(48215))
    })

    it('keeps a panorama level, with the horizon well inside the canvas', () => {
        for (const seed of SEEDS.filter((s) => lensForSeed(s) === 'panoramic')) {
            const { camera } = poseFromSeed(seed)
            expect(camera.pitch).toBe(0)
            expect(camera.center[1]).toBeGreaterThanOrEqual(0.3)
            expect(camera.center[1]).toBeLessThanOrEqual(0.7)
        }
    })

    it('shows one end of every direction on a fish-eye, and two level points on a panorama', () => {
        for (const seed of SEEDS) {
            const { camera } = poseFromSeed(seed)
            const points = vanishingPoints(camera)
            const numbers = new Set(points.map((v) => v.family.number))
            if (camera.lens === 'fisheye') expect([...numbers].sort()).toEqual([1, 2, 3])
            else expect([...numbers].sort()).toEqual([1, 2])
            for (const v of points.filter((v) => !v.far)) {
                expect(inView(camera, v.family.toward)).toBe(true)
            }
        }
    })

    it('puts the whole sample box in front of the eye, in the picture and off the horizon', () => {
        for (const seed of SEEDS) {
            const { camera, box } = poseFromSeed(seed)
            expect(Math.hypot(...box.half)).toBeLessThan(Math.hypot(...box.center) * 0.6)
            const world = corners(box)
            // All above eye level, or all below: you see its top or its underside.
            const above = world.map((p) => p[1] > 0)
            expect(new Set(above).size).toBe(1)
            for (const p of world) expect(inView(camera, p)).toBe(true)
            const onCanvas = EDGES.every(([a, b]) =>
                projectSegment(camera, world[a], world[b]).every(
                    ([x, y]) => x > 0 && x < 1 && y > 0 && y < 1,
                ),
            )
            expect(onCanvas).toBe(true)
        }
    })

    it('keeps grids stable, so shared links still show the same grid', () => {
        const fish = poseFromSeed(48212)
        expect(fish.camera).toEqual({ lens: 'fisheye', yaw: 0, pitch: 0, center: [0.5, 0.5] })
        expect(fish.box.center[0]).toBeCloseTo(0.387571, 6)
        const pano = poseFromSeed(48213)
        expect(pano.camera.lens).toBe('panoramic')
        expect(pano.camera.yaw).toBeCloseTo(-0.259882, 6)
        expect(pano.camera.center[1]).toBeCloseTo(0.656291, 6)
        expect(pano.box.half[2]).toBeCloseTo(0.213975, 6)
    })
})
