import { describe, expect, it } from 'vitest'
import {
    fanCircles,
    greatCircle,
    horizonCurve,
    inView,
    projectDirection,
    projectSegment,
    unprojectPoint,
    type CurvedCamera,
    type Lens,
} from './curvilinear'
import type { Point } from './perspective'
import type { Vec3 } from './quat'

const fisheye = (yaw: number, pitch: number): CurvedCamera => ({
    lens: 'fisheye',
    yaw,
    pitch,
    center: [0.5, 0.5],
})
const panoramic = (yaw: number, horizon: number): CurvedCamera => ({
    lens: 'panoramic',
    yaw,
    pitch: 0,
    center: [0.5, horizon],
})
const CAMERAS: CurvedCamera[] = [
    fisheye(0, 0),
    fisheye(0.4, -0.6),
    fisheye(-0.7, 0.9),
    panoramic(0, 0.5),
    panoramic(0.6, 0.35),
]

const near = (a: Point | null, b: Point | null, tol = 1e-6) => {
    expect(a).not.toBeNull()
    expect(b).not.toBeNull()
    expect(Math.hypot(a![0] - b![0], a![1] - b![1])).toBeLessThan(tol)
}
const unit = (v: Vec3) => Math.hypot(...v)
const along = (p: Vec3, d: Vec3, t: number): Vec3 => [
    p[0] + t * d[0],
    p[1] + t * d[1],
    p[2] + t * d[2],
]
const closest = (pieces: Point[][], p: Point) =>
    Math.min(...pieces.flat().map((q) => Math.hypot(q[0] - p[0], q[1] - p[1])))

describe('projectDirection and unprojectPoint', () => {
    it('round-trip across the picture, for both lenses', () => {
        for (const camera of CAMERAS) {
            for (const p of [
                [0.5, 0.5],
                [0.2, 0.7],
                [0.8, 0.15],
                [0.6, 0.9],
            ] as Point[]) {
                const d = unprojectPoint(camera, p)
                expect(unit(d)).toBeCloseTo(1)
                near(projectDirection(camera, d), p)
            }
        }
    })

    it('puts the line of sight at the center of vision', () => {
        for (const camera of CAMERAS) {
            near(projectDirection(camera, unprojectPoint(camera, camera.center)), camera.center)
        }
    })

    it('puts directions 90° off the line of sight on the fish-eye rim', () => {
        const camera = fisheye(0, 0)
        for (const d of [
            [1, 0, 0],
            [-1, 0, 0],
            [0, 1, 0],
            [0.6, -0.8, 0],
        ] as Vec3[]) {
            const p = projectDirection(camera, d)!
            expect(Math.hypot(p[0] - 0.5, p[1] - 0.5)).toBeCloseTo(0.5)
            expect(inView(camera, d)).toBe(true)
        }
        expect(inView(camera, [0, 0.1, -1])).toBe(false)
    })

    it('has no place for straight behind a fish-eye, or straight up on a panorama', () => {
        expect(projectDirection(fisheye(0, 0), [0, 0, -1])).toBeNull()
        expect(projectDirection(panoramic(0, 0.5), [0, 1, 0])).toBeNull()
    })
})

describe('straight lines on a curvilinear picture', () => {
    it('run to the vanishing point of their direction, at both ends', () => {
        const p: Vec3 = [0.3, -0.4, 1]
        for (const camera of CAMERAS) {
            for (const d of [
                [1, 0, 0],
                [0, 0, 1],
                [0.6, 0, -0.8],
            ] as Vec3[]) {
                for (const sign of [1, -1]) {
                    const end = projectDirection(camera, along([0, 0, 0], d, sign))
                    if (!end) continue
                    near(projectDirection(camera, along(p, d, sign * 1e7)), end, 1e-5)
                }
            }
        }
    })

    it('keep verticals straight and upright on a panorama', () => {
        const camera = panoramic(0.6, 0.35)
        const xs = [-2, -0.5, 0, 0.7, 3].map((y) => projectDirection(camera, [0.4, y, 1.2])![0])
        for (const x of xs) expect(x).toBeCloseTo(xs[0], 9)
    })

    it('bend level lines on a panorama, and every line off the middle on a fish-eye', () => {
        const midpointOff = (camera: CurvedCamera, a: Vec3, b: Vec3) => {
            const [pa, pb, pm] = [a, b, along(a, along(b, a, -1), 0.5)].map((v) =>
                projectDirection(camera, v)!,
            )
            const chord = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2]
            return Math.hypot(pm[0] - chord[0], pm[1] - chord[1])
        }
        expect(midpointOff(panoramic(0, 0.5), [-1, -0.5, 1], [1, -0.5, 1])).toBeGreaterThan(0.02)
        expect(midpointOff(fisheye(0, 0), [-1, -0.5, 1], [1, -0.5, 1])).toBeGreaterThan(0.02)
        // Through the middle of a fish-eye, a line stays straight.
        expect(midpointOff(fisheye(0, 0), [-1, 0, 1], [1, 0, 1])).toBeLessThan(1e-9)
    })

    it('are sampled along their length by projectSegment, from end to end', () => {
        for (const camera of CAMERAS) {
            const [a, b]: Vec3[] = [
                [-0.3, -0.2, 1],
                [0.2, -0.4, 0.8],
            ]
            const line = projectSegment(camera, a, b, 16)
            expect(line).toHaveLength(17)
            near(line[0], projectDirection(camera, a))
            near(line[16], projectDirection(camera, b))
        }
    })
})

describe('great circles, fans and the horizon', () => {
    it('trace a level line, seen from the eye, onto its great circle', () => {
        const camera = fisheye(0.4, -0.6)
        const pieces = greatCircle(camera, [1, 0, 0], [0, -0.6, 0.8])
        for (const t of [-0.5, 0, 0.4]) {
            const p = projectDirection(camera, [t, -0.6, 0.8])!
            expect(closest(pieces, p)).toBeLessThan(0.01)
        }
    })

    it('fans out `count` circles, each through both of its vanishing points when in view', () => {
        for (const camera of CAMERAS) {
            const d: Vec3 = [1, 0, 0]
            const fan = fanCircles(camera, d, 7, [0, 0, 1])
            expect(fan).toHaveLength(7)
            for (const end of [d, along([0, 0, 0], d, -1)]) {
                if (!inView(camera, end)) continue
                const vp = projectDirection(camera, end)!
                for (const circle of fan) expect(closest(circle, vp)).toBeLessThan(0.01)
            }
        }
        expect(fanCircles(fisheye(0, 0), [1, 0, 0], 0, [0, 0, 1])).toEqual([])
    })

    it('has a straight horizon through the middle when the camera is level', () => {
        for (const camera of [fisheye(0.3, 0), panoramic(0.5, 0.4)] as CurvedCamera[]) {
            const ys = horizonCurve(camera)
                .flat()
                .map((p) => p[1])
            expect(ys.length).toBeGreaterThan(50)
            for (const y of ys) expect(y).toBeCloseTo(camera.center[1], 9)
        }
    })

    it('curves the horizon when a fish-eye looks up or down', () => {
        const ys = horizonCurve(fisheye(0, -0.6))
            .flat()
            .map((p) => p[1])
        expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.05)
    })

    it('splits a circle into pieces without jumps', () => {
        for (const lens of ['fisheye', 'panoramic'] as Lens[]) {
            const camera = lens === 'fisheye' ? fisheye(0.2, 0.3) : panoramic(0.2, 0.5)
            for (const piece of greatCircle(camera, [0, 0, 1], [0.6, 0.8, 0])) {
                for (let i = 1; i < piece.length; i++) {
                    const [a, b] = [piece[i - 1], piece[i]]
                    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(0.2)
                }
            }
        }
    })
})
