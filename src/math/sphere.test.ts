import { describe, expect, it } from 'vitest'
import {conjugate, cross, dot, randomQuat, rotate, type Vec3} from './quat'
import { mulberry32 } from './random'
import {GREAT_CIRCLES, sectorOf, unprojectOrthographic} from './sphere'

describe('sectorOf', () => {
    // All eight sign combinations, one point per octant.
    const samples: Vec3[] = [
        [1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1],
        [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1],
    ]

    it('uses three mutually perpendicular great circles', () => {
        expect(GREAT_CIRCLES).toHaveLength(3)
        const normals = GREAT_CIRCLES.map(([u, v]) => cross(u, v))
        for (let i = 0; i < normals.length; i++) {
            for (let j = i + 1; j < normals.length; j++) {
                expect(dot(normals[i], normals[j])).toBeCloseTo(0)
            }
        }
    })

    it('maps the eight sign combinations to eight distinct sectors', () => {
        expect(new Set(samples.map((p) => sectorOf(p))).size).toBe(8)
    })

    it('puts antipodal points in opposite sectors', () => {
        for (const p of samples) {
            const neg: Vec3 = [-p[0], -p[1], -p[2]]
            expect(sectorOf(neg)).toBe(7 - sectorOf(p))
        }
    })

    it('splits random orientations roughly evenly across all eight sectors', () => {
        const rand = mulberry32(123)
        const counts = new Array(8).fill(0)
        const n = 8000
        for (let i = 0; i < n; i++) {
            counts[sectorOf(rotate(randomQuat(rand), [0, 0, 1]))]++
        }
        for (const c of counts) {
            expect(c / n).toBeGreaterThan(0.09) // expected 0.125
            expect(c / n).toBeLessThan(0.16)
        }
    })
})
describe('unprojectOrthographic', () => {
    it('returns the sphere pole facing the viewer at the disc center', () => {
        const id = conjugate([0, 0, 0, 1])
        expect(unprojectOrthographic(0, 0, id)).toEqual([0, 0, 1])
    })

    it('returns null outside the disc', () => {
        expect(unprojectOrthographic(1.1, 0, [0, 0, 0, 1])).toBeNull()
    })

    it('round-trips: projecting the result back gives the original screen point', () => {
        const rand = mulberry32(9)
        for (let i = 0; i < 20; i++) {
            const q = randomQuat(rand)
            const nx = rand() * 1.2 - 0.6
            const ny = rand() * 1.2 - 0.6
            const model = unprojectOrthographic(nx, ny, conjugate(q))!
            const [x, y, z] = rotate(q, model)
            expect(x).toBeCloseTo(nx)
            expect(y).toBeCloseTo(ny)
            expect(z).toBeCloseTo(Math.sqrt(1 - nx * nx - ny * ny))
        }
    })
})