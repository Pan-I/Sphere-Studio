import { describe, expect, it } from 'vitest'
import { poseFromSeed as cylinderPose } from '../cylinder-randomizer/pose'
import { MAX_SEED } from '../shared/seed'
import { poseFromSeed } from './pose'

describe('poseFromSeed', () => {
    it('is deterministic and gives different poses for different seeds', () => {
        expect(poseFromSeed(1234)).toEqual(poseFromSeed(1234))
        expect(poseFromSeed(1)).not.toEqual(poseFromSeed(2))
    })

    it('gives the cone the same rotation and proportions a seed gives the cylinder', () => {
        for (const seed of [0, 1, 48213, MAX_SEED]) {
            expect(poseFromSeed(seed)).toEqual(cylinderPose(seed))
        }
    })

    it('keeps poses stable, so shared links still show the same cone', () => {
        expect(poseFromSeed(48213).proportion).toBeCloseTo(0.5573089470570434, 10)
    })
})
