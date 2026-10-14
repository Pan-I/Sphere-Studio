import { describe, expect, it } from 'vitest'
import { MAX_SEED } from '../shared/seed'
import { MAX_ELEVATION, MIN_ELEVATION, describeLight, lightFromSeed } from './pose'

describe('lightFromSeed', () => {
    it('is deterministic and gives different lights for different seeds', () => {
        expect(lightFromSeed(1234)).toEqual(lightFromSeed(1234))
        expect(lightFromSeed(1)).not.toEqual(lightFromSeed(2))
    })

    it('returns unit vectors in the allowed range of heights', () => {
        for (let seed = 0; seed < 2000; seed++) {
            const l = lightFromSeed(seed)
            expect(Math.hypot(...l)).toBeCloseTo(1, 12)
            expect(l[1]).toBeGreaterThanOrEqual(Math.sin(MIN_ELEVATION) - 1e-12)
            expect(l[1]).toBeLessThanOrEqual(Math.sin(MAX_ELEVATION) + 1e-12)
        }
        expect(Math.hypot(...lightFromSeed(MAX_SEED))).toBeCloseTo(1, 12)
    })

    it('never comes from straight behind the viewer or straight behind the sphere', () => {
        for (let seed = 0; seed < 2000; seed++) {
            const [x, , z] = lightFromSeed(seed)
            const azimuth = Math.abs(Math.atan2(x, z))
            expect(azimuth).toBeGreaterThanOrEqual(Math.PI / 6 - 1e-9)
            expect(azimuth).toBeLessThanOrEqual((5 * Math.PI) / 6 + 1e-9)
        }
    })

    it('lights from the left and the right, in front and behind, about equally', () => {
        const counts = { left: 0, front: 0 }
        const n = 4000
        for (let seed = 0; seed < n; seed++) {
            const [x, , z] = lightFromSeed(seed)
            if (x < 0) counts.left++
            if (z > 0) counts.front++
        }
        expect(counts.left / n).toBeGreaterThan(0.45)
        expect(counts.left / n).toBeLessThan(0.55)
        expect(counts.front / n).toBeGreaterThan(0.45)
        expect(counts.front / n).toBeLessThan(0.55)
    })

    it('keeps lights stable, so shared links still show the same light', () => {
        const expected = [-0.5323001170586655, 0.7795198296782746, -0.3301596894196576]
        expected.forEach((v, i) => expect(lightFromSeed(48213)[i]).toBeCloseTo(v, 10))
    })
})

describe('describeLight', () => {
    it('says which side and whether the light is in front', () => {
        expect(describeLight([-0.5, 0.6, 0.6])).toBe('the left, in front of it')
        expect(describeLight([0.5, 0.6, -0.6])).toBe('the right, behind it')
    })
})
