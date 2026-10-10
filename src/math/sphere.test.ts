import { describe, expect, it } from 'vitest'
import { conjugate, cross, dot, randomQuat, rotate, type Quat, type Vec3 } from './quat'
import { mulberry32 } from './random'
import {
    GREAT_CIRCLES,
    INTERSECTIONS,
    MIN_FRONT_Z,
    frontIntersections,
    pickMarker,
    sectorOf,
    splitByVisibility,
    unprojectOrthographic,
} from './sphere'

describe('sectorOf', () => {
    // All eight sign combinations, one point per octant.
    const samples: Vec3[] = [
        [1, 1, 1],
        [-1, 1, 1],
        [1, -1, 1],
        [-1, -1, 1],
        [1, 1, -1],
        [-1, 1, -1],
        [1, -1, -1],
        [-1, -1, -1],
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
const at = (z: number, i = 0): Vec3 => [i, 0, z]

describe('splitByVisibility', () => {
    it('returns nothing for fewer than two points', () => {
        expect(splitByVisibility([])).toEqual([])
        expect(splitByVisibility([at(1)])).toEqual([])
    })

    it('keeps a fully front-facing line as one run', () => {
        const pts = [at(1, 0), at(0.5, 1), at(0.2, 2)]
        const runs = splitByVisibility(pts)
        expect(runs).toHaveLength(1)
        expect(runs[0].front).toBe(true)
        expect(runs[0].points).toEqual(pts)
    })

    it('keeps a fully back-facing line as one back run', () => {
        const runs = splitByVisibility([at(-1, 0), at(-0.5, 1), at(-0.2, 2)])
        expect(runs).toHaveLength(1)
        expect(runs[0].front).toBe(false)
    })

    it('splits where visibility changes, sharing the boundary point', () => {
        // Segment averages: +0.9, +0.25 (front), -0.65, -0.35 (back), +0.6 (front)
        const pts = [at(1, 0), at(0.8, 1), at(-0.3, 2), at(-1, 3), at(0.3, 4), at(0.9, 5)]
        const runs = splitByVisibility(pts)
        expect(runs.map((r) => r.front)).toEqual([true, false, true])
        for (let i = 1; i < runs.length; i++) {
            expect(runs[i].points[0]).toBe(runs[i - 1].points[runs[i - 1].points.length - 1])
        }
    })

    it('preserves every segment exactly once', () => {
        const pts = [at(1, 0), at(0.8, 1), at(-0.3, 2), at(-1, 3), at(0.3, 4), at(0.9, 5)]
        const segments = splitByVisibility(pts).reduce((n, r) => n + r.points.length - 1, 0)
        expect(segments).toBe(pts.length - 1)
    })

    it('treats a segment exactly at the horizon as front-facing', () => {
        expect(splitByVisibility([at(0.5, 0), at(-0.5, 1)])[0].front).toBe(true)
    })
})
