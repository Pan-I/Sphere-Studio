// src/math/curvilinear.ts
import { cameraAxes, toCamera, type Point } from './perspective'
import { cross, dot, type Vec3 } from './quat'

/**
 * How a curvilinear picture bends straight lines.
 *
 * - `fisheye`: a round picture that sees half the world (180° across). Every straight line becomes
 *   an arc, and each direction has two vanishing points, one at each end of its lines (5 point
 *   perspective when looking straight along a direction, up to 6 when turned).
 * - `panoramic`: a picture 180° wide, as if painted on a cylinder around the eye and unrolled.
 *   Verticals stay straight and parallel, and level lines bow into curves that meet at two points
 *   on the horizon for each direction (4 point perspective).
 */
export type Lens = 'fisheye' | 'panoramic'

/**
 * The eye of a curvilinear picture. As for the straight-lens `Camera`, the eye sits at the origin
 * of a world where y points up. A panoramic camera is always level (pitch 0), or its verticals
 * would bend.
 */
export interface CurvedCamera {
    lens: Lens
    /** Turn about the vertical, in radians. At 0 the eye looks straight along +z. */
    yaw: number
    /** Tilt in radians: positive looks up, negative looks down. */
    pitch: number
    /** The center of vision, where the line of sight lands on the picture. */
    center: Point
}

/**
 * Canvas widths per radian, for both lenses: 180° fills the canvas's width (the fish-eye circle's
 * diameter, or the panorama's width).
 */
export const SCALE = 1 / Math.PI

/** The largest angle from the line of sight a fish-eye picture shows: the circle's rim. */
const RIM = Math.PI / 2

/** Where a direction in the camera's own terms (right, up, forward) lands, or null if nowhere. */
function onPicture({ lens, center }: CurvedCamera, [x, y, z]: Vec3): Point | null {
    if (lens === 'fisheye') {
        // Equidistant: the distance from the center grows evenly with the angle off the line of
        // sight, so the picture can reach 90° to every side (and past it, outside the circle).
        const side = Math.hypot(x, y)
        const angle = Math.atan2(side, z)
        if (side < 1e-12) return z > 0 ? center : null
        const r = SCALE * angle
        return [center[0] + (r * x) / side, center[1] - (r * y) / side]
    }
    // Cylindrical: across is the angle round the vertical, up is the height on the cylinder.
    const level = Math.hypot(x, z)
    if (level < 1e-12) return null
    return [center[0] + SCALE * Math.atan2(x, z), center[1] - (SCALE * y) / level]
}

/**
 * Where a world direction (or a point, seen from the eye at the origin) lands on the picture.
 * Null for the one direction a lens can't place: straight behind a fish-eye, or straight up or
 * down on a panorama. Directions outside the picture still land, beyond the circle or canvas.
 */
export function projectDirection(camera: CurvedCamera, d: Vec3): Point | null {
    return onPicture(camera, toCamera(camera, d))
}

/** The unit world direction that lands at `p` on the picture: the inverse of `projectDirection`. */
export function unprojectPoint(camera: CurvedCamera, p: Point): Vec3 {
    const dx = (p[0] - camera.center[0]) / SCALE
    const dy = -(p[1] - camera.center[1]) / SCALE
    let c: Vec3
    if (camera.lens === 'fisheye') {
        const angle = Math.hypot(dx, dy)
        const s = angle < 1e-12 ? 0 : Math.sin(angle) / angle
        c = [dx * s, dy * s, Math.cos(angle)]
    } else {
        const n = Math.hypot(1, dy)
        c = [Math.sin(dx) / n, dy / n, Math.cos(dx) / n]
    }
    const { right, up, forward } = cameraAxes(camera)
    return [0, 1, 2].map((i) => right[i] * c[0] + up[i] * c[1] + forward[i] * c[2]) as never
}

/** How far a direction is from the middle of the picture: off the line of sight, or round. */
function offCenter(camera: CurvedCamera, d: Vec3): number {
    const [x, y, z] = toCamera(camera, d)
    return camera.lens === 'fisheye' ? Math.atan2(Math.hypot(x, y), z) : Math.abs(Math.atan2(x, z))
}

/**
 * Whether a world direction is in the picture: inside the fish-eye circle (its rim included),
 * or on the panorama's canvas.
 */
export function inView(camera: CurvedCamera, d: Vec3): boolean {
    if (offCenter(camera, d) > RIM + 1e-9) return false
    if (camera.lens === 'fisheye') return true
    const p = projectDirection(camera, d)
    return p !== null && p[1] >= -1e-9 && p[1] <= 1 + 1e-9
}

/** Samples along a full great circle. Enough that a curve looks smooth at 1600 pixels. */
const CIRCLE_SAMPLES = 480
/** How far past the rim a curve is kept, so it reaches the edge before it's clipped. */
const OVERSHOOT = 0.15
/** A step this long on the picture means the curve jumped (round the back), so it's split. */
const JUMP = 0.2
/** Panorama points further than this above or below the canvas are dropped. */
const FAR = 2

const normalize = (v: Vec3): Vec3 => {
    const n = Math.hypot(...v)
    return [v[0] / n, v[1] / n, v[2] / n]
}

/**
 * The picture of the great circle through the unit directions `a` and `b` (at right angles):
 * every direction cos s·a + sin s·b. A straight line in the world, seen from the eye, lies on
 * such a circle. Returned as the pieces that fall in or near the picture, each a polyline.
 */
export function greatCircle(camera: CurvedCamera, a: Vec3, b: Vec3): Point[][] {
    const pieces: Point[][] = []
    let piece: Point[] = []
    const flush = () => {
        if (piece.length > 1) pieces.push(piece)
        piece = []
    }
    for (let k = 0; k <= CIRCLE_SAMPLES; k++) {
        const s = (2 * Math.PI * k) / CIRCLE_SAMPLES
        const d: Vec3 = [0, 1, 2].map((i) => Math.cos(s) * a[i] + Math.sin(s) * b[i]) as never
        const p = offCenter(camera, d) <= RIM + OVERSHOOT ? projectDirection(camera, d) : null
        if (!p || Math.abs(p[1] - 0.5) > FAR) {
            flush()
            continue
        }
        const last = piece[piece.length - 1]
        if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) > JUMP) flush()
        piece.push(p)
    }
    flush()
    // A circle that is in view where it starts and ends was cut in two at the start; rejoin it.
    if (pieces.length > 1) {
        const first = pieces[0]
        const last = pieces[pieces.length - 1]
        const [a0, b0] = [first[0], last[last.length - 1]]
        if (Math.hypot(a0[0] - b0[0], a0[1] - b0[1]) < 1e-9) {
            pieces[0] = [...last, ...first.slice(1)]
            pieces.pop()
        }
    }
    return pieces
}

/**
 * The guide lines for direction `d`: `count` great circles through d and −d, turned evenly about
 * d, the first one also holding `first`. Every straight line running along d lies on one of
 * these circles' planes, so they are the curved version of a fan of lines from a vanishing point:
 * each one runs from the point at d to the opposite one at −d.
 */
export function fanCircles(camera: CurvedCamera, d: Vec3, count: number, first: Vec3): Point[][][] {
    const u = normalize(d)
    const a = normalize([0, 1, 2].map((i) => first[i] - dot(first, u) * u[i]) as unknown as Vec3)
    const b = cross(u, a)
    return Array.from({ length: Math.max(0, count) }, (_, k) => {
        const psi = (Math.PI * k) / count
        const w: Vec3 = [0, 1, 2].map((i) => Math.cos(psi) * a[i] + Math.sin(psi) * b[i]) as never
        return greatCircle(camera, u, w)
    })
}

/** The horizon: the great circle of level directions, as polylines. */
export function horizonCurve(camera: CurvedCamera): Point[][] {
    return greatCircle(camera, [1, 0, 0], [0, 0, 1])
}

/**
 * The picture of the straight segment from `p` to `q` (world points, in front of the eye), as a
 * polyline: on a curvilinear picture a straight edge bows, so it's sampled along its length.
 */
export function projectSegment(camera: CurvedCamera, p: Vec3, q: Vec3, steps = 32): Point[] {
    const out: Point[] = []
    for (let k = 0; k <= steps; k++) {
        const t = k / steps
        const at = projectDirection(camera, [0, 1, 2].map((i) => p[i] + t * (q[i] - p[i])) as never)
        if (at) out.push(at)
    }
    return out
}
