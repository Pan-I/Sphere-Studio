// src/math/sphere.ts
import type { Vec3 } from './quat'

/** Each great circle is defined by two orthonormal vectors spanning its plane. */
export const GREAT_CIRCLES: ReadonlyArray<readonly [Vec3, Vec3]> = [
    [[1, 0, 0], [0, 1, 0]], // XY plane
    [[0, 1, 0], [0, 0, 1]], // YZ plane, perpendicular to the first
]

export function circlePoints(u: Vec3, v: Vec3, segments: number): Vec3[] {
    return Array.from({ length: segments + 1 }, (_, i) => {
        const t = (i / segments) * 2 * Math.PI
        const c = Math.cos(t), s = Math.sin(t)
        return [c * u[0] + s * v[0], c * u[1] + s * v[1], c * u[2] + s * v[2]] as Vec3
    })
}