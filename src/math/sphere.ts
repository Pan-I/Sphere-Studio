// src/math/sphere.ts
import { cross, dot, rotate, type Quat, type Vec3 } from './quat'

/** Each great circle is defined by two orthonormal vectors spanning its plane.
 *  Three mutually perpendicular circles divide the sphere into 8 octants. */
export const GREAT_CIRCLES: ReadonlyArray<readonly [Vec3, Vec3]> = [
    [
        [1, 0, 0],
        [0, 1, 0],
    ], // XY plane
    [
        [0, 1, 0],
        [0, 0, 1],
    ], // YZ plane
    [
        [0, 0, 1],
        [1, 0, 0],
    ], // XZ plane
]

export function circlePoints(u: Vec3, v: Vec3, segments: number): Vec3[] {
    return Array.from({ length: segments + 1 }, (_, i) => {
        const t = (i / segments) * 2 * Math.PI
        const c = Math.cos(t),
            s = Math.sin(t)
        return [c * u[0] + s * v[0], c * u[1] + s * v[1], c * u[2] + s * v[2]] as Vec3
    })
}

// Plane normals derived from the circles themselves, so shading can't drift
// out of sync with the lines.
const NORMALS = GREAT_CIRCLES.map(([u, v]) => cross(u, v))

/** Which of the sectors (0–7) a point on the unrotated sphere falls in. */
export function sectorOf(p: Vec3): number {
    return NORMALS.reduce((acc, n, i) => acc + (dot(n, p) >= 0 ? 1 << i : 0), 0)
}

/**
 * Inverse orthographic projection: given normalized screen coords (-1..1, y up),
 * return the matching front-facing point on the unrotated sphere, or null if
 * the pixel is outside the disc. `inverse` is the conjugate of the view rotation.
 */
export function unprojectOrthographic(nx: number, ny: number, inverse: Quat): Vec3 | null {
    const d2 = nx * nx + ny * ny
    if (d2 > 1) return null
    return rotate(inverse, [nx, ny, Math.sqrt(1 - d2)])
}

export interface Run {
    front: boolean
    points: Vec3[]
}

/**
 * Splits a projected polyline into consecutive runs that are either facing the
 * viewer (front) or facing away (back). A segment counts as front when its
 * average z is >= 0. Neighboring runs share their boundary point, so stroking
 * each run as one path leaves no gaps and no doubled-up joints.
 */
export function splitByVisibility(points: readonly Vec3[]): Run[] {
    const runs: Run[] = []
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]
        const b = points[i + 1]
        const front = (a[2] + b[2]) / 2 >= 0
        const last = runs[runs.length - 1]
        if (last && last.front === front) last.points.push(b)
        else runs.push({ front, points: [a, b] })
    }
    return runs
}

/**
 * Unit vectors where two great circles cross: ±(nᵢ × nⱼ) for every pair of plane
 * normals. Derived from GREAT_CIRCLES, so they can't drift out of sync with the lines.
 */
export const INTERSECTIONS: readonly Vec3[] = NORMALS.flatMap((a, i): Vec3[] =>
    NORMALS.slice(i + 1).flatMap((b): Vec3[] => {
        const c = cross(a, b)
        const len = Math.hypot(c[0], c[1], c[2])
        if (len < 1e-9) return [] // parallel planes never meet at a single axis
        const u: Vec3 = [c[0] / len, c[1] / len, c[2] / len]
        return [u, [-u[0], -u[1], -u[2]]]
    }),
)

/**
 * How far toward the viewer an intersection must point to count as "facing" them.
 * Points closer to the rim than this would put the marker half off the sphere.
 */
export const MIN_FRONT_Z = 0.2

/** Intersections facing the viewer, in screen-space (rotated) coordinates. */
export function frontIntersections(q: Quat, minZ: number = MIN_FRONT_Z): Vec3[] {
    return INTERSECTIONS.map((p) => rotate(q, p)).filter((p) => p[2] > minZ)
}

/** Chooses one front-facing intersection; `pick` is a number in [0, 1). Null if none face the viewer. */
export function pickMarker(q: Quat, pick: number): Vec3 | null {
    const candidates = frontIntersections(q)
    if (candidates.length === 0) return null
    return candidates[Math.min(candidates.length - 1, Math.floor(pick * candidates.length))]
}
