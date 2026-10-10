// src/math/quat.test.ts
import { describe, expect, it } from 'vitest'
import { randomQuat, rotate, type Quat, type Vec3 } from './quat'
import { mulberry32 } from './random'

const len = (v: Vec3) => Math.hypot(...v)

describe('quaternion math', () => {
    it('leaves vectors unchanged under the identity rotation', () => {
        const id: Quat = [0, 0, 0, 1]
        expect(rotate(id, [1, 2, 3])).toEqual([1, 2, 3])
    })

    it('rotates X to Y for 90° about Z', () => {
        const s = Math.SQRT1_2
        const q: Quat = [0, 0, s, s]
        const [x, y, z] = rotate(q, [1, 0, 0])
        expect(x).toBeCloseTo(0)
        expect(y).toBeCloseTo(1)
        expect(z).toBeCloseTo(0)
    })

    it('generates unit quaternions that preserve vector length', () => {
        const rand = mulberry32(42)
        for (let i = 0; i < 100; i++) {
            const q = randomQuat(rand)
            expect(Math.hypot(...q)).toBeCloseTo(1)
            expect(len(rotate(q, [0.3, -0.5, 0.8]))).toBeCloseTo(len([0.3, -0.5, 0.8]))
        }
    })

    it('is deterministic for a given seed', () => {
        expect(randomQuat(mulberry32(7))).toEqual(randomQuat(mulberry32(7)))
    })
})
