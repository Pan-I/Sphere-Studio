// src/math/sphere.ts
import { cross, dot, rotate, type Quat, type Vec3 } from './quat'

/** Each great circle is defined by two orthonormal vectors spanning its plane.
 *  Three mutually perpendicular circles divide the sphere into 8 octants. */
export const GREAT_CIRCLES: ReadonlyArray<readonly [Vec3, Vec3]> = [
    [[1, 0, 0], [0, 1, 0]], // XY plane
    [[0, 1, 0], [0, 0, 1]], // YZ plane
    [[0, 0, 1], [1, 0, 0]], // XZ plane
]

export function circlePoints(u: Vec3, v: Vec3, segments: number): Vec3[] {
    return Array.from({ length: segments + 1 }, (_, i) => {
        const t = (i / segments) * 2 * Math.PI
        const c = Math.cos(t), s = Math.sin(t)
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