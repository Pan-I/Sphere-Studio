// src/math/cube.test.ts
import { describe, expect, it } from 'vitest'
import { mulberry32 } from './random'
import { dot, randomQuat, rotate, type Vec3 } from './quat'
import { CORNERS, EDGES, FACES, HALF_EDGE, facesViewer, project } from './cube'

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const length = (v: Vec3) => Math.hypot(v[0], v[1], v[2])

describe('cube geometry', () => {
    it('has 8 corners, all on the unit sphere', () => {
        expect(CORNERS).toHaveLength(8)
        for (const c of CORNERS) expect(length(c)).toBeCloseTo(1)
    })

    it('has 12 distinct edges, all the same length, with 3 meeting at each corner', () => {
        expect(EDGES).toHaveLength(12)
        expect(new Set(EDGES.map((e) => e.join('-'))).size).toBe(12)
        for (const [a, b] of EDGES)
            expect(length(sub(CORNERS[a], CORNERS[b]))).toBeCloseTo(2 * HALF_EDGE)
        for (let i = 0; i < 8; i++) expect(EDGES.filter((e) => e.includes(i))).toHaveLength(3)
    })

    it('has 6 faces with outward unit normals, two per axis', () => {
        expect(FACES).toHaveLength(6)
        for (const axis of [0, 1, 2]) expect(FACES.filter((f) => f.axis === axis)).toHaveLength(2)
        for (const f of FACES) {
            expect(length(f.normal)).toBeCloseTo(1)
            for (const i of f.corners) expect(dot(CORNERS[i], f.normal)).toBeCloseTo(HALF_EDGE)
        }
    })

    it('walks each face around its edge, so every side of a face is a cube edge', () => {
        const edgeKeys = new Set(EDGES.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`))
        for (const { corners } of FACES) {
            corners.forEach((a, i) => {
                const b = corners[(i + 1) % 4]
                expect(edgeKeys.has(`${Math.min(a, b)}-${Math.max(a, b)}`)).toBe(true)
            })
        }
    })

    it('shares every edge between exactly two faces', () => {
        for (const [a, b] of EDGES) {
            const faces = FACES.filter((f) => f.corners.includes(a) && f.corners.includes(b))
            expect(faces).toHaveLength(2)
        }
    })
})

describe('project', () => {
    it('drops depth in a flat view', () => {
        expect(project([0.3, -0.2, 0.9], null)).toEqual([0.3, -0.2])
    })

    it('keeps points at depth 0 the same size, and makes near points bigger than far ones', () => {
        expect(project([0.5, 0.5, 0], 5)).toEqual([0.5, 0.5])
        expect(project([0.5, 0, 0.5], 5)[0]).toBeGreaterThan(0.5)
        expect(project([0.5, 0, -0.5], 5)[0]).toBeLessThan(0.5)
    })
})

describe('facesViewer', () => {
    it('sees the +z face and not the −z face of an unrotated cube', () => {
        for (const camera of [null, 5]) {
            expect(facesViewer([0, 0, 1], [0, 0, HALF_EDGE], camera)).toBe(true)
            expect(facesViewer([0, 0, -1], [0, 0, -HALF_EDGE], camera)).toBe(false)
            // Side faces are edge-on in a flat view, and hidden in perspective.
            expect(facesViewer([1, 0, 0], [HALF_EDGE, 0, 0], camera)).toBe(false)
        }
    })

    it('sees one, two or three faces, never both faces of an axis', () => {
        const rand = mulberry32(1)
        for (let n = 0; n < 500; n++) {
            const q = randomQuat(rand)
            for (const camera of [null, 5]) {
                const seen = FACES.filter((f) =>
                    facesViewer(rotate(q, f.normal), rotate(q, CORNERS[f.corners[0]]), camera),
                )
                expect(seen.length).toBeGreaterThanOrEqual(1)
                expect(seen.length).toBeLessThanOrEqual(3)
                expect(new Set(seen.map((f) => f.axis)).size).toBe(seen.length)
            }
        }
    })
})
