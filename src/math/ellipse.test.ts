import { describe, expect, it } from 'vitest'
import { project } from './cube'
import { capDiameters, makeCylinder, rimPoint } from './cylinder'
import { projectedCircle } from './ellipse'
import { randomQuat } from './quat'
import { mulberry32 } from './random'

const CAMERA = 5

/** Random cylinder caps: the circle's centre, its two radius vectors, and the cylinder. */
function caps(count: number) {
    const rand = mulberry32(7)
    return Array.from({ length: count }, () => {
        const cyl = makeCylinder(randomQuat(rand), 0.5 + rand() * 2.5)
        const scaled = (v: readonly number[]) =>
            v.map((x) => x * cyl.radius) as [number, number, number]
        return { cyl, centre: cyl.caps[rand() < 0.5 ? 0 : 1], a: scaled(cyl.u), b: scaled(cyl.v) }
    })
}

describe('projectedCircle', () => {
    for (const camera of [null, CAMERA]) {
        const view = camera === null ? 'flat' : 'perspective'

        it(`gives an ellipse that every projected rim point lies on (${view})`, () => {
            for (const { cyl, centre, a, b } of caps(200)) {
                const e = projectedCircle(centre, a, b, camera)!
                expect(e).not.toBeNull()
                const majorLen = Math.hypot(...e.major)
                const minorLen = Math.hypot(...e.minor)
                expect(minorLen).toBeLessThanOrEqual(majorLen + 1e-12)
                // The axes are at right angles.
                expect(e.major[0] * e.minor[0] + e.major[1] * e.minor[1]).toBeCloseTo(0, 9)
                for (let i = 0; i < 24; i++) {
                    const [x, y] = project(rimPoint(cyl, centre, (i / 24) * 2 * Math.PI), camera)
                    const dx = x - e.centre[0]
                    const dy = y - e.centre[1]
                    // In the ellipse's own frame: (x/A)² + (y/B)² = 1.
                    const along = (dx * e.major[0] + dy * e.major[1]) / majorLen ** 2
                    const across = (dx * e.minor[0] + dy * e.minor[1]) / minorLen ** 2
                    expect(along ** 2 + across ** 2).toBeCloseTo(1, 6)
                }
            }
        })
    }

    it('matches the classic flat-view rules: centre stays put, minor axis along the cylinder', () => {
        for (const { cyl, centre, a, b } of caps(200)) {
            const e = projectedCircle(centre, a, b, null)!
            expect(e.centre[0]).toBeCloseTo(centre[0], 9)
            expect(e.centre[1]).toBeCloseTo(centre[1], 9)
            expect(Math.hypot(...e.major)).toBeCloseTo(cyl.radius, 9)
            expect(Math.hypot(...e.minor)).toBeCloseTo(cyl.radius * Math.abs(cyl.axis[2]), 9)
            // The minor axis is parallel to the cylinder's axis on screen, and the major axis to
            // the cap diameter that lies across the line of sight.
            const { major } = capDiameters(cyl)
            expect(e.minor[0] * cyl.axis[1] - e.minor[1] * cyl.axis[0]).toBeCloseTo(0, 9)
            expect(e.major[0] * major[1] - e.major[1] * major[0]).toBeCloseTo(0, 9)
        }
    })

    it('moves the perspective ellipse’s centre off the circle’s projected centre', () => {
        const shifts = caps(50).map(({ centre, a, b }) => {
            const e = projectedCircle(centre, a, b, CAMERA)!
            const [x, y] = project(centre, CAMERA)
            return Math.hypot(e.centre[0] - x, e.centre[1] - y)
        })
        expect(Math.max(...shifts)).toBeGreaterThan(1e-3)
    })

    it('returns null for a circle seen exactly edge-on', () => {
        expect(projectedCircle([0, 0, 0], [0.5, 0, 0], [0, 0, 0.5], null)).toBeNull()
        expect(projectedCircle([0, 0, 0], [0.5, 0, 0], [0, 0.5, 0], null)).not.toBeNull()
    })
})
