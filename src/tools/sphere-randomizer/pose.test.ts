import { describe, expect, it } from 'vitest'
import { rotate } from '../../math/quat'
import { sectorOf } from '../../math/sphere'
import { MAX_SEED } from '../shared/seed'
import { poseFromSeed, quatFromSeed } from './pose'

describe('quatFromSeed', () => {
    it('is deterministic', () => {
        expect(quatFromSeed(1234)).toEqual(quatFromSeed(1234))
    })

    it('gives different orientations for different seeds', () => {
        expect(quatFromSeed(1)).not.toEqual(quatFromSeed(2))
    })

    it('returns unit quaternions', () => {
        for (const seed of [0, 1, 999_999]) {
            expect(Math.hypot(...quatFromSeed(seed))).toBeCloseTo(1)
        }
    })

    it('spreads consecutive seeds evenly across all eight sectors', () => {
        const counts = new Array(8).fill(0)
        const n = 8000
        for (let seed = 0; seed < n; seed++) {
            counts[sectorOf(rotate(quatFromSeed(seed), [0, 0, 1]))]++
        }
        for (const c of counts) {
            expect(c / n).toBeGreaterThan(0.09) // expected 0.125
            expect(c / n).toBeLessThan(0.16)
        }
    })
})

describe('poseFromSeed', () => {
    it('keeps orientations stable, so links shared earlier still show the same pose', () => {
        const q = quatFromSeed(48213)
        const expected = [
            -0.8120907672079867, 0.07716419578870304, -0.35791537029873954, -0.4543686393312621,
        ]
        expected.forEach((v, i) => expect(q[i]).toBeCloseTo(v, 10))
    })

    it('uses the same orientation as quatFromSeed', () => {
        for (const seed of [0, 7, 1234, MAX_SEED]) {
            expect(poseFromSeed(seed).q).toEqual(quatFromSeed(seed))
        }
    })

    it('is deterministic and keeps the marker pick in [0, 1)', () => {
        expect(poseFromSeed(99)).toEqual(poseFromSeed(99))
        for (let seed = 0; seed < 1000; seed++) {
            const { markerPick } = poseFromSeed(seed)
            expect(markerPick).toBeGreaterThanOrEqual(0)
            expect(markerPick).toBeLessThan(1)
        }
    })

    it('spreads marker picks evenly across consecutive seeds', () => {
        const thirds = [0, 0, 0]
        const n = 6000
        for (let seed = 0; seed < n; seed++) thirds[Math.floor(poseFromSeed(seed).markerPick * 3)]++
        for (const c of thirds) {
            expect(c / n).toBeGreaterThan(0.29) // expected 0.333
            expect(c / n).toBeLessThan(0.38)
        }
    })
})
