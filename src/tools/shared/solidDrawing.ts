// src/tools/shared/solidDrawing.ts
// What the Form Combo and Subtract tools share for drawing placed solids: their fills, the
// lines that outline each form, and the ends whose ellipses get axes.
import { frontArc as coneFrontArc, makeCone } from '../../math/cone'
import { CORNERS, EDGES } from '../../math/cube'
import { frontArc as cylinderFrontArc, makeCylinder, rimPoint } from '../../math/cylinder'
import { cross, rotate, type Vec3 } from '../../math/quat'
import { GREAT_CIRCLES, circlePoints } from '../../math/sphere'
import { roundSize, toWorld, type Solid, type SolidKind } from '../../math/solids'
import type { ColorMode } from './options'

export const HIDDEN_ALPHA = 0.2
export const AXIS_COLOR = '#d62828'
/** Where forms meet, when highlighted: a purple none of the fills or other lines use. */
export const MEET_COLOR = '#7b2cbf'

/** The scene's width or height, whichever is larger, as a share of the canvas. */
export const FILL_SHARE = 0.84

/** Straight pieces per full rim or circle, and per straight edge for checking what hides it. */
export const RIM_STEPS = 240
export const EDGE_STEPS = 64

/** How far the axis line runs past each end, as a fraction of the radius, as on the other tools. */
export const AXIS_OVERHANG = 0.6

/**
 * A ray from a point toward the eye has to run at least this far inside a form, in scene units,
 * before the form hides the point. It keeps a point on a surface from hiding itself.
 */
export const HIDE_TOLERANCE = 1e-5

/**
 * One fill per form, and per face for the box (by axis, as on the Box Randomizer) and the flat
 * ends of the cylinder and cone. The grays are the ones the Box and Cylinder Randomizers use.
 */
export const FILLS: Record<Exclude<ColorMode, 'none'>, Record<SolidKind, readonly string[]>> = {
    color: {
        sphere: ['#ffd6a5'],
        box: ['#e1effe', '#bde0fe', '#94c5f2'],
        cylinder: ['#caffbf', '#e8ffe2'],
        cone: ['#fdffb6', '#feffdf'],
    },
    grayscale: {
        sphere: ['#d6d6d6'],
        box: ['#e6e6e6', '#b4b4b4', '#828282'],
        cylinder: ['#c8c8c8', '#ececec'],
        cone: ['#c8c8c8', '#ececec'],
    },
}

export type LineKind = 'outline' | 'meet'

/** A line to draw, as points in the scene joined in order. */
export interface Line {
    kind: LineKind
    points: readonly Vec3[]
}

export const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
]

/** `steps` + 1 points evenly along a straight line, so each one can be checked for hiding. */
export const straight = (a: Vec3, b: Vec3, steps = EDGE_STEPS): Vec3[] =>
    Array.from({ length: steps + 1 }, (_, i) => lerp(a, b, i / steps))

export const unit = (v: Vec3): Vec3 => {
    const len = Math.hypot(...v)
    return [v[0] / len, v[1] / len, v[2] / len]
}

/** The eye in a solid's own unturned frame, scaled to it, for the frontArc functions. */
export function eyeFor(s: Solid, camera: number): Vec3 {
    return [-s.centre[0] / s.scale, -s.centre[1] / s.scale, (camera - s.centre[2]) / s.scale]
}

/** A turned unit form's point, scaled and moved into place. The q is already in `p`. */
export const place = (s: Solid, p: Vec3): Vec3 => [
    s.centre[0] + p[0] * s.scale,
    s.centre[1] + p[1] * s.scale,
    s.centre[2] + p[2] * s.scale,
]

/**
 * The outline of the sphere: the circle where lines from the eye just graze it. In a flat view
 * that is its widest circle across the screen; in perspective it is a little smaller and nearer
 * the eye, since the eye sees less than half of a sphere.
 */
function sphereOutline(s: Solid, camera: number | null): Vec3[] {
    let centre: Vec3 = [0, 0, 0]
    let radius = 1
    let a: Vec3 = [1, 0, 0]
    let b: Vec3 = [0, 1, 0]
    if (camera !== null) {
        const e = eyeFor(s, camera) // the sphere is round, so its turn doesn't matter
        const d2 = e[0] * e[0] + e[1] * e[1] + e[2] * e[2]
        centre = [e[0] / d2, e[1] / d2, e[2] / d2]
        radius = Math.sqrt(1 - 1 / d2)
        const n = unit(e)
        a = unit(cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]))
        b = cross(n, a)
    }
    return circlePoints(a, b, RIM_STEPS).map((p) =>
        place(s, [centre[0] + p[0] * radius, centre[1] + p[1] * radius, centre[2] + p[2] * radius]),
    )
}

/** The lines that outline one form, with the sphere's sector lines when asked for. */
export function formLines(s: Solid, camera: number | null, sphereLines: boolean): Line[] {
    const outline = (points: Vec3[]): Line => ({ kind: 'outline', points })
    const eye = camera === null ? undefined : eyeFor(s, camera)
    switch (s.kind) {
        case 'sphere': {
            const lines = [outline(sphereOutline(s, camera))]
            if (sphereLines) {
                for (const [u, v] of GREAT_CIRCLES) {
                    const points = circlePoints(u, v, RIM_STEPS).map((p) => toWorld(s, p))
                    lines.push(outline(points))
                }
            }
            return lines
        }
        case 'box':
            return EDGES.map(([a, b]) =>
                outline(straight(toWorld(s, CORNERS[a]), toWorld(s, CORNERS[b]))),
            )
        case 'cylinder': {
            const cyl = makeCylinder(s.q, s.proportion)
            const rim = (cap: 0 | 1) =>
                Array.from({ length: RIM_STEPS + 1 }, (_, i) =>
                    place(s, rimPoint(cyl, cyl.caps[cap], (i / RIM_STEPS) * 2 * Math.PI)),
                )
            const lines = [outline(rim(0)), outline(rim(1))]
            const [from, to] = cylinderFrontArc(cyl, camera, eye)
            if (to > from) {
                for (const phi of [from, to]) {
                    const a = place(s, rimPoint(cyl, cyl.caps[0], phi))
                    const b = place(s, rimPoint(cyl, cyl.caps[1], phi))
                    lines.push(outline(straight(a, b)))
                }
            }
            return lines
        }
        case 'cone': {
            const cone = makeCone(s.q, s.proportion)
            const base = Array.from({ length: RIM_STEPS + 1 }, (_, i) =>
                place(s, rimPoint(cone, cone.base, (i / RIM_STEPS) * 2 * Math.PI)),
            )
            const lines = [outline(base)]
            const [from, to] = coneFrontArc(cone, camera, eye)
            // Side lines only when the side shows on one part of the way round.
            if (to > from && to - from < 2 * Math.PI - 1e-9) {
                const apex = place(s, cone.apex)
                for (const phi of [from, to]) {
                    lines.push(outline(straight(place(s, rimPoint(cone, cone.base, phi)), apex)))
                }
            }
            return lines
        }
    }
}

/**
 * The circles at the flat ends of the cylinders (both caps) and cones (the base), in the form
 * strokeEllipseAxes takes: a centre and two radii at right angles, in the scene.
 */
export function flatEnds(solids: readonly Solid[]): { centre: Vec3; a: Vec3; b: Vec3 }[] {
    return solids.flatMap((s) => {
        if (s.kind !== 'cylinder' && s.kind !== 'cone') return []
        const { radius, halfLength } = roundSize(s.proportion)
        const k = radius * s.scale
        const across = (d: Vec3): Vec3 => {
            const r = rotate(s.q, d)
            return [r[0] * k, r[1] * k, r[2] * k]
        }
        const heights = s.kind === 'cylinder' ? [-halfLength, halfLength] : [-halfLength]
        return heights.map((y) => ({
            centre: toWorld(s, [0, y, 0]),
            a: across([1, 0, 0]),
            b: across([0, 0, 1]),
        }))
    })
}

/** How canvas units and projected coordinates line up: the drawing's centre and zoom. */
export interface View {
    midX: number
    midY: number
    zoom: number
}
