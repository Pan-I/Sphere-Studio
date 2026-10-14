import { CORNERS, EDGES, FACES } from '../../math/cube'
import {
    edgePoint,
    fanAngles,
    horizonY,
    projectPoint,
    vanishingPoint,
    type Point,
} from '../../math/perspective'
import { dot, type Vec3 } from '../../math/quat'
import type { PerspectiveGridOptions } from './displayOptions'
import type { GridPose } from './pose'

const LINE_COLOR = '#222'
const PAPER_COLOR = '#fff'
const GRID_GRAY = '#8a8a8a'
const GRID_ALPHA = 0.55
const HIDDEN_ALPHA = 0.25

/** VP 1 (left) blue, VP 2 (right) orange, VP 3 (vertical) green, as in the Box Randomizer. */
const POINT_COLORS = ['#2f7fd1', '#e0761c', '#2e9d4f'] as const

/** Faces of the sample box by axis (x, y, z): the top and bottom lightest, like daylight. */
const BOX_FILLS = ['#e4e4e4', '#f4f4f4', '#d0d0d0'] as const

/** How far in from the canvas edge an arrow for an off-canvas point sits, in canvas widths. */
const MARKER_INSET = 0.035

const AXES: readonly Vec3[] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
]

/** A vanishing point, with the world axis whose lines meet there. */
export interface Vanishing {
    axis: number
    at: Point
    label: string
    color: string
    /** On the horizon (x and z lines), rather than the third point for verticals. */
    onHorizon: boolean
}

/**
 * The grid's vanishing points: on the horizon, numbered left to right, then the verticals' point.
 * A 1 point grid's single point is just "VP".
 */
export function vanishingPoints(pose: GridPose): Vanishing[] {
    const found = AXES.flatMap((d, axis) => {
        const at = vanishingPoint(pose.camera, d)
        return at ? [{ axis, at, onHorizon: axis !== 1 }] : []
    })
    const level = found.filter((v) => v.onHorizon).sort((a, b) => a.at[0] - b.at[0])
    const vertical = found.filter((v) => !v.onHorizon)
    return [...level, ...vertical].map((v, i) => ({
        ...v,
        label: found.length === 1 ? 'VP' : `VP ${i + 1}`,
        color: POINT_COLORS[i],
    }))
}

const onCanvas = ([x, y]: Point) => x >= 0 && x <= 1 && y >= 0 && y <= 1

/**
 * Draws the perspective grid for `pose` on a square canvas `size` units wide: guide lines fanning
 * out from each vanishing point, the horizon, the points themselves (or arrows toward the ones
 * off the canvas), and optionally a sample box.
 */
export function drawPerspectiveGrid(
    ctx: CanvasRenderingContext2D,
    size: number,
    pose: GridPose,
    options: PerspectiveGridOptions,
) {
    const unit = size / 480 // marks and text keep their proportions on the small home-page cards
    const px = ([x, y]: Point): [number, number] => [x * size, y * size]
    const points = vanishingPoints(pose)
    const horizon = horizonY(pose.camera)
    const colorOf = (v: Vanishing) => (options.colors === 'color' ? v.color : GRID_GRAY)

    ctx.globalAlpha = 1
    ctx.fillStyle = PAPER_COLOR
    ctx.fillRect(0, 0, size, size)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Guide lines, thin and faint so a drawing on top stays readable. Each runs from its point
    // to well past the far side of the canvas.
    ctx.globalAlpha = GRID_ALPHA
    ctx.lineWidth = Math.max(1, options.lineWidth / 2) * unit
    for (const v of points) {
        const align = v.onHorizon
            ? v.at[0] < 0.5
                ? 0
                : Math.PI
            : v.at[1] < 0.5
              ? Math.PI / 2
              : -Math.PI / 2
        const reach = 2 + Math.hypot(v.at[0] - 0.5, v.at[1] - 0.5)
        ctx.strokeStyle = colorOf(v)
        ctx.beginPath()
        for (const angle of fanAngles(v.at, options.gridLines, align)) {
            ctx.moveTo(...px(v.at))
            ctx.lineTo(
                ...px([v.at[0] + reach * Math.cos(angle), v.at[1] + reach * Math.sin(angle)]),
            )
        }
        ctx.stroke()
    }
    ctx.globalAlpha = 1

    if (options.showHorizon) {
        ctx.strokeStyle = LINE_COLOR
        ctx.lineWidth = options.lineWidth * unit
        ctx.beginPath()
        ctx.moveTo(0, horizon * size)
        ctx.lineTo(size, horizon * size)
        ctx.stroke()
    }

    if (options.showBox) drawBox(ctx, size, pose, points, options)

    const font = Math.max(10, Math.round(size * 0.03))
    ctx.font = `600 ${font}px system-ui, sans-serif`
    ctx.textBaseline = 'middle'
    for (const v of points) {
        if (onCanvas(v.at)) drawPoint(ctx, px(v.at), colorOf(v), unit)
        else drawArrow(ctx, size, v, horizon, colorOf(v), unit)
    }
    if (options.showLabels) {
        for (const v of points) drawPointLabel(ctx, size, v, horizon, font)
        if (options.showHorizon && horizon > 0 && horizon < 1) {
            label(ctx, 'Horizon', [6 * unit, horizon * size + font * 1.1], 'left')
        }
    }
}

/** A dot with a paper-white ring, so it shows over the grid lines. */
function drawPoint(ctx: CanvasRenderingContext2D, [x, y]: Point, color: string, unit: number) {
    ctx.fillStyle = color
    ctx.strokeStyle = PAPER_COLOR
    ctx.lineWidth = 2 * unit
    ctx.beginPath()
    ctx.arc(x, y, 6 * unit, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
}

/** Where the arrow for an off-canvas point goes: along the horizon, or straight up or down. */
function arrowAt(v: Vanishing, horizon: number): Point {
    const from: Point = v.onHorizon ? [0.5, horizon] : [Math.min(0.9, Math.max(0.1, v.at[0])), 0.5]
    return edgePoint(from, v.at, MARKER_INSET)
}

/** A triangle at the canvas edge, pointing toward a vanishing point that's off the canvas. */
function drawArrow(
    ctx: CanvasRenderingContext2D,
    size: number,
    v: Vanishing,
    horizon: number,
    color: string,
    unit: number,
) {
    const [x, y] = arrowAt(v, horizon)
    const angle = Math.atan2(v.at[1] - y, v.at[0] - x)
    const r = 9 * unit
    ctx.save()
    ctx.translate(x * size, y * size)
    ctx.rotate(angle)
    ctx.fillStyle = color
    ctx.strokeStyle = PAPER_COLOR
    ctx.lineWidth = 2 * unit
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(-r * 0.7, r * 0.75)
    ctx.lineTo(-r * 0.7, -r * 0.75)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
}

/**
 * The point's name beside it: above the horizon for points on it, beside the point for the third.
 * For a point off the canvas, beside its arrow, with "off canvas" so the arrow reads right.
 */
function drawPointLabel(
    ctx: CanvasRenderingContext2D,
    size: number,
    v: Vanishing,
    horizon: number,
    font: number,
) {
    const inside = onCanvas(v.at)
    const [x, y] = inside ? v.at : arrowAt(v, horizon)
    const text = inside ? v.label : `${v.label} (off canvas)`
    const gap = font * 1.1
    const align = x > 0.6 ? 'right' : 'left'
    const dx = align === 'right' ? -gap * 0.6 : gap * 0.6
    const dy = v.onHorizon ? -gap : inside ? 0 : y < 0.5 ? gap : -gap
    const ty = Math.min(size - font, Math.max(font, y * size + dy))
    label(ctx, text, [x * size + (v.onHorizon || !inside ? dx : dx * 1.4), ty], align)
}

/** Dark text with a paper-white halo, so it reads over the grid lines. */
function label(ctx: CanvasRenderingContext2D, text: string, [x, y]: Point, align: CanvasTextAlign) {
    ctx.textAlign = align
    ctx.lineWidth = 4
    ctx.strokeStyle = PAPER_COLOR
    ctx.fillStyle = LINE_COLOR
    ctx.strokeText(text, x, y)
    ctx.fillText(text, x, y)
}

/**
 * The sample box, standing square to the grid: faces you see filled, the edges behind faint, and
 * each edge in the color of the point it runs toward.
 */
function drawBox(
    ctx: CanvasRenderingContext2D,
    size: number,
    pose: GridPose,
    points: Vanishing[],
    options: PerspectiveGridOptions,
) {
    const { center, half } = pose.box
    const world = CORNERS.map(
        (c): Vec3 => [0, 1, 2].map((i) => center[i] + Math.sign(c[i]) * half[i]) as never,
    )
    const screen = world.map((p) => {
        const at = projectPoint(pose.camera, p) ?? [0.5, 0.5]
        return [at[0] * size, at[1] * size] as const
    })

    // A face is seen when it points toward the eye, which sits at the world's origin.
    const seen = FACES.filter((f) => {
        const p = world[f.corners[0]]
        return dot(f.normal, [-p[0], -p[1], -p[2]]) > 0
    })

    for (const f of seen) {
        ctx.fillStyle = BOX_FILLS[f.axis]
        ctx.beginPath()
        f.corners.forEach((i, n) => (n === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, ...screen[i]))
        ctx.closePath()
        ctx.fill()
    }

    const axisOf = ([a, b]: readonly [number, number]) => Math.log2(a ^ b)
    const colorFor = (axis: number) =>
        (options.colors === 'color' && points.find((v) => v.axis === axis)?.color) || LINE_COLOR
    const inFront = ([a, b]: readonly [number, number]) =>
        seen.some((f) => f.corners.includes(a) && f.corners.includes(b))

    ctx.lineWidth = options.lineWidth * (size / 480)
    for (const front of [false, true]) {
        ctx.globalAlpha = front ? 1 : HIDDEN_ALPHA
        for (const e of EDGES) {
            if (inFront(e) !== front) continue
            ctx.strokeStyle = colorFor(axisOf(e))
            ctx.beginPath()
            ctx.moveTo(...screen[e[0]])
            ctx.lineTo(...screen[e[1]])
            ctx.stroke()
        }
    }
    ctx.globalAlpha = 1
}
