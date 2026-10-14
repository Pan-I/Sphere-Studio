// src/math/light.ts
import { cross, dot, type Vec3 } from './quat'

/**
 * The scene for the Lit Sphere: a unit sphere at the origin resting on a floor at y = −1, lit by
 * a distant light (like the sun), seen without perspective by a viewer looking slightly down.
 * World coordinates have y up and +z toward the viewer before the downward tilt.
 */

/** How far the viewer looks down, so the floor and the cast shadow on it can be seen. */
export const CAMERA_TILT = (20 * Math.PI) / 180

/** Screen axes in world coordinates: right, up, and toward the viewer (depth). */
export const RIGHT: Vec3 = [1, 0, 0]
export const UP: Vec3 = [0, Math.cos(CAMERA_TILT), -Math.sin(CAMERA_TILT)]
export const VIEW: Vec3 = [0, Math.sin(CAMERA_TILT), Math.cos(CAMERA_TILT)]

export const FLOOR_Y = -1

/** Where the sphere touches the floor. */
export const CONTACT: Vec3 = [0, FLOOR_Y, 0]

export const normalize = (v: Vec3): Vec3 => {
    const len = Math.hypot(v[0], v[1], v[2])
    return [v[0] / len, v[1] / len, v[2] / len]
}

const add = (a: Vec3, b: Vec3, k = 1): Vec3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k]

/**
 * The direction toward the light. `azimuth` is measured around the vertical from the viewer's
 * side (0 is behind the viewer, positive is to the right, ±π is behind the sphere); `elevation`
 * is the angle above the floor. Both in radians.
 */
export function lightDirection(azimuth: number, elevation: number): Vec3 {
    const flat = Math.cos(elevation)
    return [Math.sin(azimuth) * flat, Math.sin(elevation), Math.cos(azimuth) * flat]
}

/** A world point as screen x, screen y (up) and depth (toward the viewer), in sphere radii. */
export const toView = (p: Vec3): Vec3 => [dot(p, RIGHT), dot(p, UP), dot(p, VIEW)]

/** The sphere's outward normal at screen point (x, y), or null when (x, y) is off the sphere. */
export function sphereNormalAt(x: number, y: number): Vec3 | null {
    const d2 = x * x + y * y
    if (d2 > 1) return null
    return add(add(scale(RIGHT, x), UP, y), VIEW, Math.sqrt(1 - d2))
}

/** The point on the floor seen at screen point (x, y). Every screen point sees the floor. */
export function floorPointAt(x: number, y: number): Vec3 {
    // Along the line of sight p = x·RIGHT + y·UP + t·VIEW, solve p.y = FLOOR_Y for t.
    const t = (FLOOR_Y - y * UP[1]) / VIEW[1]
    return add(add(scale(RIGHT, x), UP, y), VIEW, t)
}

/**
 * How far a floor point is from the edge of the sphere's shadow, and how far the light travels
 * from the sphere to it. `edge` is the distance from the sphere's centre to the line from `g`
 * toward the light: under 1 means the sphere blocks the light (the point is in shadow). `reach`
 * is the distance along that line to the sphere's centre, which grows away from the contact
 * point, where the shadow's edge gets softer. A point whose light line points away from the
 * sphere gets `edge` = Infinity.
 */
export function shadowEdgeAt(g: Vec3, light: Vec3): { edge: number; reach: number } {
    const reach = -dot(g, light)
    if (reach <= 0) return { edge: Infinity, reach }
    return { edge: Math.sqrt(Math.max(0, dot(g, g) - reach * reach)), reach }
}

/** Two unit vectors at right angles to each other and to `n`. */
export function basisAround(n: Vec3): [Vec3, Vec3] {
    const helper: Vec3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
    const u = normalize(cross(helper, n))
    return [u, cross(n, u)]
}

/**
 * The terminator: the circle on the sphere where light turns to shadow, at right angles to
 * the light. Returns `segments + 1` points (the first repeated at the end), in world coordinates.
 */
export function terminator(light: Vec3, segments: number): Vec3[] {
    const [u, v] = basisAround(light)
    return Array.from({ length: segments + 1 }, (_, i) => {
        const a = (i / segments) * 2 * Math.PI
        return add(scale(u, Math.cos(a)), v, Math.sin(a))
    })
}

/** Slides a point along the light direction down to the floor: where its shadow falls. */
export const shadowOnFloor = (p: Vec3, light: Vec3): Vec3 =>
    add(p, light, -(p[1] - FLOOR_Y) / light[1])

/**
 * The edge of the cast shadow on the floor: the terminator's shadow, since the terminator is
 * the outline of the sphere as seen from the light.
 */
export const shadowOutline = (light: Vec3, segments: number): Vec3[] =>
    terminator(light, segments).map((p) => shadowOnFloor(p, light))

/**
 * A point on the sphere a given angle from the light, in the half of the sphere facing the
 * viewer. `cosFromLight` is the cosine of that angle (1 is straight at the light, 0 is on the
 * terminator, negative is in shadow). `sideways` (radians) turns the point around the light
 * direction, away from the plane through the light and the viewer, so labels can be spread out.
 */
export function pointFromLight(light: Vec3, cosFromLight: number, sideways = 0): Vec3 {
    // Toward the viewer, at right angles to the light. Falls back to any right angle when the
    // light is straight behind or in front of the viewer.
    const along = add(VIEW, light, -dot(VIEW, light))
    const w = Math.hypot(...along) > 1e-6 ? normalize(along) : basisAround(light)[0]
    const side = cross(light, w)
    const sin = Math.sqrt(Math.max(0, 1 - cosFromLight * cosFromLight))
    const turned = add(scale(w, Math.cos(sideways)), side, Math.sin(sideways))
    return add(scale(light, cosFromLight), turned, sin)
}

/** The screen box (in sphere radii) holding the sphere and its whole cast shadow. */
export function sceneBounds(light: Vec3): {
    minX: number
    maxX: number
    minY: number
    maxY: number
} {
    const box = { minX: -1, maxX: 1, minY: -1, maxY: 1 }
    for (const p of shadowOutline(light, 64)) {
        const [x, y] = toView(p)
        box.minX = Math.min(box.minX, x)
        box.maxX = Math.max(box.maxX, x)
        box.minY = Math.min(box.minY, y)
        box.maxY = Math.max(box.maxY, y)
    }
    return box
}
