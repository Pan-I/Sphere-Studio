import { frontArc as coneFrontArc, makeCone } from '../../math/cone'
import { CORNERS, EDGES, project } from '../../math/cube'
import { frontArc as cylinderFrontArc, makeCylinder, rimPoint } from '../../math/cylinder'
import type { Segment } from '../../math/meet'
import { cross, rotate, type Vec3 } from '../../math/quat'
import { GREAT_CIRCLES, circlePoints } from '../../math/sphere'
import { roundSize, spanFinder, toWorld, type Solid, type SolidKind } from '../../math/solids'
import { strokeEllipseAxes } from '../shared/ellipseAxes'
import type { FormComboOptions, Shading } from './displayOptions'
import { CAMERA_DISTANCE, type Combo } from './pose'

const HIDDEN_ALPHA = 0.2
const LINE_COLOR = '#222'
const AXIS_COLOR = '#d62828'
const PAPER = '#ffffff'
/** Where forms meet, when highlighted: a purple none of the fills or other lines use. */
const MEET_COLOR = '#7b2cbf'

/** The scene's width or height, whichever is larger, as a share of the canvas. */
const FILL_SHARE = 0.84

/** Straight pieces per full rim or circle, and per straight edge for checking what hides it. */
const RIM_STEPS = 240
const EDGE_STEPS = 64

/** How far the axis line runs past each end, as a fraction of the radius, as on the other tools. */
const AXIS_OVERHANG = 0.6

/**
 * A ray from a point toward the eye has to run at least this far inside a form, in scene units,
 * before the form hides the point. It keeps a point on a surface from hiding itself.
 */
const HIDE_TOLERANCE = 1e-5

/**
 * One fill per form, and per face for the box (by axis, as on the Box Randomizer) and the flat
 * ends of the cylinder and cone. The grays are the ones the Box and Cylinder Randomizers use.
 */
const FILLS: Record<Exclude<Shading, 'none'>, Record<SolidKind, readonly string[]>> = {
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

type LineKind = 'outline' | 'meet'

/** A line to draw, as points in the scene joined in order. */
interface Line {
    kind: LineKind
    points: readonly Vec3[]
}

const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
]

/** `steps` + 1 points evenly along a straight line, so each one can be checked for hiding. */
const straight = (a: Vec3, b: Vec3, steps = EDGE_STEPS): Vec3[] =>
    Array.from({ length: steps + 1 }, (_, i) => lerp(a, b, i / steps))

const unit = (v: Vec3): Vec3 => {
    const len = Math.hypot(...v)
    return [v[0] / len, v[1] / len, v[2] / len]
}

/** The eye in a solid's own unturned frame, scaled to it, for the frontArc functions. */
function eyeFor(s: Solid, camera: number): Vec3 {
    return [-s.centre[0] / s.scale, -s.centre[1] / s.scale, (camera - s.centre[2]) / s.scale]
}

/** A turned unit form's point, scaled and moved into place. The q is already in `p`. */
const place = (s: Solid, p: Vec3): Vec3 => [
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
function formLines(s: Solid, camera: number | null, options: FormComboOptions): Line[] {
    const outline = (points: Vec3[]): Line => ({ kind: 'outline', points })
    const eye = camera === null ? undefined : eyeFor(s, camera)
    switch (s.kind) {
        case 'sphere': {
            const lines = [outline(sphereOutline(s, camera))]
            if (options.showSphereLines) {
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
 * Draws the forms in `combo` on a square canvas `size` units wide: filled, outlined, with the
 * lines where they meet, and with whatever is hidden behind or inside another form (or behind
 * its own front) drawn faintly.
 */
export function drawFormCombo(
    ctx: CanvasRenderingContext2D,
    size: number,
    combo: Combo,
    options: FormComboOptions,
) {
    const camera = options.perspective ? CAMERA_DISTANCE : null
    const { solids } = combo

    const lines: Line[] = solids.flatMap((s) => formLines(s, camera, options))
    lines.push(...combo.meets.map((seg: Segment): Line => ({ kind: 'meet', points: seg })))

    // Fit the drawing to the canvas: centre it, and scale its larger side to FILL_SHARE.
    let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
    for (const { points } of lines) {
        for (const p of points) {
            const [x, y] = project(p, camera)
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
        }
    }
    const zoom = (FILL_SHARE * size) / Math.max(maxX - minX, maxY - minY, 1e-9)
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2
    const c = size / 2
    // Projected coordinates to canvas ones. Canvas y points down.
    const toCanvas = (x: number, y: number): [number, number] => [
        c + (x - midX) * zoom,
        c - (y - midY) * zoom,
    ]
    const toScreen = (p: Vec3) => toCanvas(...project(p, camera))

    ctx.globalAlpha = 1
    ctx.setLineDash([])
    ctx.clearRect(0, 0, size, size)
    fillForms(ctx, size, solids, options.shading, camera, { midX, midY, zoom })

    // Whether a point is hidden: does the way from it to the eye pass through any form?
    const spans = solids.map(spanFinder)
    const hidden = (p: Vec3): boolean => {
        const d: Vec3 = camera === null ? [0, 0, 1] : [-p[0], -p[1], camera - p[2]]
        const len = Math.hypot(...d)
        const tMin = HIDE_TOLERANCE / len
        const tMax = camera === null ? Infinity : 1
        return spans.some((span) => {
            const hit = span(p, d)
            return hit !== null && hit.t1 > tMin && hit.t0 < tMax && hit.t1 - hit.t0 > tMin
        })
    }

    // Split every line into its seen and hidden parts. Each point is checked where it lies,
    // on the surface; where the two ends of a piece disagree, it changes halfway along.
    const paths = {
        outline: { seen: [] as Segment[], hidden: [] as Segment[] },
        meet: { seen: [] as Segment[], hidden: [] as Segment[] },
    }
    for (const { kind, points } of lines) {
        const isHidden = points.map(hidden)
        for (let i = 0; i + 1 < points.length; i++) {
            const [a, b] = [points[i], points[i + 1]]
            const into = (h: boolean) => (h ? paths[kind].hidden : paths[kind].seen)
            if (isHidden[i] === isHidden[i + 1]) into(isHidden[i]).push([a, b])
            else {
                const m = lerp(a, b, 0.5)
                into(isHidden[i]).push([a, m])
                into(isHidden[i + 1]).push([m, b])
            }
        }
    }
    // Each set is one path stroked once, so faint lines stay even where pieces overlap.
    const stroke = (segments: readonly Segment[], color: string, alpha: number) => {
        if (segments.length === 0) return
        ctx.globalAlpha = alpha
        ctx.strokeStyle = color
        ctx.beginPath()
        for (const [a, b] of segments) {
            ctx.moveTo(...toScreen(a))
            ctx.lineTo(...toScreen(b))
        }
        ctx.stroke()
        ctx.globalAlpha = 1
    }

    ctx.lineWidth = options.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const meetColor = options.highlightMeet ? MEET_COLOR : LINE_COLOR

    // The flat ends of the cylinders and cones, whose ellipses get their axes drawn. An end
    // counts as seen when its centre is: facing the eye, and not behind or inside another form.
    const ends = options.showEllipseAxes ? flatEnds(solids) : []
    const seenEnd = ends.map((e) => !hidden(e.centre))
    const ellipseAxes = (seen: boolean) => {
        ends.forEach((e, i) => {
            if (seenEnd[i] === seen) strokeEllipseAxes(ctx, e, camera, toCanvas, options.lineWidth)
        })
    }

    // Hidden lines first and faint, so the front ones stay crisp where they cross.
    if (options.showHiddenEdges) {
        stroke(paths.outline.hidden, LINE_COLOR, HIDDEN_ALPHA)
        stroke(paths.meet.hidden, meetColor, HIDDEN_ALPHA)
        ctx.globalAlpha = HIDDEN_ALPHA
        ellipseAxes(false)
        ctx.globalAlpha = 1
    }
    stroke(paths.outline.seen, LINE_COLOR, 1)
    stroke(paths.meet.seen, meetColor, 1)

    // The axes are construction lines, drawn dashed over everything and past both ends.
    if (options.showAxes) {
        ctx.strokeStyle = AXIS_COLOR
        ctx.setLineDash([options.lineWidth * 4, options.lineWidth * 3])
        ctx.beginPath()
        for (const s of solids) {
            if (s.kind !== 'cylinder' && s.kind !== 'cone') continue
            const { radius, halfLength } = roundSize(s.proportion)
            const reach = halfLength + AXIS_OVERHANG * radius
            ctx.moveTo(...toScreen(toWorld(s, [0, -reach, 0])))
            ctx.lineTo(...toScreen(toWorld(s, [0, reach, 0])))
        }
        ctx.stroke()
        ctx.setLineDash([])
    }

    // The seen ellipses' axes go on top, so the dashed axis doesn't hide the minor axis.
    ellipseAxes(true)
}

/**
 * The circles at the flat ends of the cylinders (both caps) and cones (the base), in the form
 * strokeEllipseAxes takes: a centre and two radii at right angles, in the scene.
 */
function flatEnds(solids: readonly Solid[]): { centre: Vec3; a: Vec3; b: Vec3 }[] {
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

/** '#rrggbb' as [r, g, b]. */
const rgb = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
]

/** How canvas units and projected coordinates line up: the drawing's centre and zoom. */
interface View {
    midX: number
    midY: number
    zoom: number
}

/**
 * Fills each pixel with the color of the nearest surface along its line of sight, the way the
 * Sphere Randomizer shades its sectors, working in physical pixels. Only the forms whose
 * outline could cover a pixel are checked, which keeps it quick on a large screen.
 */
function fillForms(
    ctx: CanvasRenderingContext2D,
    size: number,
    solids: readonly Solid[],
    shading: Shading,
    camera: number | null,
    view: View,
) {
    const { width, height } = ctx.canvas
    const dpr = width / size
    // Physical pixels per projected unit, and the projected point at the canvas's top left.
    const k = view.zoom * dpr
    const left = view.midX - size / 2 / view.zoom
    const top = view.midY + size / 2 / view.zoom

    const forms = solids.map((s) => {
        // A disc on screen that the form stays inside: its bounding sphere's outline, with
        // room for perspective, which can push it a little off its centre's projection.
        const cz = s.centre[2]
        const d = camera === null ? 1 : camera - cz
        const grow = camera === null ? 1 : camera / d
        const reach =
            camera === null
                ? s.scale
                : (camera * s.scale * (1 + Math.hypot(s.centre[0], s.centre[1]) / d)) /
                  (d - s.scale)
        const fills = shading === 'none' ? [PAPER] : FILLS[shading][s.kind]
        return {
            span: spanFinder(s),
            x: s.centre[0] * grow,
            y: s.centre[1] * grow,
            reach2: reach * reach,
            reach,
            colors: fills.map(rgb),
        }
    })

    // Only the pixels inside some form's disc need looking at.
    const box = (lo: number, hi: number, limit: number) => [
        Math.max(0, Math.floor(lo)),
        Math.min(limit, Math.ceil(hi)),
    ]
    const [x0, x1] = box(
        Math.min(...forms.map((f) => (f.x - f.reach - left) * k)),
        Math.max(...forms.map((f) => (f.x + f.reach - left) * k)),
        width,
    )
    const [y0, y1] = box(
        Math.min(...forms.map((f) => (top - f.y - f.reach) * k)),
        Math.max(...forms.map((f) => (top - f.y + f.reach) * k)),
        height,
    )

    const image = ctx.createImageData(width, height)
    const data = image.data
    for (let py = y0; py < y1; py++) {
        const y = top - (py + 0.5) / k
        for (let px = x0; px < x1; px++) {
            const x = left + (px + 0.5) / k
            // From the eye through the point that projects here, or straight in for a flat view.
            const o: Vec3 = camera === null ? [x, y, 10] : [0, 0, camera]
            const d: Vec3 = camera === null ? [0, 0, -1] : [x, y, -camera]
            let nearest = Infinity
            let color: readonly number[] | null = null
            for (const f of forms) {
                if ((x - f.x) ** 2 + (y - f.y) ** 2 > f.reach2) continue
                const hit = f.span(o, d)
                if (hit && hit.t0 < nearest) {
                    nearest = hit.t0
                    color = f.colors[hit.face] ?? f.colors[0]
                }
            }
            if (!color) continue
            const i = (py * width + px) * 4
            data[i] = color[0]
            data[i + 1] = color[1]
            data[i + 2] = color[2]
            data[i + 3] = 255
        }
    }
    ctx.putImageData(image, 0, 0) // ignores the canvas transform, hence physical pixels
}
