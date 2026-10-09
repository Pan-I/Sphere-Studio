import { describe, expect, it } from 'vitest'
import { cross, dot, randomQuat, type Quat } from './quat'
import { mulberry32 } from './random'
import {
    GREAT_CIRCLES, INTERSECTIONS, MIN_FRONT_Z, frontIntersections, pickMarker,
} from './sphere'

const identity: Quat = [0, 0, 0, 1]
const normals = GREAT_CIRCLES.map(([u, v]) => cross(u, v))

describe('INTERSECTIONS', () => {
    it('has six distinct unit vectors', () => {
        expect(INTERSECTIONS).toHaveLength(6)
        for (const p of INTERSECTIONS) expect(Math.hypot(...p)).toBeCloseTo(1)
        const keys = INTERSECTIONS.map((p) => p.map((n) => n.toFixed(6)).join(','))
        expect(new Set(keys).size).toBe(6)
    })

    it('lies on exactly two great circles each', () => {
        for (const p of INTERSECTIONS) {
            const onCircle = normals.filter((n) => Math.abs(dot(n, p)) < 1e-9)
            expect(onCircle).toHaveLength(2)
        }
    })

    it('comes in antipodal pairs', () => {
        for (const p of INTERSECTIONS) {
            const found = INTERSECTIONS.some(
                (o) => Math.abs(o[0] + p[0]) + Math.abs(o[1] + p[1]) + Math.abs(o[2] + p[2]) < 1e-9,
            )
            expect(found).toBe(true)
        }
    })
})

describe('frontIntersections', () => {
    it('finds only the pole facing the viewer with no rotation', () => {
        const front = frontIntersections(identity)
        expect(front).toHaveLength(1)
        expect(front[0][2]).toBeCloseTo(1)
    })

    it('always offers one to three candidates, all clearly facing the viewer', () => {
        const rand = mulberry32(2024)
        for (let i = 0; i < 2000; i++) {
            const front = frontIntersections(randomQuat(rand))
            expect(front.length).toBeGreaterThanOrEqual(1)
            expect(front.length).toBeLessThanOrEqual(3)
            for (const p of front) expect(p[2]).toBeGreaterThan(MIN_FRONT_Z)
        }
    })
})

describe('pickMarker', () => {
    const q = randomQuat(mulberry32(5))

    it('returns one of the front-facing intersections', () => {
        const front = frontIntersections(q)
        for (const pick of [0, 0.3, 0.6, 0.999999]) {
            expect(front).toContainEqual(pickMarker(q, pick))
        }
    })

    it('picks the first candidate at 0 and the last just below 1', () => {
        const front = frontIntersections(q)
        expect(pickMarker(q, 0)).toEqual(front[0])
        expect(pickMarker(q, 0.999999)).toEqual(front[front.length - 1])
    })

    it('is deterministic', () => {
        expect(pickMarker(q, 0.42)).toEqual(pickMarker(q, 0.42))
    })
})