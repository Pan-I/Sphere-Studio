// src/math/cylinder.test.ts
import { describe, expect, it } from 'vitest'
import { project } from './cube'
import {
    MAX_PROPORTION,
    MIN_PROPORTION,
    capDiameters,
    frontArc,
    makeCylinder,
    proportionFromPick,
    rimPoint,
    sideFacing,
    type Cylinder,
} from './cylinder'
import { dot, randomQuat, type Vec3 } from './quat'
import { mulberry32 } from './random'

const CAMERA = 5
const length = (v: Vec3) => Math.hypot(v[0], v[1], v[2])

/** 300 cylinders in random orientations and proportions, the same ones every run. */
const randomCylinders = (): Cylinder[] => {
    const rand = mulberry32(2024)
    return Array.from({ length: 300 }, () =>
        makeCylinder(randomQuat(rand), proportionFromPick(rand())),
    )
}

describe('cylinder proportions', () => {
    it('runs from squat to long, staying in range', () => {
        expect(proportionFromPick(0)).toBeCloseTo(MIN_PROPORTION)
        expect(proportionFromPick(0.999999)).toBeCloseTo(MAX_PROPORTION, 4)
        expect(proportionFromPick(0.5)).toBeGreaterThan(1) // the middle is about as long as wide
    })

    it('puts the rims on the unit sphere, at the asked length / diameter', () => {
        for (const cyl of randomCylinders()) {
            expect(Math.hypot(cyl.radius, cyl.halfLength)).toBeCloseTo(1)
            expect(length(rimPoint(cyl, cyl.caps[1], 1.234))).toBeCloseTo(1)
        }
        const cyl = makeCylinder([0, 0, 0, 1], 2)
        expect(cyl.halfLength / cyl.radius).toBeCloseTo(2)
        expect(cyl.axis).toEqual([0, 1, 0])
    })

    it('has an axis and rim directions at right angles', () => {
        for (const { axis, u, v } of randomCylinders()) {
            for (const d of [axis, u, v]) expect(length(d)).toBeCloseTo(1)
            expect(dot(axis, u)).toBeCloseTo(0)
            expect(dot(axis, v)).toBeCloseTo(0)
            expect(dot(u, v)).toBeCloseTo(0)
        }
    })
})

describe.each([
    ['flat', null],
    ['perspective', CAMERA],
] as const)('the side lines, in a %s view', (_, camera) => {
    it('fall exactly where the side turns away, with the side facing you only between them', () => {
        for (const cyl of randomCylinders()) {
            const [a, b] = frontArc(cyl, camera)
            if (a === b) {
                // Looking down the axis: the side faces away all the way round.
                for (let i = 0; i < 12; i++) expect(sideFacing(cyl, i, camera)).toBeLessThan(0)
                continue
            }
            expect(sideFacing(cyl, a, camera)).toBeCloseTo(0)
            expect(sideFacing(cyl, b, camera)).toBeCloseTo(0)
            expect(sideFacing(cyl, (a + b) / 2, camera)).toBeGreaterThan(0)
            expect(sideFacing(cyl, (a + b) / 2 + Math.PI, camera)).toBeLessThan(0)
        }
    })

    it('touch both ellipses: each rim runs along the side line where they meet', () => {
        const screen = (p: Vec3) => project(p, camera)
        for (const cyl of randomCylinders()) {
            const [a, b] = frontArc(cyl, camera)
            if (a === b) continue // no side lines when looking down the axis
            for (const phi of [a, b]) {
                const ends = cyl.caps.map((o) => screen(rimPoint(cyl, o, phi)))
                const side = [ends[1][0] - ends[0][0], ends[1][1] - ends[0][1]]
                for (const o of cyl.caps) {
                    // The rim's direction on screen at that point, from two nearby points.
                    const p = screen(rimPoint(cyl, o, phi - 1e-5))
                    const n = screen(rimPoint(cyl, o, phi + 1e-5))
                    const rim = [n[0] - p[0], n[1] - p[1]]
                    const sin =
                        (side[0] * rim[1] - side[1] * rim[0]) /
                        (Math.hypot(...side) * Math.hypot(...rim))
                    expect(Math.abs(sin)).toBeLessThan(1e-3)
                }
            }
        }
    })
})

describe('ellipses in a flat view', () => {
    it('have the radius as their long half-axis and lose length only along the axis', () => {
        for (const cyl of randomCylinders()) {
            const { major, minor } = capDiameters(cyl)
            expect(dot(major, cyl.axis)).toBeCloseTo(0)
            expect(dot(minor, cyl.axis)).toBeCloseTo(0)
            expect(dot(major, minor)).toBeCloseTo(0)
            // The major diameter lies across the line of sight, so it keeps its full length.
            expect(major[2]).toBeCloseTo(0)

            // Walk the rim: the farthest a rim point lands from the cap's centre on screen is the
            // radius, and the nearest is the radius times how much the cap faces you.
            const dist = Array.from({ length: 720 }, (_, i) => {
                const p = rimPoint(cyl, cyl.caps[0], (i / 720) * 2 * Math.PI)
                return Math.hypot(p[0] - cyl.caps[0][0], p[1] - cyl.caps[0][1])
            })
            expect(Math.max(...dist)).toBeCloseTo(cyl.radius, 3)
            expect(Math.min(...dist)).toBeCloseTo(cyl.radius * Math.abs(cyl.axis[2]), 2)
        }
    })

    it('put the minor axis along the cylinder axis on screen', () => {
        for (const cyl of randomCylinders()) {
            const { minor } = capDiameters(cyl)
            const along = Math.hypot(cyl.axis[0], cyl.axis[1])
            if (along < 1e-3) continue // seen end-on, the axis is a dot
            const cross = minor[0] * cyl.axis[1] - minor[1] * cyl.axis[0]
            expect(cross / (along * Math.hypot(minor[0], minor[1]))).toBeCloseTo(0)
        }
    })
})
