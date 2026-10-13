import { describe, expect, it } from 'vitest'
import { MAX_SEED } from '../shared/seed'
import { quatFromSeed } from './pose'

describe('quatFromSeed', () => {
    it('is deterministic and gives different orientations for different seeds', () => {
        expect(quatFromSeed(1234)).toEqual(quatFromSeed(1234))
        expect(quatFromSeed(1)).not.toEqual(quatFromSeed(2))
    })

    it('returns unit quaternions', () => {
        for (const seed of [0, 1, 48213, MAX_SEED]) {
            expect(Math.hypot(...quatFromSeed(seed))).toBeCloseTo(1)
        }
    })

    it('keeps orientations stable, so shared links still show the same pose', () => {
        const expected = [
            -0.8120907672079867, 0.07716419578870304, -0.35791537029873954, -0.4543686393312621,
        ]
        expected.forEach((v, i) => expect(quatFromSeed(48213)[i]).toBeCloseTo(v, 10))
    })
})
