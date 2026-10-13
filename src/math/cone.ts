// src/math/cone.ts
import { dot, rotate, type Quat, type Vec3 } from './quat'

export interface Cone {
    /** Unit vector along the cone's axis, from the base to the apex. */
    axis: Vec3
    /** Two unit vectors across the axis, at right angles, for walking around the base rim. */
    u: Vec3
    v: Vec3
    /** The base's radius. */
    radius: number
    /** Half the cone's height. The base and apex sit this far either side of the centre. */
    halfLength: number
    /** The centre of the base, at −axis. */
    base: Vec3
    /** The tip, at +axis. */
    apex: Vec3
}

/**
 * A cone centred on the origin (halfway up its axis), rotated by `q`, with height / diameter =
 * `proportion`. Its base rim sits on the unit sphere (radius² + halfLength² = 1), exactly where
 * the Cylinder Randomizer puts a rim, so a cone is the same size as a cylinder of the same
 * proportions with one end shrunk to a point. Unrotated, the apex points up +y.
 */
export function makeCone(q: Quat, proportion: number): Cone {
    const radius = 1 / Math.hypot(1, proportion)
    const halfLength = proportion * radius
    const axis = rotate(q, [0, 1, 0])
    const scaled = (k: number): Vec3 => [axis[0] * k, axis[1] * k, axis[2] * k]
    return {
        axis,
        u: rotate(q, [1, 0, 0]),
        v: rotate(q, [0, 0, 1]),
        radius,
        halfLength,
        base: scaled(-halfLength),
        apex: scaled(halfLength),
    }
}

/**
 * The side's outward normal (not unit length) along the straight line from the rim at angle
 * `phi` to the apex. It is height·d + radius·axis, where d = cos φ·u + sin φ·v points out from
 * the axis to the rim: at right angles to d·radius − axis·height, the line up to the apex.
 */
export function sideNormal(cone: Cone, phi: number): Vec3 {
    const h = 2 * cone.halfLength
    const c = Math.cos(phi) * h
    const s = Math.sin(phi) * h
    const r = cone.radius
    return [
        c * cone.u[0] + s * cone.v[0] + r * cone.axis[0],
        c * cone.u[1] + s * cone.v[1] + r * cone.axis[1],
        c * cone.u[2] + s * cone.v[2] + r * cone.axis[2],
    ]
}

/**
 * The range of base-rim angles where the side faces the viewer, as [from, to] with from ≤ to.
 * Its two ends are the silhouette: the drawing's two straight lines run from the rim at those
 * angles to the apex, touching the base ellipse. The range is empty when the side faces away
 * all round (looking at the base, with the apex hidden behind it), and a full turn when it
 * faces you all round (looking down on the apex, with the base hidden underneath).
 *
 * In a flat view the viewer looks along −z, so the side faces them where n·z > 0. In
 * perspective the eye is at (0, 0, camera) and it faces them where n·(eye − p) > 0 for a point
 * p on that line; n·p is radius·halfLength wherever p is, since n is at right angles to the line
 * and to the base centre's offset from the rim. Both have the form ρ cos(φ − base) > k, so the
 * range is base ± acos(k / ρ), the same as the Cylinder Randomizer's side lines.
 */
export function frontArc(cone: Cone, camera: number | null): readonly [number, number] {
    const h = 2 * cone.halfLength
    const eye = camera ?? 1
    const du = h * cone.u[2] * eye
    const dv = h * cone.v[2] * eye
    const rho = Math.hypot(du, dv)
    const k =
        camera === null
            ? -cone.radius * cone.axis[2]
            : cone.radius * (cone.halfLength - camera * cone.axis[2])
    const base = Math.atan2(dv, du)
    if (rho <= k) return [base, base]
    if (rho <= -k) return [base - Math.PI, base + Math.PI]
    const half = Math.acos(k / rho)
    return [base - half, base + half]
}

/** How far the side faces the viewer at rim angle `phi`: positive means it does. For tests. */
export function sideFacing(cone: Cone, phi: number, camera: number | null): number {
    const n = sideNormal(cone, phi)
    if (camera === null) return n[2]
    return dot(n, [0, 0, camera]) - cone.radius * cone.halfLength
}

/** The base's outward normal, −axis. */
export function baseNormal(cone: Cone): Vec3 {
    return [-cone.axis[0], -cone.axis[1], -cone.axis[2]]
}
