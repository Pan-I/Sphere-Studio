// src/math/cone.test.ts
import { describe, expect, it } from 'vitest'
import { facesViewer, project } from './cube'
import { baseNormal, frontArc, makeCone, sideFacing, sideNormal, type Cone } from './cone'
import { proportionFromPick, rimPoint } from './cylinder'
import { dot, randomQuat, type Vec3 } from './quat'
import { mulberry32 } from './random'

const CAMERA = 5
const length = (v: Vec3) => Math.hypot(v[0], v[1], v[2])
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]

/** 300 cones in random orientations and proportions, the same ones every run. */
const randomCones = (): Cone[] => {
    const rand = mulberry32(2024)
    return Array.from({ length: 300 }, () => makeCone(randomQuat(rand), proportionFromPick(rand())))
}

describe('cone shape', () => {
    it('puts the base rim on the unit sphere and the apex inside it, at the asked proportions', () => {
        for (const cone of randomCones()) {
            expect(Math.hypot(cone.radius, cone.halfLength)).toBeCloseTo(1)
            expect(length(rimPoint(cone, cone.base, 1.234))).toBeCloseTo(1)
            expect(length(cone.apex)).toBeLessThan(1)
        }
        const cone = makeCone([0, 0, 0, 1], 2)
        expect(cone.halfLength / cone.radius).toBeCloseTo(2)
        expect(cone.apex[1]).toBeCloseTo(cone.halfLength)
        expect(cone.base[1]).toBeCloseTo(-cone.halfLength)
    })

    it('has a side normal at right angles to the side', () => {
        for (const cone of randomCones()) {
            for (const phi of [0, 1, 2.5, 4]) {
                const slant = sub(cone.apex, rimPoint(cone, cone.base, phi))
                expect(dot(sideNormal(cone, phi), slant)).toBeCloseTo(0)
                // And outward: away from the axis.
                expect(
                    dot(sideNormal(cone, phi), sub(rimPoint(cone, cone.base, phi), cone.base)),
                ).toBeGreaterThan(0)
            }
        }
    })
})

describe.each([
    ['flat', null],
    ['perspective', CAMERA],
] as const)('the side lines, in a %s view', (_, camera) => {
    it('fall exactly where the side turns away, with the side facing you only between them', () => {
        let partial = 0
        for (const cone of randomCones()) {
            const [a, b] = frontArc(cone, camera)
            if (a === b) {
                // Facing the base with the apex behind it: the side faces away all round.
                for (let i = 0; i < 12; i++) expect(sideFacing(cone, i, camera)).toBeLessThan(0)
                expect(facesViewer(baseNormal(cone), cone.base, camera)).toBe(true)
                continue
            }
            if (b - a >= 2 * Math.PI - 1e-9) {
                // Looking down on the apex: the side faces you all round, and the base is hidden.
                for (let i = 0; i < 12; i++) expect(sideFacing(cone, i, camera)).toBeGreaterThan(0)
                expect(facesViewer(baseNormal(cone), cone.base, camera)).toBe(false)
                continue
            }
            partial++
            expect(sideFacing(cone, a, camera)).toBeCloseTo(0)
            expect(sideFacing(cone, b, camera)).toBeCloseTo(0)
            expect(sideFacing(cone, (a + b) / 2, camera)).toBeGreaterThan(0)
            expect(sideFacing(cone, (a + b) / 2 + Math.PI, camera)).toBeLessThan(0)
        }
        expect(partial).toBeGreaterThan(200)
    })

    it('touch the base ellipse, running from it to the apex', () => {
        const screen = (p: Vec3) => project(p, camera)
        for (const cone of randomCones()) {
            const [a, b] = frontArc(cone, camera)
            if (a === b || b - a >= 2 * Math.PI - 1e-9) continue // no side lines
            for (const phi of [a, b]) {
                const foot = screen(rimPoint(cone, cone.base, phi))
                const tip = screen(cone.apex)
                const side = [tip[0] - foot[0], tip[1] - foot[1]]
                // The rim's direction on screen at that point, from two nearby points.
                const p = screen(rimPoint(cone, cone.base, phi - 1e-5))
                const n = screen(rimPoint(cone, cone.base, phi + 1e-5))
                const rim = [n[0] - p[0], n[1] - p[1]]
                const sin =
                    (side[0] * rim[1] - side[1] * rim[0]) /
                    (Math.hypot(...side) * Math.hypot(...rim))
                expect(Math.abs(sin)).toBeLessThan(1e-3)
            }
        }
    })
})
