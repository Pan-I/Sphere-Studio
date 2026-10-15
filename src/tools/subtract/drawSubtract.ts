import { carvedFinder } from '../../math/carve'
import { project } from '../../math/cube'
import type { Segment } from '../../math/meet'
import type { Vec3 } from '../../math/quat'
import { inside, roundSize, toWorld, type Solid } from '../../math/solids'
import { strokeEllipseAxes } from '../shared/ellipseAxes'
import { mix, paperFor, parseColor, type Paper, type RGB } from '../shared/paper'
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
    type View,
} from '../shared/solidDrawing'
import type { Shading, SubtractOptions } from './displayOptions'
import { CAMERA_DISTANCE, type Cutout } from './pose'

/** How strong the dashed outline of what was cut away is. */
const CUT_AWAY_ALPHA = 0.45
/**
 * How far the inside of a hollow is darkened toward pencil, so it reads as a hollow set into
 * the form rather than another form stuck on.
 */
const HOLLOW_SHADE = 0.18
const PENCIL: RGB = [34, 34, 34]

/**
 * A point counts as inside a form when it is at least this far in, in scene units, so points
 * on a surface (rims, the ends of cut lines) aren't counted as cut away by rounding.
 */
const EDGE = 1e-4

/** Whose line a line is: the main form's (-1) or a cut's (its number), or where they meet. */
interface Line {
    owner: number | 'meet'
    points: readonly Vec3[]
}

/**
 * Draws a carved form on a square canvas `size` units wide, styled like the Form Combo: filled
 * by face, outlined, with the rim where each cut breaks through drawn in purple, the inside of
 * each hollow shaded a little darker, and the part that was cut away dashed.
 */
export function drawSubtract(
    ctx: CanvasRenderingContext2D,
    size: number,
    cutout: Cutout,
    options: SubtractOptions,
) {
    const paper = paperFor(ctx)
    const camera = options.perspective ? CAMERA_DISTANCE : null
    const { main, cuts } = cutout
    const solids = [main, ...cuts]

    const lines: Line[] = [
        ...formLines(main, camera, options.showSphereLines).map((l): Line => ({
            owner: -1,
            points: l.points,
        })),
        ...cuts.flatMap((c, i) =>
            formLines(c, camera, false).map((l): Line => ({ owner: i, points: l.points })),
        ),
        ...cutout.meets.map((seg: Segment): Line => ({ owner: 'meet', points: seg })),
    ]

    // Fit the drawing to the canvas, cut-away parts and all, so the picture stays the same size
    // whether they are shown.
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
    const toCanvas = (x: number, y: number): [number, number] => [
        c + (x - midX) * zoom,
        c - (y - midY) * zoom,
    ]
    const toScreen = (p: Vec3) => toCanvas(...project(p, camera))

    ctx.globalAlpha = 1
    ctx.setLineDash([])
    ctx.clearRect(0, 0, size, size)
    fillCarved(ctx, size, cutout, options.shading, camera, { midX, midY, zoom }, paper)

    // Whether a point is hidden: does the way from it to the eye pass through what's left?
    const pieces = carvedFinder(cutout)
    const hidden = (p: Vec3): boolean => {
        const d: Vec3 = camera === null ? [0, 0, 1] : [-p[0], -p[1], camera - p[2]]
        const len = Math.hypot(...d)
        const tMin = HIDE_TOLERANCE / len
        const tMax = camera === null ? Infinity : 1
        return pieces(p, d).some(
            (piece) => piece.t1 > tMin && piece.t0 < tMax && piece.t1 - piece.t0 > tMin,
        )
    }

    // Whether a point on a line is on what's left, or on what was cut away. The main form's
    // lines are cut away inside a cut; a cut's lines only show where they run inside the main
    // form (as the edges of its hollow), and not inside another cut.
    const inCut = (p: Vec3, except: number) =>
        cuts.some((cut, i) => i !== except && inside(cut, p) < -EDGE)
    const isLeft = (owner: Line['owner'], p: Vec3): boolean => {
        if (owner === 'meet') return true
        if (owner === -1) return !inCut(p, -1)
        return inside(main, p) < -EDGE && !inCut(p, owner)
    }

    type State = 'seen' | 'hidden' | 'gone'
    const paths = {
        outline: { seen: [] as Segment[], hidden: [] as Segment[] },
        meet: { seen: [] as Segment[], hidden: [] as Segment[] },
        gone: [] as Segment[],
    }
    for (const { owner, points } of lines) {
        const kind = owner === 'meet' ? 'meet' : 'outline'
        const states = points.map((p): State =>
            !isLeft(owner, p) ? 'gone' : hidden(p) ? 'hidden' : 'seen',
        )
        const into = (state: State) =>
            state === 'gone'
                ? paths.gone
                : state === 'hidden'
                  ? paths[kind].hidden
                  : paths[kind].seen
        for (let i = 0; i + 1 < points.length; i++) {
            const [a, b] = [points[i], points[i + 1]]
            if (states[i] === states[i + 1]) into(states[i]).push([a, b])
            else {
                const m = lerp(a, b, 0.5)
                into(states[i]).push([a, m])
                into(states[i + 1]).push([m, b])
            }
        }
    }
    const stroke = (segments: readonly Segment[], color: string, alpha: number) => {
        if (segments.length === 0) return
        ctx.globalAlpha = alpha
        ctx.strokeStyle = color
        ctx.beginPath()
        // Pieces that follow on from each other are joined into one run, so dashes flow
        // along a line instead of starting over on every short piece.
        let last: Vec3 | null = null
        for (const [a, b] of segments) {
            if (a !== last) ctx.moveTo(...toScreen(a))
            ctx.lineTo(...toScreen(b))
            last = b
        }
        ctx.stroke()
        ctx.globalAlpha = 1
    }

    ctx.lineWidth = options.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const meetColor = options.highlightMeet ? paper.line(MEET_COLOR) : paper.ink

    // The flat ends of the cylinders and cones that are still whole: the main form's, unless a
    // cut took part of one away, and the floor of a hollow cut by a cylinder or cone, when all
    // of it is inside the main form.
    const ends = options.showEllipseAxes
        ? solids.flatMap((s, i) =>
              flatEnds([s]).filter((e) =>
                  [0, 1, 2, 3, 4, 5, 6, 7].every((step) => {
                      const angle = (step / 8) * 2 * Math.PI
                      const [cos, sin] = [Math.cos(angle), Math.sin(angle)]
                      const rim: Vec3 = [0, 1, 2].map(
                          (k) => e.centre[k] + e.a[k] * cos * 0.98 + e.b[k] * sin * 0.98,
                      ) as unknown as Vec3
                      return (
                          isLeft(i === 0 ? -1 : i - 1, rim) &&
                          isLeft(i === 0 ? -1 : i - 1, e.centre)
                      )
                  }),
              ),
          )
        : []
    const seenEnd = ends.map((e) => !hidden(e.centre))
    const ellipseAxes = (seen: boolean) => {
        ends.forEach((e, i) => {
            if (seenEnd[i] === seen) strokeEllipseAxes(ctx, e, camera, toCanvas, options.lineWidth)
        })
    }

    // What was cut away, dashed and faint, under everything else.
    if (options.showCutAway && paths.gone.length) {
        ctx.setLineDash([options.lineWidth * 3, options.lineWidth * 3])
        stroke(paths.gone, paper.ink, CUT_AWAY_ALPHA)
        ctx.setLineDash([])
    }
    if (options.showHiddenEdges) {
        stroke(paths.outline.hidden, paper.ink, HIDDEN_ALPHA)
        stroke(paths.meet.hidden, meetColor, HIDDEN_ALPHA)
        ctx.globalAlpha = HIDDEN_ALPHA
        ellipseAxes(false)
        ctx.globalAlpha = 1
    }
    stroke(paths.outline.seen, paper.ink, 1)
    stroke(paths.meet.seen, meetColor, 1)

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

    ellipseAxes(true)
}

/**
 * Fills each pixel with the color of the nearest surface of what's left along its line of
 * sight: the main form's own fill where you see its outside, and the fill of the form that cut
 * it, a little darker, where you look into a hollow.
 */
function fillCarved(
    ctx: CanvasRenderingContext2D,
    size: number,
    cutout: Cutout,
    shading: Shading,
    camera: number | null,
    view: View,
    paper: Paper,
) {
    const { width, height } = ctx.canvas
    const dpr = width / size
    const k = view.zoom * dpr
    const left = view.midX - size / 2 / view.zoom
    const top = view.midY + size / 2 / view.zoom

    const colorsOf = (s: Solid, hollow: boolean): RGB[] =>
        (shading === 'none' ? [paper.paper] : FILLS[shading][s.kind]).map((c) => {
            const rgb = parseColor(c) ?? [255, 255, 255]
            if (shading === 'none') return rgb
            return paper.fillRGB(hollow ? mix(rgb, PENCIL, HOLLOW_SHADE) : rgb)
        })
    const mainColors = colorsOf(cutout.main, false)
    const hollowColors = cutout.cuts.map((c) => colorsOf(c, true))

    // What's left is inside the main form, so only the pixels its outline could cover matter.
    const s = cutout.main
    const cz = s.centre[2]
    const d = camera === null ? 1 : camera - cz
    const grow = camera === null ? 1 : camera / d
    const reach =
        camera === null
            ? s.scale
            : (camera * s.scale * (1 + Math.hypot(s.centre[0], s.centre[1]) / d)) / (d - s.scale)
    const fx = s.centre[0] * grow
    const fy = s.centre[1] * grow
    const clamp = (v: number, limit: number) => Math.max(0, Math.min(limit, v))
    const x0 = clamp(Math.floor((fx - reach - left) * k), width)
    const x1 = clamp(Math.ceil((fx + reach - left) * k), width)
    const y0 = clamp(Math.floor((top - fy - reach) * k), height)
    const y1 = clamp(Math.ceil((top - fy + reach) * k), height)

    const pieces = carvedFinder(cutout)
    const image = ctx.createImageData(width, height)
    const data = image.data
    for (let py = y0; py < y1; py++) {
        const y = top - (py + 0.5) / k
        for (let px = x0; px < x1; px++) {
            const x = left + (px + 0.5) / k
            const o: Vec3 = camera === null ? [x, y, 10] : [0, 0, camera]
            const dir: Vec3 = camera === null ? [0, 0, -1] : [x, y, -camera]
            const [first] = pieces(o, dir)
            if (!first) continue
            const colors = first.cut < 0 ? mainColors : hollowColors[first.cut]
            const color = colors[first.face] ?? colors[0]
            const i = (py * width + px) * 4
            data[i] = color[0]
            data[i + 1] = color[1]
            data[i + 2] = color[2]
            data[i + 3] = 255
        }
    }
    ctx.putImageData(image, 0, 0)
}
