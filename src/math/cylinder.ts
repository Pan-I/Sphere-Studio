// src/math/cylinder.ts
import { cross, dot, rotate, type Quat, type Vec3 } from './quat'

/** The shortest and longest cylinders, as length over diameter. */
export const MIN_PROPORTION = 0.5
export const MAX_PROPORTION = 3

/**
 * Turns a number in [0, 1) into a length-to-diameter ratio between MIN_PROPORTION and
 * MAX_PROPORTION. It is spread evenly on a log scale, so squat and long cylinders come up as
 * often as each other.
 */
export function proportionFromPick(pick: number): number {
    return MIN_PROPORTION * (MAX_PROPORTION / MIN_PROPORTION) ** pick
}

export interface Cylinder {
    /** Unit vector along the cylinder's axis, from cap 0 to cap 1. */
    axis: Vec3
    /** Two unit vectors across the axis, at right angles, for walking around a rim. */
    u: Vec3
    v: Vec3
    radius: number
    /** Half the distance between the two caps. */
    halfLength: number
    /** The centres of the two caps. Cap 0 is at −axis, cap 1 at +axis. */
    caps: readonly [Vec3, Vec3]
}

/**
 * A cylinder centred on the origin, rotated by `q`, with length / diameter = `proportion`. Its
 * rims sit on the unit sphere (radius² + halfLength² = 1), so every cylinder fits the same circle
 * as the Sphere Randomizer's sphere and the Box Randomizer's cube. Unrotated, the axis is +y.
 */
export function makeCylinder(q: Quat, proportion: number): Cylinder {
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
        caps: [scaled(-halfLength), scaled(halfLength)],
    }
}

/** The point at angle `phi` on the rim around `centre`. */
export function rimPoint(cyl: Cylinder, centre: Vec3, phi: number): Vec3 {
    const c = Math.cos(phi) * cyl.radius
    const s = Math.sin(phi) * cyl.radius
    return [
        centre[0] + c * cyl.u[0] + s * cyl.v[0],
        centre[1] + c * cyl.u[1] + s * cyl.v[1],
        centre[2] + c * cyl.u[2] + s * cyl.v[2],
    ]
}

/**
 * The range of rim angles where the curved side faces the viewer, as [from, to] with from < to.
 * Its two ends are the silhouette: the straight side lines of the drawing run along the
 * cylinder at those two angles, touching both ellipses.
 *
 * The side's outward normal at angle φ is n = cos φ·u + sin φ·v. In a flat view the viewer looks
 * along −z, so the side faces them where n·z > 0. In perspective the eye is at (0, 0, camera) and
 * the side at rim point p faces it where n·(eye − p) > 0, which works out to
 * n·eye > radius, because n·p is the radius whatever p is along the axis. Both have the form
 * ρ cos(φ − base) > k, so the range is base ± acos(k / ρ).
 */
export function frontArc(cyl: Cylinder, camera: number | null): readonly [number, number] {
    // The view direction (flat) or the eye (perspective), measured along u and v.
    const du = camera === null ? cyl.u[2] : cyl.u[2] * camera
    const dv = camera === null ? cyl.v[2] : cyl.v[2] * camera
    const rho = Math.hypot(du, dv)
    const k = camera === null ? 0 : cyl.radius
    const base = Math.atan2(dv, du)
    // Looking down the axis, no side shows: an empty range. In a flat view that only happens
    // exactly end-on; in perspective, whenever the eye is inside the tube the side would make if
    // it went on forever.
    if (rho <= k) return [base, base]
    const half = Math.acos(k / rho)
    return [base - half, base + half]
}

/**
 * The two diameters of a cap that become its ellipse's axes in a flat view: `major`, which
 * stays its full length because it lies across the line of sight, and `minor`, which is
 * foreshortened and always lines up with the cylinder's axis on screen. In perspective they are
 * still the cap's true centre lines, but the drawn ellipse's own axes drift away from them.
 */
export function capDiameters(cyl: Cylinder): { major: Vec3; minor: Vec3 } {
    let major = cross(cyl.axis, [0, 0, 1])
    const len = Math.hypot(...major)
    // Looking straight along the axis the cap is a circle, and any diameter will do.
    major = len < 1e-9 ? cyl.u : [major[0] / len, major[1] / len, major[2] / len]
    return { major, minor: cross(cyl.axis, major) }
}

/** The cap's outward normal: −axis for cap 0, +axis for cap 1. */
export function capNormal(cyl: Cylinder, cap: 0 | 1): Vec3 {
    const s = cap ? 1 : -1
    return [cyl.axis[0] * s, cyl.axis[1] * s, cyl.axis[2] * s]
}

/** How far the side faces the viewer at rim angle `phi`: positive means it does. For tests. */
export function sideFacing(cyl: Cylinder, phi: number, camera: number | null): number {
    const n = rimPoint({ ...cyl, radius: 1 }, [0, 0, 0], phi)
    if (camera === null) return n[2]
    return dot(n, [0, 0, camera]) - cyl.radius
}
