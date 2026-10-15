import { FACES, CORNERS, EDGES } from '../../math/cube'
import {
    fanCircles,
    horizonCurve,
    inView,
    projectDirection,
    projectSegment,
    type CurvedCamera,
} from '../../math/curvilinear'
import { toCamera, type Point } from '../../math/perspective'
import { dot, type Vec3 } from '../../math/quat'
import { paperFor, type Paper } from '../shared/paper'
import type { CurvilinearGridOptions } from './displayOptions'
import type { CurvedGridPose } from './pose'

const GRID_GRAY = '#8a8a8a'
const GRID_ALPHA = 0.55
const HIDDEN_ALPHA = 0.25

/** VP 1 blue, VP 2 orange, VP 3 (verticals) green, as in the Perspective Grid. */
const POINT_COLORS = ['#2f7fd1', '#e0761c', '#2e9d4f'] as const

/** Faces of the sample box by axis (x, y, z): the top and bottom lightest, like daylight. */
const BOX_FILLS = ['#e4e4e4', '#f4f4f4', '#d0d0d0'] as const

const AXES: readonly Vec3[] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
]

const scaled = (d: Vec3, k: number): Vec3 => [d[0] * k, d[1] * k, d[2] * k]

/**
 * One direction's lines: the world axis they run along, the end of it that faces you (`toward`),
 * and their number and color. Level directions are numbered left to right, as in the Perspective
 * Grid, and the verticals are 3. A panorama's verticals stay parallel, so it has no family 3.
 */
export interface Family {
    axis: number
    toward: Vec3
    number: number
    color: string
}

/** Where a family's lines meet: the end they run toward (`VP 1`) or the far end (`VP 1′`). */
export interface CurvedVanishing {
    family: Family
    at: Point
    label: string
    /** The far end, behind the near one: the lines run away from you to it. */
    far: boolean
}

export function families(camera: CurvedCamera): Family[] {
    const ahead: Vec3 = [Math.sin(camera.yaw), 0, Math.cos(camera.yaw)]
    // Each level axis, by the end that's in front, ordered by how far round to the right it is.
    const level = [0, 2]
        .map((axis) => {
            const d = AXES[axis]
            const toward = dot(d, ahead) >= -1e-9 ? d : scaled(d, -1)
            const [x, , z] = toCamera(camera, toward)
            return { axis, toward, round: Math.atan2(x, z) }
        })
        .sort((a, b) => a.round - b.round)
    const out: Family[] = level.map(({ axis, toward }, i) => ({
        axis,
        toward,
        number: i + 1,
        color: POINT_COLORS[i],
    }))
    if (camera.lens === 'fisheye') {
        const toward: Vec3 = camera.pitch >= 0 ? [0, 1, 0] : [0, -1, 0]
        out.push({ axis: 1, toward, number: 3, color: POINT_COLORS[2] })
    }
    return out
}

/** Every vanishing point in the picture: both ends of each family's lines, where they show. */
export function vanishingPoints(camera: CurvedCamera): CurvedVanishing[] {
    return families(camera).flatMap((family) =>
        [false, true].flatMap((far) => {
            const d = far ? scaled(family.toward, -1) : family.toward
            const at = inView(camera, d) ? projectDirection(camera, d) : null
            return at ? [{ family, at, far, label: `VP ${family.number}${far ? '′' : ''}` }] : []
        }),
    )
}

/** Clips to the picture: the fish-eye's circle, or the whole canvas for a panorama. */
function clipToPicture(ctx: CanvasRenderingContext2D, size: number, camera: CurvedCamera) {
    ctx.beginPath()
    if (camera.lens === 'fisheye') {
        ctx.arc(camera.center[0] * size, camera.center[1] * size, size / 2, 0, Math.PI * 2)
    } else {
        ctx.rect(0, 0, size, size)
    }
    ctx.clip()
}

function tracePolyline(ctx: CanvasRenderingContext2D, size: number, line: readonly Point[]) {
    line.forEach(([x, y], i) => (i === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, x * size, y * size))
}

/**
 * Draws the curvilinear grid for `pose` on a square canvas `size` units wide: each family's
 * guide lines curving between its two vanishing points, the horizon, the points themselves,
 * and optionally a sample box.
 */
export function drawCurvilinearGrid(
    ctx: CanvasRenderingContext2D,
    size: number,
    pose: CurvedGridPose,
    options: CurvilinearGridOptions,
) {
    const paper = paperFor(ctx)
    const { camera } = pose
    const unit = size / 480 // marks and text keep their proportions on the small home-page cards
    const colorOf = (f: Family) => paper.line(options.colors === 'color' ? f.color : GRID_GRAY)
    const fams = families(camera)
    const horizon = horizonCurve(camera)

    ctx.globalAlpha = 1
    ctx.fillStyle = paper.paper
    ctx.fillRect(0, 0, size, size)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.save()
    clipToPicture(ctx, size, camera)

    // Guide lines, thin and faint so a drawing on top stays readable. The first of each family
    // lies along the horizon (or, for the verticals, straight up through the middle).
    ctx.globalAlpha = GRID_ALPHA
    ctx.lineWidth = Math.max(1, options.lineWidth / 2) * unit
    const ahead: Vec3 = [Math.sin(camera.yaw), 0, Math.cos(camera.yaw)]
    for (const f of fams) {
        const first = f.axis === 1 ? ahead : AXES[2 - f.axis]
        ctx.strokeStyle = colorOf(f)
        ctx.beginPath()
        for (const circle of fanCircles(camera, f.toward, options.gridLines, first)) {
            for (const piece of circle) tracePolyline(ctx, size, piece)
        }
        ctx.stroke()
    }
    ctx.globalAlpha = 1

    if (options.showHorizon) {
        ctx.strokeStyle = paper.ink
        ctx.lineWidth = options.lineWidth * unit
        ctx.beginPath()
        for (const piece of horizon) tracePolyline(ctx, size, piece)
        ctx.stroke()
    }

    if (options.showBox) drawBox(ctx, size, pose, fams, options, paper)
    ctx.restore()

    // The fish-eye's edge, where the picture reaches 90° from the line of sight.
    if (camera.lens === 'fisheye') {
        ctx.strokeStyle = paper.ink
        ctx.lineWidth = Math.max(1, options.lineWidth / 2) * unit
        ctx.beginPath()
        ctx.arc(
            camera.center[0] * size,
            camera.center[1] * size,
            size / 2 - ctx.lineWidth / 2,
            0,
            Math.PI * 2,
        )
        ctx.stroke()
    }

    const points = vanishingPoints(camera)
    const font = Math.max(10, Math.round(size * 0.03))
    ctx.font = `600 ${font}px system-ui, sans-serif`
    ctx.textBaseline = 'middle'
    for (const v of points) drawPoint(ctx, size, v, colorOf(v.family), unit, paper)
    if (options.showLabels) {
        for (const v of points) drawPointLabel(ctx, size, camera, v, font, paper)
        if (options.showHorizon) drawHorizonLabel(ctx, size, camera, horizon, points, font, paper)
    }
}

/** A dot with a ring of paper, so it shows over the grid lines. A far point is hollow. */
function drawPoint(
    ctx: CanvasRenderingContext2D,
    size: number,
    v: CurvedVanishing,
    color: string,
    unit: number,
    paper: Paper,
) {
    const [x, y] = [v.at[0] * size, v.at[1] * size]
    ctx.strokeStyle = paper.paper
    ctx.lineWidth = 2 * unit
    ctx.beginPath()
    ctx.arc(x, y, 6 * unit, 0, Math.PI * 2)
    ctx.fillStyle = v.far ? paper.paper : color
    ctx.fill()
    ctx.stroke()
    if (v.far) {
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5 * unit
        ctx.beginPath()
        ctx.arc(x, y, 4.5 * unit, 0, Math.PI * 2)
        ctx.stroke()
    }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** The point's name beside it, nudged toward the middle so points on the rim keep theirs. */
function drawPointLabel(
    ctx: CanvasRenderingContext2D,
    size: number,
    camera: CurvedCamera,
    v: CurvedVanishing,
    font: number,
    paper: Paper,
) {
    const [x, y] = v.at
    const gap = font * 1.1
    // Off to the side toward the middle (right, for a point in the middle), and above the
    // horizon for its points, or toward the middle for the verticals' points at top and bottom.
    const side = Math.abs(x - camera.center[0]) < 0.05 ? 1 : Math.sign(camera.center[0] - x)
    const dy = v.family.axis !== 1 ? -gap : y < camera.center[1] ? gap : -gap
    const tx = clamp(x * size + side * gap * 0.6, font, size - font)
    const ty = clamp(y * size + dy, font, size - font)
    label(ctx, v.label, [tx, ty], side > 0 ? 'left' : 'right', paper)
}

/** "Horizon" under the horizon, near the picture's left edge but clear of the points' labels. */
function drawHorizonLabel(
    ctx: CanvasRenderingContext2D,
    size: number,
    camera: CurvedCamera,
    horizon: Point[][],
    points: CurvedVanishing[],
    font: number,
    paper: Paper,
) {
    // The horizon's point nearest the left edge that's well inside the picture and clear of
    // every vanishing point.
    const inside = ([x, y]: Point) =>
        camera.lens === 'fisheye'
            ? Math.hypot(x - camera.center[0], y - camera.center[1]) < 0.44
            : x > 0.02 && y > 0.04 && y < 0.96
    const clear = ([x, y]: Point) =>
        points.every((v) => Math.hypot(x - v.at[0], y - v.at[1]) > 0.16)
    const candidates = horizon.flat().filter((p) => inside(p) && clear(p))
    if (candidates.length === 0) return
    const [x, y] = candidates.reduce((a, b) => (b[0] < a[0] ? b : a))
    label(ctx, 'Horizon', [x * size + 4, y * size + font * 1.1], 'left', paper)
}

/** Text in ink with a halo of paper, so it reads over the grid lines. */
function label(
    ctx: CanvasRenderingContext2D,
    text: string,
    [x, y]: Point,
    align: CanvasTextAlign,
    paper: Paper,
) {
    ctx.textAlign = align
    ctx.lineWidth = 4
    ctx.strokeStyle = paper.paper
    ctx.fillStyle = paper.ink
    ctx.strokeText(text, x, y)
    ctx.fillText(text, x, y)
}

/**
 * The sample box, standing square to the grid: faces you see filled, the edges behind faint, and
 * each edge in the color of the direction it runs along. Its edges are straight in the world, so
 * on this picture they bow, toward the same points as the guide lines.
 */
function drawBox(
    ctx: CanvasRenderingContext2D,
    size: number,
    pose: CurvedGridPose,
    fams: Family[],
    options: CurvilinearGridOptions,
    paper: Paper,
) {
    const { camera } = pose
    const { center, half } = pose.box
    const world = CORNERS.map(
        (c): Vec3 => [0, 1, 2].map((i) => center[i] + Math.sign(c[i]) * half[i]) as never,
    )
    const edge = (a: number, b: number) => projectSegment(camera, world[a], world[b])

    // A face is seen when it points toward the eye, which sits at the world's origin. That's
    // true whatever the lens, since it's about the box and the eye, not the picture.
    const seen = FACES.filter((f) => {
        const p = world[f.corners[0]]
        return dot(f.normal, [-p[0], -p[1], -p[2]]) > 0
    })

    for (const f of seen) {
        ctx.fillStyle = paper.fill(BOX_FILLS[f.axis])
        ctx.beginPath()
        const outline = f.corners.flatMap((c, n) => edge(c, f.corners[(n + 1) % 4]))
        tracePolyline(ctx, size, outline)
        ctx.closePath()
        ctx.fill()
    }

    const axisOf = ([a, b]: readonly [number, number]) => Math.log2(a ^ b)
    const colorFor = (axis: number) => {
        const color = options.colors === 'color' && fams.find((f) => f.axis === axis)?.color
        return color ? paper.line(color) : paper.ink
    }
    const inFront = ([a, b]: readonly [number, number]) =>
        seen.some((f) => f.corners.includes(a) && f.corners.includes(b))

    ctx.lineWidth = options.lineWidth * (size / 480)
    for (const front of [false, true]) {
        ctx.globalAlpha = front ? 1 : HIDDEN_ALPHA
        for (const e of EDGES) {
            if (inFront(e) !== front) continue
            ctx.strokeStyle = colorFor(axisOf(e))
            ctx.beginPath()
            tracePolyline(ctx, size, edge(e[0], e[1]))
            ctx.stroke()
        }
    }
    ctx.globalAlpha = 1
}
