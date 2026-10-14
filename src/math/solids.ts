// src/math/solids.ts
import { CORNERS, FACES, HALF_EDGE } from './cube'
import { conjugate, rotate, type Quat, type Vec3 } from './quat'

export type SolidKind = 'sphere' | 'box' | 'cylinder' | 'cone'

/**
 * A form placed in a scene. It is the same unit form the randomizers draw (a sphere of radius 1,
 * a cube with its corners on the unit sphere, a cylinder or cone with its rims on it), turned by
 * `q` the way the randomizers turn it, then scaled by `scale` and moved to `centre`.
 */
export interface Solid {
    kind: SolidKind
    centre: Vec3
    scale: number
    q: Quat
    /** Length (a cone's height) over diameter. Only cylinders and cones use it. */
    proportion: number
}

/**
 * The radius and half length of a unit cylinder or cone with this proportion, the same numbers
 * makeCylinder and makeCone use: the rims sit on the unit sphere.
 */
export function roundSize(proportion: number): { radius: number; halfLength: number } {
    const radius = 1 / Math.hypot(1, proportion)
    return { radius, halfLength: proportion * radius }
}

/** A point in the scene, in the solid's own unit frame: unscaled, unmoved and unturned. */
export function toLocal(s: Solid, p: Vec3): Vec3 {
    const k = 1 / s.scale
    return rotate(conjugate(s.q), [
        (p[0] - s.centre[0]) * k,
        (p[1] - s.centre[1]) * k,
        (p[2] - s.centre[2]) * k,
    ])
}

/** A point in the solid's own unit frame, placed in the scene. */
export function toWorld(s: Solid, p: Vec3): Vec3 {
    const r = rotate(s.q, p)
    return [
        s.centre[0] + r[0] * s.scale,
        s.centre[1] + r[1] * s.scale,
        s.centre[2] + r[2] * s.scale,
    ]
}

/**
 * Negative inside the unit form, positive outside and zero on its surface, roughly the distance
 * to the surface. `p` is in the form's own frame, where cylinders and cones run along y with the
 * cone's apex at +y.
 */
export function localInside(kind: SolidKind, proportion: number, p: Vec3): number {
    const [x, y, z] = p
    switch (kind) {
        case 'sphere':
            return Math.hypot(x, y, z) - 1
        case 'box':
            return Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) - HALF_EDGE
        case 'cylinder': {
            const { radius, halfLength } = roundSize(proportion)
            return Math.max(Math.hypot(x, z) - radius, Math.abs(y) - halfLength)
        }
        case 'cone': {
            const { radius, halfLength } = roundSize(proportion)
            // The radius shrinks from `radius` at the base (y = −halfLength) to 0 at the apex.
            const r = (radius * (halfLength - y)) / (2 * halfLength)
            return Math.max(Math.hypot(x, z) - r, -halfLength - y)
        }
    }
}

/** Like localInside, for a point in the scene, in scene units. */
export function inside(s: Solid, p: Vec3): number {
    return localInside(s.kind, s.proportion, toLocal(s, p)) * s.scale
}

/**
 * Where a ray enters and leaves a solid: the ray is o + t·d, and it is inside for t0 ≤ t ≤ t1.
 * `face` says which surface it enters through, for picking a fill: for a box the axis of the
 * face (0, 1 or 2, as in cube.ts), for a cylinder 0 for the side and 1 for a cap, for a cone 0
 * for the side and 1 for the base, and 0 for a sphere.
 */
export interface Span {
    t0: number
    t1: number
    face: number
}

/** The values of t where a + b·t ≥ 0, as [from, to]. */
function halfLine(a: number, b: number): [number, number] | null {
    if (Math.abs(b) < 1e-15) return a >= 0 ? [-Infinity, Infinity] : null
    const t = -a / b
    return b > 0 ? [t, Infinity] : [-Infinity, t]
}

/** The values of t where qa·t² + 2·qb·t + qc ≤ 0, as up to two intervals. */
function quadraticBelow(qa: number, qb: number, qc: number): [number, number][] {
    if (Math.abs(qa) < 1e-15) {
        const h = halfLine(-qc, -2 * qb)
        return h ? [h] : []
    }
    const disc = qb * qb - qa * qc
    if (disc < 0) return qa > 0 ? [] : [[-Infinity, Infinity]]
    const root = Math.sqrt(disc)
    const a = (-qb - root) / qa
    const b = (-qb + root) / qa
    // Opening upward, it is below zero between the roots; downward, outside them.
    return qa > 0
        ? [[a, b]]
        : [
              [-Infinity, Math.min(a, b)],
              [Math.max(a, b), Infinity],
          ]
}

/**
 * Where the ray o + t·d meets the unit form, in its own frame. Each of the four forms is the
 * overlap of a few simple pieces (slabs between two planes, the inside of a round tube or a
 * cone), so the ray's span is the overlap of its span in each piece, and the piece that starts
 * it last is the face it enters through.
 */
export function localSpan(kind: SolidKind, proportion: number, o: Vec3, d: Vec3): Span | null {
    const [ox, oy, oz] = o
    const [dx, dy, dz] = d
    if (kind === 'sphere') {
        const [span] = quadraticBelow(
            dx * dx + dy * dy + dz * dz,
            ox * dx + oy * dy + oz * dz,
            ox * ox + oy * oy + oz * oz - 1,
        )
        return span ? { t0: span[0], t1: span[1], face: 0 } : null
    }
    if (kind === 'box') {
        // Each axis's slab, −HALF_EDGE ≤ o + t·d ≤ HALF_EDGE, worked out without making arrays,
        // since this runs for every pixel.
        let t0 = -Infinity
        let t1 = Infinity
        let face = 0
        for (let axis = 0; axis < 3; axis++) {
            const oa = o[axis]
            const da = d[axis]
            if (Math.abs(da) < 1e-15) {
                if (Math.abs(oa) > HALF_EDGE) return null
                continue
            }
            const a = (-HALF_EDGE - oa) / da
            const b = (HALF_EDGE - oa) / da
            const from = Math.min(a, b)
            if (from > t0) {
                t0 = from
                face = axis
            }
            t1 = Math.min(t1, Math.max(a, b))
        }
        return t0 <= t1 ? { t0, t1, face } : null
    }
    if (kind === 'cylinder') {
        const { radius, halfLength } = roundSize(proportion)
        // The round tube, x² + z² ≤ radius², then the slab between the caps.
        const qa = dx * dx + dz * dz
        const qb = ox * dx + oz * dz
        const qc = ox * ox + oz * oz - radius * radius
        let t0 = -Infinity
        let t1 = Infinity
        if (qa < 1e-15) {
            if (qc > 0) return null
        } else {
            const disc = qb * qb - qa * qc
            if (disc < 0) return null
            const root = Math.sqrt(disc)
            t0 = (-qb - root) / qa
            t1 = (-qb + root) / qa
        }
        let face = 0
        if (Math.abs(dy) < 1e-15) {
            if (Math.abs(oy) > halfLength) return null
        } else {
            const a = (-halfLength - oy) / dy
            const b = (halfLength - oy) / dy
            if (Math.min(a, b) > t0) {
                t0 = Math.min(a, b)
                face = 1
            }
            t1 = Math.min(t1, Math.max(a, b))
        }
        return t0 <= t1 ? { t0, t1, face } : null
    }

    const { radius, halfLength } = roundSize(proportion)
    // The cone: x² + z² ≤ k²·(halfLength − y)², the radius shrinking by k per unit up the axis.
    // That equation also takes in a mirror-image cone above the apex, so the ray is kept below
    // the apex, and above the base.
    const base = halfLine(oy + halfLength, dy)
    const apexSide = halfLine(halfLength - oy, -dy)
    if (!base || !apexSide) return null
    const k = radius / (2 * halfLength)
    const s0 = halfLength - oy
    const tubes = quadraticBelow(
        dx * dx + dz * dz - k * k * dy * dy,
        ox * dx + oz * dz + k * k * s0 * dy,
        ox * ox + oz * oz - k * k * s0 * s0,
    )

    let best: Span | null = null
    for (const tube of tubes) {
        let t0 = Math.max(tube[0], apexSide[0])
        let t1 = Math.min(tube[1], apexSide[1], base[1])
        let face = 0
        if (base[0] > t0) {
            t0 = base[0]
            face = 1
        }
        // The solid is convex, so at most one piece is left, bar a touch at the apex.
        if (t0 <= t1 && (!best || t1 - t0 > best.t1 - best.t0)) best = { t0, t1, face }
    }
    return best
}

/**
 * Where rays meet a placed solid, as a function of the ray o + t·d. t means the same as for the
 * ray in the scene, since moving, turning and scaling the ray together leaves it unchanged. The
 * turn is worked out once, so calling it for every pixel stays quick.
 */
export function spanFinder(s: Solid): (o: Vec3, d: Vec3) => Span | null {
    const inverse = conjugate(s.q)
    // Where the scene's x, y and z axes point in the solid's frame, shrunk to its scale.
    const k = 1 / s.scale
    const [ax, ay, az] = (
        [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ] as const
    ).map((e) => rotate(inverse, [e[0] * k, e[1] * k, e[2] * k]))
    const [cx, cy, cz] = s.centre
    return (o, d) => {
        const [x, y, z] = [o[0] - cx, o[1] - cy, o[2] - cz]
        return localSpan(
            s.kind,
            s.proportion,
            [
                ax[0] * x + ay[0] * y + az[0] * z,
                ax[1] * x + ay[1] * y + az[1] * z,
                ax[2] * x + ay[2] * y + az[2] * z,
            ],
            [
                ax[0] * d[0] + ay[0] * d[1] + az[0] * d[2],
                ax[1] * d[0] + ay[1] * d[1] + az[1] * d[2],
                ax[2] * d[0] + ay[2] * d[1] + az[2] * d[2],
            ],
        )
    }
}

/** Where the ray o + t·d meets a placed solid. See spanFinder for many rays. */
export function span(s: Solid, o: Vec3, d: Vec3): Span | null {
    return spanFinder(s)(o, d)
}

/**
 * A piece of a form's surface, in its own frame: `point` maps [0, 1]² onto it, evenly enough by
 * area that a grid of points spreads fairly over it. `area` is the piece's true area.
 */
export interface Patch {
    point: (u: number, v: number) => Vec3
    /** Grid steps along u and v that follow the piece's curves smoothly. */
    steps: readonly [number, number]
    area: number
}

const TAU = 2 * Math.PI

/** A flat disc at height y, from the centre (v = 0) out to the rim (v = 1). */
function disc(radius: number, y: number, steps: number): Patch {
    return {
        point: (u, v) => {
            const r = radius * Math.sqrt(v)
            return [r * Math.cos(TAU * u), y, r * Math.sin(TAU * u)]
        },
        steps: [steps, Math.max(4, Math.round(steps / 8))],
        area: Math.PI * radius * radius,
    }
}

/**
 * The unit form's surface, as patches. `detail` is about how many grid steps go around a round
 * form; boxes get fewer, since their faces are flat. Rims and side lines match the ones
 * rimPoint in cylinder.ts gives: angle φ goes from the x axis toward the z axis.
 */
export function surfacePatches(kind: SolidKind, proportion: number, detail: number): Patch[] {
    const n = Math.max(8, Math.round(detail))
    switch (kind) {
        case 'sphere':
            return [
                {
                    // Even in height is even in area on a sphere, as Archimedes found.
                    point: (u, v) => {
                        const y = 2 * v - 1
                        const r = Math.sqrt(Math.max(0, 1 - y * y))
                        return [r * Math.cos(TAU * u), y, r * Math.sin(TAU * u)]
                    },
                    steps: [n, Math.round(n / 2)],
                    area: 4 * Math.PI,
                },
            ]
        case 'box': {
            const m = Math.max(4, Math.round(n / 3))
            return FACES.map((f): Patch => {
                const [a, b, , d] = f.corners.map((i) => CORNERS[i])
                return {
                    point: (u, v) => [
                        a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v,
                        a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v,
                        a[2] + (b[2] - a[2]) * u + (d[2] - a[2]) * v,
                    ],
                    steps: [m, m],
                    area: 4 * HALF_EDGE * HALF_EDGE,
                }
            })
        }
        case 'cylinder': {
            const { radius, halfLength } = roundSize(proportion)
            const along = Math.max(4, Math.round((n * halfLength) / (Math.PI * radius)))
            return [
                {
                    point: (u, v) => [
                        radius * Math.cos(TAU * u),
                        halfLength * (2 * v - 1),
                        radius * Math.sin(TAU * u),
                    ],
                    steps: [n, Math.min(n, along)],
                    area: TAU * radius * 2 * halfLength,
                },
                disc(radius, -halfLength, n),
                disc(radius, halfLength, n),
            ]
        }
        case 'cone': {
            const { radius, halfLength } = roundSize(proportion)
            const slant = Math.hypot(radius, 2 * halfLength)
            const along = Math.max(4, Math.round((n * slant) / (TAU * radius)))
            return [
                {
                    // Up the side from the base (v = 0) to the apex (v = 1). The circles shrink
                    // toward the apex, so the steps bunch up there to keep the area even.
                    point: (u, v) => {
                        const t = 1 - Math.sqrt(1 - v)
                        const r = radius * (1 - t)
                        return [
                            r * Math.cos(TAU * u),
                            -halfLength + 2 * halfLength * t,
                            r * Math.sin(TAU * u),
                        ]
                    },
                    steps: [n, Math.min(n, along)],
                    area: Math.PI * radius * slant,
                },
                disc(radius, -halfLength, n),
            ]
        }
    }
}
