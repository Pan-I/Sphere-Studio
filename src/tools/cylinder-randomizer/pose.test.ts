import { describe, expect, it } from 'vitest'
import { MAX_PROPORTION, MIN_PROPORTION } from '../../math/cylinder'
import { quatFromSeed } from '../box-randomizer/pose'
import { MAX_SEED } from '../shared/seed'
import { poseFromSeed } from './pose'

describe('poseFromSeed', () => {
    it('is deterministic and gives different poses for different seeds', () => {
        expect(poseFromSeed(1234)).toEqual(poseFromSeed(1234))
        expect(poseFromSeed(1)).not.toEqual(poseFromSeed(2))
    })

    it('turns the cylinder the same way a seed turns the cube', () => {
        for (const seed of [0, 1, 48213, MAX_SEED]) {
            expect(poseFromSeed(seed).q).toEqual(quatFromSeed(seed))
        }
    })

    it('gives proportions in range, both squat and long', () => {
        const proportions = Array.from({ length: 200 }, (_, seed) => poseFromSeed(seed).proportion)
        for (const p of proportions) {
            expect(p).toBeGreaterThanOrEqual(MIN_PROPORTION)
            expect(p).toBeLessThan(MAX_PROPORTION)
        }
        expect(proportions.some((p) => p < 1)).toBe(true)
        expect(proportions.some((p) => p > 2)).toBe(true)
    })

    it('keeps poses stable, so shared links still show the same cylinder', () => {
        expect(poseFromSeed(48213).proportion).toBeCloseTo(0.5573089470570434, 10)
    })
})
