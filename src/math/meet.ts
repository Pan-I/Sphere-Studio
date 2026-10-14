// src/math/meet.ts
import type { Vec3 } from './quat'
import { inside, surfacePatches, toWorld, type Patch, type Solid } from './solids'

/** A short straight piece of a curve, between two points in the scene. */
export type Segment = readonly [Vec3, Vec3]

/** Halvings when pinning down where a grid edge crosses the other surface. */
const REFINE_STEPS = 40

/**
 * The line where two solids' surfaces meet, as short segments in the scene: the curve you draw
 * where one form goes into another. Empty when they don't touch.
 *
 * It walks a grid over `a`'s surface and looks at `inside(b, ·)` at each grid point, which
 * changes sign where `a`'s surface goes in and out of `b`. In each grid cell whose corners
 * disagree, the crossing points on its edges are found by halving the edge until they sit on
 * `b`'s surface, and joined up (marching squares). Every point found lies on both surfaces, so
 * the segments follow the true curve as closely as the grid allows.
 */
export function meetLine(a: Solid, b: Solid, detail: number): Segment[] {
    const out: Segment[] = []
    for (const patch of surfacePatches(a.kind, a.proportion, detail)) {
        out.push(...meetOnPatch(a, b, patch))
    }
    return out
}

function meetOnPatch(a: Solid, b: Solid, patch: Patch): Segment[] {
    const [nu, nv] = patch.steps
    const at = (u: number, v: number) => toWorld(a, patch.point(u, v))
    const f = (u: number, v: number) => inside(b, at(u, v))
    // Values at every grid point. Zero counts as outside, so every crossing is strict.
    const values: number[][] = []
    for (let i = 0; i <= nu; i++) {
        const row: number[] = []
        for (let j = 0; j <= nv; j++) row.push(f(i / nu, j / nv))
        values.push(row)
    }

    /** The point where the surface of `b` crosses the grid edge from (i0, j0) to (i1, j1). */
    const crossing = (i0: number, j0: number, i1: number, j1: number): Vec3 => {
        let lo = 0
        let hi = 1
        const insideAtLo = values[i0][j0] < 0
        const param = (s: number): [number, number] => [
            (i0 + (i1 - i0) * s) / nu,
            (j0 + (j1 - j0) * s) / nv,
        ]
        for (let k = 0; k < REFINE_STEPS; k++) {
            const m = (lo + hi) / 2
            if (f(...param(m)) < 0 === insideAtLo) lo = m
            else hi = m
        }
        return at(...param((lo + hi) / 2))
    }

    const segments: Segment[] = []
    for (let i = 0; i < nu; i++) {
        for (let j = 0; j < nv; j++) {
            // The cell's corners, going round it.
            const corners: [number, number][] = [
                [i, j],
                [i + 1, j],
                [i + 1, j + 1],
                [i, j + 1],
            ]
            const isIn = corners.map(([ci, cj]) => values[ci][cj] < 0)
            // One crossing on each edge whose ends disagree: none, two or four of them.
            const hits: { edge: number; p: Vec3 }[] = []
            for (let e = 0; e < 4; e++) {
                const [p, q] = [corners[e], corners[(e + 1) % 4]]
                if (isIn[e] !== isIn[(e + 1) % 4]) hits.push({ edge: e, p: crossing(...p, ...q) })
            }
            if (hits.length === 2) segments.push([hits[0].p, hits[1].p])
            else if (hits.length === 4) {
                // A saddle: opposite corners agree. The cell's middle says which pair of
                // corners is joined through it, and each segment cuts off one of the others.
                const middleIn = f((i + 0.5) / nu, (j + 0.5) / nv) < 0
                if (middleIn === isIn[0]) {
                    segments.push([hits[0].p, hits[1].p], [hits[2].p, hits[3].p])
                } else {
                    segments.push([hits[3].p, hits[0].p], [hits[1].p, hits[2].p])
                }
            }
        }
    }
    return segments
}

/**
 * How much of `a`'s surface is inside `b`, from 0 to 1, by sampling a grid over it. Placing a
 * scene uses it to make sure forms cross each other without one swallowing another.
 */
export function shareInside(a: Solid, b: Solid, detail: number): number {
    let total = 0
    let within = 0
    for (const patch of surfacePatches(a.kind, a.proportion, detail)) {
        const [nu, nv] = patch.steps
        const weight = patch.area / (nu * nv)
        for (let i = 0; i < nu; i++) {
            for (let j = 0; j < nv; j++) {
                total += weight
                const p = toWorld(a, patch.point((i + 0.5) / nu, (j + 0.5) / nv))
                if (inside(b, p) < 0) within += weight
            }
        }
    }
    return within / total
}
