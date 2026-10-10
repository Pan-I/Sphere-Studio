// src/math/quat.ts
import type { Rng } from './random'

export type Vec3 = readonly [number, number, number]
export type Quat = readonly [number, number, number, number] // x, y, z, w

export const cross = (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
]

export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** Inverse of a unit quaternion. */
export const conjugate = (q: Quat): Quat => [-q[0], -q[1], -q[2], q[3]]

/** Uniformly distributed random rotation (Shoemake's method). */
export function randomQuat(rand: Rng): Quat {
    const u1 = rand(),
        u2 = rand(),
        u3 = rand()
    const a = Math.sqrt(1 - u1)
    const b = Math.sqrt(u1)
    const t2 = 2 * Math.PI * u2
    const t3 = 2 * Math.PI * u3
    return [a * Math.sin(t2), a * Math.cos(t2), b * Math.sin(t3), b * Math.cos(t3)]
}

/** Rotate v by unit quaternion q: v + w*t + qv × t, where t = 2(qv × v). */
export function rotate(q: Quat, v: Vec3): Vec3 {
    const qv: Vec3 = [q[0], q[1], q[2]]
    const t = cross(qv, v).map((n) => 2 * n) as unknown as Vec3
    const c = cross(qv, t)
    return [v[0] + q[3] * t[0] + c[0], v[1] + q[3] * t[1] + c[1], v[2] + q[3] * t[2] + c[2]]
}
