import { project } from '../../math/cube'
import type { Segment } from '../../math/meet'
import type { Vec3 } from '../../math/quat'
import { roundSize, spanFinder, toWorld, type Solid } from '../../math/solids'
import { strokeEllipseAxes } from '../shared/ellipseAxes'
import { paperFor, parseColor, type Paper } from '../shared/paper'
import {
    AXIS_COLOR,
    AXIS_OVERHANG,
    FILL_SHARE,
    FILLS,
    flatEnds,
    formLines,
    HIDDEN_ALPHA,
    HIDE_TOLERANCE,
    lerp,
    MEET_COLOR,
    type Line,
    type View,
} from '../shared/solidDrawing'
import type { FormComboOptions, Shading } from './displayOptions'
import { CAMERA_DISTANCE, type Combo } from './pose'

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
    const paper = paperFor(ctx)
    const camera = options.perspective ? CAMERA_DISTANCE : null
    const { solids } = combo

    const lines: Line[] = solids.flatMap((s) => formLines(s, camera, options.showSphereLines))
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
    fillForms(ctx, size, solids, options.shading, camera, { midX, midY, zoom }, paper)

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
    const meetColor = options.highlightMeet ? paper.line(MEET_COLOR) : paper.ink

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
        stroke(paths.outline.hidden, paper.ink, HIDDEN_ALPHA)
        stroke(paths.meet.hidden, meetColor, HIDDEN_ALPHA)
        ctx.globalAlpha = HIDDEN_ALPHA
        ellipseAxes(false)
        ctx.globalAlpha = 1
    }
    stroke(paths.outline.seen, paper.ink, 1)
    stroke(paths.meet.seen, meetColor, 1)

    // The axes are construction lines, drawn dashed over everything and past both ends.
    if (options.showAxes) {
        ctx.strokeStyle = paper.line(AXIS_COLOR)
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
    paper: Paper,
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
        const fills = shading === 'none' ? [paper.paper] : FILLS[shading][s.kind].map(paper.fill)
        return {
            span: spanFinder(s),
            x: s.centre[0] * grow,
            y: s.centre[1] * grow,
            reach2: reach * reach,
            reach,
            colors: fills.map((c) => parseColor(c) ?? [255, 255, 255]),
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
