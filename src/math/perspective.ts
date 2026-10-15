// src/math/perspective.ts
import { dot, type Vec3 } from './quat'

/**
 * A point on the picture, in canvas widths from the top left: (0, 0) is the top-left corner,
 * (1, 1) the bottom-right, and y points down as it does on a canvas.
 */
export type Point = readonly [number, number]

/**
 * A pinhole camera, the eye of a perspective drawing. The eye sits at the origin of a world
 * where y points up, so the ground and the horizon are horizontal.
 */
export interface Camera {
    /** Turn about the vertical, in radians. At 0 the eye looks straight along +z. */
    yaw: number
    /** Tilt in radians: positive looks up, negative looks down. At 0 verticals stay vertical. */
    pitch: number
    /** Distance from the eye to the picture, in canvas widths. Smaller is a wider angle. */
    focal: number
    /** The center of vision, where the line of sight meets the picture. */
    center: Point
}

/** Any camera with a turn and a tilt: the straight-lens `Camera` or a curvilinear one. */
export type Aim = Pick<Camera, 'yaw' | 'pitch'>

/** The camera's right, up and forward directions in the world. */
export function cameraAxes<C extends Aim>({
    yaw,
    pitch,
}: C): {
    right: Vec3
    up: Vec3
    forward: Vec3
} {
    const [sy, cy, sp, cp] = [Math.sin(yaw), Math.cos(yaw), Math.sin(pitch), Math.cos(pitch)]
    return {
        right: [cy, 0, -sy],
        up: [-sy * sp, cp, -cy * sp],
        forward: [sy * cp, sp, cy * cp],
    }
}

/** A world point or direction in the camera's own terms: right, up, and depth in front of the eye. */
export function toCamera(camera: Aim, p: Vec3): Vec3 {
    const { right, up, forward } = cameraAxes(camera)
    return [dot(p, right), dot(p, up), dot(p, forward)]
}

/** Where a point in camera terms lands on the picture. */
function onPicture({ focal, center }: Camera, [x, y, z]: Vec3): Point {
    return [center[0] + (focal * x) / z, center[1] - (focal * y) / z]
}

/** Where a world point lands on the picture, or null if it's level with or behind the eye. */
export function projectPoint(camera: Camera, p: Vec3): Point | null {
    const c = toCamera(camera, p)
    return c[2] > 1e-9 ? onPicture(camera, c) : null
}

/**
 * Where every line with direction `d` meets, or null when such lines are parallel to the picture
 * and never meet (like verticals in 1 and 2 point perspective).
 */
export function vanishingPoint(camera: Camera, d: Vec3): Point | null {
    const c = toCamera(camera, d)
    return Math.abs(c[2]) > 1e-9 ? onPicture(camera, c) : null
}

/** The height of the horizon (eye level) on the picture. */
export function horizonY({ pitch, focal, center }: Camera): number {
    return center[1] + focal * Math.tan(pitch)
}

/** A camera looking level along +z, so z lines meet at `vp` and x and y lines stay parallel. */
export function onePointCamera(vp: Point, focal: number): Camera {
    return { yaw: 0, pitch: 0, focal, center: vp }
}

/**
 * A level camera whose z lines meet at `left` and x lines at `right`, both on the horizon at
 * height `horizon`, seen with the center of vision at `centerX` between them. The eye's distance
 * follows from the rule that the two directions are at right angles: focal² = a·b, where a and b
 * are the distances from the center of vision to each point.
 */
export function twoPointCamera(
    left: number,
    right: number,
    horizon: number,
    centerX: number,
): Camera {
    const a = centerX - left
    const b = right - centerX
    const focal = Math.sqrt(a * b)
    return { yaw: Math.atan2(a, focal), pitch: 0, focal, center: [centerX, horizon] }
}

/**
 * A tilted camera with z lines meeting at `left` and x lines at `right` on the horizon, and
 * verticals meeting at `third`, above the horizon when looking up and below it when looking down.
 * The center of vision is the orthocenter of the three points (where the triangle's altitudes
 * cross), so `third` must be far enough from the horizon that the triangle has no obtuse angle:
 * (horizon − third y)² > a·b.
 */
export function threePointCamera(
    left: number,
    right: number,
    horizon: number,
    third: Point,
): Camera {
    const a = third[0] - left
    const b = right - third[0]
    const h = horizon - third[1] // positive when the third point is above the horizon
    const k = (a * b) / h // from the horizon up to the center of vision
    const focal = Math.sqrt(a * b - k * k)
    return {
        yaw: Math.atan2(a, Math.sqrt(a * b)),
        pitch: Math.atan2(k, focal),
        focal,
        center: [third[0], horizon - k],
    }
}

/** An angle wrapped into −π to π. */
function wrap(angle: number): number {
    return angle - 2 * Math.PI * Math.round(angle / (2 * Math.PI))
}

/**
 * Directions (canvas angles, y down) for `count` guide lines from `vp` across the picture,
 * evenly spaced in angle, with one of them along `align` (e.g. the horizon). From a point on the
 * picture they go all the way round, so `count` lines pass through it; from a point off it they
 * fan across the angle the picture covers, so a far point still gives about `count` lines.
 */
export function fanAngles(vp: Point, count: number, align: number): number[] {
    if (count < 1) return []
    const [x, y] = vp
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        const step = Math.PI / count
        return Array.from({ length: 2 * count }, (_, k) => align + k * step)
    }
    // Measured from the direction toward the picture's middle, the corners give the spread.
    const toMiddle = Math.atan2(0.5 - y, 0.5 - x)
    const corners = [0, 1].flatMap((cx) =>
        [0, 1].map((cy) => wrap(Math.atan2(cy - y, cx - x) - toMiddle)),
    )
    const lo = Math.min(...corners)
    const hi = Math.max(...corners)
    const step = (hi - lo) / count
    const start = wrap(align - toMiddle)
    const angles: number[] = []
    for (let k = Math.ceil((lo - start) / step); start + k * step < hi; k++) {
        if (start + k * step > lo) angles.push(toMiddle + start + k * step)
    }
    return angles
}

/** Where the segment from `from` (on the picture) toward `to` leaves the picture shrunk by `inset`. */
export function edgePoint(from: Point, to: Point, inset: number): Point {
    let t = 1
    for (const i of [0, 1]) {
        const d = to[i] - from[i]
        if (d > 0) t = Math.min(t, (1 - inset - from[i]) / d)
        if (d < 0) t = Math.min(t, (inset - from[i]) / d)
    }
    t = Math.max(0, t)
    return [from[0] + t * (to[0] - from[0]), from[1] + t * (to[1] - from[1])]
}
