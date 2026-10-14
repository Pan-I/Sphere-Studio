// src/math/perspective.test.ts
import { describe, expect, it } from 'vitest'
import { dot, type Vec3 } from './quat'
import {
    cameraAxes,
    edgePoint,
    fanAngles,
    horizonY,
    onePointCamera,
    projectPoint,
    threePointCamera,
    twoPointCamera,
    vanishingPoint,
    type Camera,
    type Point,
} from './perspective'

const X: Vec3 = [1, 0, 0]
const Y: Vec3 = [0, 1, 0]
const Z: Vec3 = [0, 0, 1]

const expectPoint = (actual: Point | null, expected: Point) => {
    expect(actual).not.toBeNull()
    expect(actual![0]).toBeCloseTo(expected[0], 9)
    expect(actual![1]).toBeCloseTo(expected[1], 9)
}

/** How far `p` is from the line through `a` and `b`. */
const offLine = (p: Point, a: Point, b: Point) =>
    Math.abs((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) /
    Math.hypot(b[0] - a[0], b[1] - a[1])

describe('camera axes', () => {
    it('are at right angles and unit length, with right and forward level', () => {
        const { right, up, forward } = cameraAxes({
            yaw: 0.7,
            pitch: -0.4,
            focal: 1,
            center: [0.5, 0.5],
        })
        for (const v of [right, up, forward]) expect(dot(v, v)).toBeCloseTo(1)
        expect(dot(right, up)).toBeCloseTo(0)
        expect(dot(right, forward)).toBeCloseTo(0)
        expect(dot(up, forward)).toBeCloseTo(0)
        expect(right[1]).toBe(0) // no roll: the horizon stays level
    })
})

describe('one point perspective', () => {
    const camera = onePointCamera([0.4, 0.6], 0.6)

    it('sends depth lines to the point and keeps the others parallel', () => {
        expectPoint(vanishingPoint(camera, Z), [0.4, 0.6])
        expect(vanishingPoint(camera, X)).toBeNull()
        expect(vanishingPoint(camera, Y)).toBeNull()
        expect(horizonY(camera)).toBeCloseTo(0.6)
    })
})

describe('two point perspective', () => {
    const camera = twoPointCamera(-0.3, 1.2, 0.45, 0.55)

    it('puts the two points where they were asked for, on the horizon', () => {
        expectPoint(vanishingPoint(camera, Z), [-0.3, 0.45])
        expectPoint(vanishingPoint(camera, X), [1.2, 0.45])
        expect(horizonY(camera)).toBeCloseTo(0.45)
    })

    it('keeps verticals vertical', () => {
        expect(vanishingPoint(camera, Y)).toBeNull()
        const top = projectPoint(camera, [0.3, 0.5, 2])!
        const bottom = projectPoint(camera, [0.3, -0.5, 2])!
        expect(top[0]).toBeCloseTo(bottom[0])
    })
})

describe('three point perspective', () => {
    const third: Point = [0.5, -1.4]
    const camera = threePointCamera(-0.4, 1.3, 0.75, third)

    it('puts all three points where they were asked for', () => {
        expectPoint(vanishingPoint(camera, Z), [-0.4, 0.75])
        expectPoint(vanishingPoint(camera, X), [1.3, 0.75])
        expectPoint(vanishingPoint(camera, Y), third)
        expect(horizonY(camera)).toBeCloseTo(0.75)
    })

    it('looks up when the third point is above the horizon, and down when below', () => {
        expect(camera.pitch).toBeGreaterThan(0)
        const down = threePointCamera(-0.4, 1.3, 0.2, [0.5, 2.4])
        expect(down.pitch).toBeLessThan(0)
        expectPoint(vanishingPoint(down, Y), [0.5, 2.4])
    })

    it('has its center of vision at the orthocenter of the three points', () => {
        const [cx, cy] = camera.center
        // The altitude from the left point is at right angles to the side from right to third.
        const a: Vec3 = [cx - -0.4, cy - 0.75, 0]
        const side: Vec3 = [third[0] - 1.3, third[1] - 0.75, 0]
        expect(dot(a, side)).toBeCloseTo(0)
    })
})

describe('lines in the scene', () => {
    const cameras: Camera[] = [
        onePointCamera([0.5, 0.5], 0.6),
        twoPointCamera(0.1, 1.6, 0.4, 0.6),
        threePointCamera(-0.5, 1.1, 0.3, [0.4, 2]),
    ]

    it.each(cameras)('meet at their vanishing point (%#)', (camera) => {
        for (const d of [X, Y, Z]) {
            const vp = vanishingPoint(camera, d)
            if (!vp) continue
            for (const start of [
                [0.3, -0.2, 2],
                [-0.5, 0.4, 3],
            ] as Vec3[]) {
                const a = projectPoint(camera, start)!
                const b = projectPoint(camera, [start[0] + d[0], start[1] + d[1], start[2] + d[2]])!
                expect(offLine(vp, a, b)).toBeLessThan(1e-9)
            }
        }
    })

    it('hides points behind the eye', () => {
        expect(projectPoint(cameras[0], [0, 0, -1])).toBeNull()
    })
})

describe('fanAngles', () => {
    it('goes all the way round a point on the canvas, one line along the horizon', () => {
        const angles = fanAngles([0.5, 0.5], 6, 0)
        expect(angles).toHaveLength(12)
        expect(angles[0]).toBe(0)
        expect(angles[6]).toBeCloseTo(Math.PI)
    })

    it('fans across the canvas from a point off it, including the horizon', () => {
        const vp: Point = [3, 0.5]
        const angles = fanAngles(vp, 10, Math.PI)
        expect(angles.length).toBeGreaterThanOrEqual(9)
        expect(angles.length).toBeLessThanOrEqual(11)
        expect(angles.some((a) => Math.abs(Math.cos(a) + 1) < 1e-9)).toBe(true)
        // Every line crosses the canvas: where it reaches x = 0.5, it is between top and bottom.
        for (const a of angles) {
            const y = vp[1] + Math.tan(a) * (0.5 - vp[0])
            expect(y).toBeGreaterThan(-0.6)
            expect(y).toBeLessThan(1.6)
        }
    })

    it('gives no lines for a count of 0', () => {
        expect(fanAngles([0.5, 0.5], 0, 0)).toEqual([])
    })
})

describe('edgePoint', () => {
    it('stops where the way to a far point leaves the canvas', () => {
        expectPoint(edgePoint([0.5, 0.4], [4, 0.4], 0.05), [0.95, 0.4])
        expectPoint(edgePoint([0.5, 0.5], [0.5, -3], 0.05), [0.5, 0.05])
    })
})
