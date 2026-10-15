import { facesViewer, project } from '../../math/cube'
import {
    capDiameters,
    capNormal,
    frontArc,
    makeCylinder,
    rimPoint,
    UNIFORM_PROPORTION,
    type Cylinder,
} from '../../math/cylinder'
import type { Quat, Vec3 } from '../../math/quat'
import { rimCircle, strokeEllipseAxes } from '../shared/ellipseAxes'
import { paperFor } from '../shared/paper'
import type { CylinderOptions, Shading } from './displayOptions'

const HIDDEN_ALPHA = 0.2
const AXIS_COLOR = '#d62828'

/** Distance from the cylinder's centre to the eye, the same as the Box Randomizer's. */
const CAMERA_DISTANCE = 5

/** The rims' distance from the centre as a fraction of the canvas, the same as the cube's. */
const SCALE = 0.36

/** How far the axis line runs past each cap, as a fraction of the radius. */
const AXIS_OVERHANG = 0.6

/** The farthest the axis line reaches from the centre, so it stays on the canvas in perspective. */
const AXIS_MAX_REACH = 1.05

/** Straight pieces per full rim. Plenty for a smooth curve at any canvas size we use. */
const RIM_STEPS = 120

/** One fill for the curved side and one for the caps. */
const FILLS: Record<Exclude<Shading, 'none'>, { side: string; cap: string }> = {
    color: { side: '#bde0fe', cap: '#ffd6a5' },
    grayscale: { side: '#c8c8c8', cap: '#ececec' },
}

/** The point `k` units from `p` in direction `d`. */
const along = (p: Vec3, d: Vec3, k: number): Vec3 => [
    p[0] + d[0] * k,
    p[1] + d[1] * k,
    p[2] + d[2] * k,
]

/**
 * Draws the cylinder rotated by `q`, with length / diameter = `proportion` (or 2 with uniform
 * size on), on a square canvas `size` units wide. The curved side and the cap facing the viewer
 * are filled; the parts of the rims behind, and the axes of an ellipse facing away, are drawn
 * faintly.
 */
export function drawCylinder(
    ctx: CanvasRenderingContext2D,
    size: number,
    q: Quat,
    proportion: number,
    options: CylinderOptions,
) {
    const paper = paperFor(ctx)
    const camera = options.perspective ? CAMERA_DISTANCE : null
    const c = size / 2
    const r = size * SCALE
    // Projected coordinates to canvas ones. Canvas y points down.
    const toCanvas = (x: number, y: number): [number, number] => [c + x * r, c - y * r]
    // With uniform size on, the seed's proportions give way to a fixed 2:1.
    const cyl: Cylinder = makeCylinder(q, options.uniformSize ? UNIFORM_PROPORTION : proportion)

    const toScreen = (p: Vec3): [number, number] => {
        const [x, y] = project(p, camera)
        return toCanvas(x, y)
    }
    const line = (a: Vec3, b: Vec3) => {
        ctx.moveTo(...toScreen(a))
        ctx.lineTo(...toScreen(b))
    }
    /** Adds the rim of `cap` from angle `from` to `to` (either way round) to the path. */
    const arc = (cap: 0 | 1, from: number, to: number, start: 'move' | 'line') => {
        const steps = Math.max(1, Math.ceil((Math.abs(to - from) / (2 * Math.PI)) * RIM_STEPS))
        for (let i = 0; i <= steps; i++) {
            const [x, y] = toScreen(rimPoint(cyl, cyl.caps[cap], from + ((to - from) * i) / steps))
            if (i === 0 && start === 'move') ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }
    }

    // The side faces you between these two angles. The rest of each rim is the back half.
    const [front0, front1] = frontArc(cyl, camera)
    const back0 = front1
    const back1 = front0 + 2 * Math.PI
    // Looking down the axis, only the near cap shows and the far rim is all behind it.
    const sideShows = front1 > front0
    // At most one cap faces you. Seen side-on in perspective, neither does.
    const capSeen = ([0, 1] as const).map((cap) =>
        facesViewer(capNormal(cyl, cap), cyl.caps[cap], camera),
    )
    const seenCap = capSeen[0] ? 0 : capSeen[1] ? 1 : null

    ctx.globalAlpha = 1
    ctx.setLineDash([])
    ctx.clearRect(0, 0, size, size)

    // Fills. The side is the strip between the two rims' front halves, and the seen cap goes on
    // top of it. Lines-only mode fills them with the paper colour.
    const fills =
        options.shading === 'none'
            ? { side: paper.paper, cap: paper.paper }
            : {
                  side: paper.fill(FILLS[options.shading].side),
                  cap: paper.fill(FILLS[options.shading].cap),
              }
    if (sideShows) {
        ctx.fillStyle = fills.side
        ctx.beginPath()
        arc(0, front0, front1, 'move')
        arc(1, front1, front0, 'line')
        ctx.closePath()
        ctx.fill()
    }
    if (seenCap !== null) {
        ctx.fillStyle = fills.cap
        ctx.beginPath()
        arc(seenCap, 0, 2 * Math.PI, 'move')
        ctx.closePath()
        ctx.fill()
    }

    ctx.lineWidth = options.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = paper.ink

    // A cross on a cap through its true centre, along the diameters that become the ellipse's
    // axes in a flat view.
    const { major, minor } = capDiameters(cyl)
    const centerLines = (cap: 0 | 1) => {
        const o = cyl.caps[cap]
        line(along(o, major, -cyl.radius), along(o, major, cyl.radius))
        line(along(o, minor, -cyl.radius), along(o, minor, cyl.radius))
    }

    // Hidden lines first and faint: the back half of each rim whose cap faces away.
    if (options.showHiddenEdges) {
        ctx.globalAlpha = HIDDEN_ALPHA
        ctx.beginPath()
        for (const cap of [0, 1] as const) {
            if (cap === seenCap) continue
            arc(cap, back0, back1, 'move')
            if (options.showCenterLines) centerLines(cap)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
    }

    // The major and minor axes of each ellipse: faint for a cap that faces away, like its
    // hidden rim, and at full strength for the cap you see.
    const ellipseAxes = (cap: 0 | 1) =>
        strokeEllipseAxes(ctx, rimCircle(cyl, cyl.caps[cap]), camera, toCanvas, options.lineWidth)
    if (options.showEllipseAxes && options.showHiddenEdges) {
        ctx.globalAlpha = HIDDEN_ALPHA
        for (const cap of [0, 1] as const) if (cap !== seenCap) ellipseAxes(cap)
        ctx.globalAlpha = 1
    }

    // Front lines: the two side lines, the front half of each rim, and all of the seen cap's rim.
    ctx.beginPath()
    if (sideShows) {
        for (const phi of [front0, front1])
            line(rimPoint(cyl, cyl.caps[0], phi), rimPoint(cyl, cyl.caps[1], phi))
    }
    for (const cap of [0, 1] as const) {
        if (cap === seenCap) arc(cap, 0, 2 * Math.PI, 'move')
        else if (sideShows) arc(cap, front0, front1, 'move')
    }
    if (seenCap !== null && options.showCenterLines) centerLines(seenCap)
    ctx.stroke()

    // The axis is a construction line, drawn dashed over the shape and past both caps.
    if (options.showAxis) {
        const reach = Math.min(cyl.halfLength + AXIS_OVERHANG * cyl.radius, AXIS_MAX_REACH)
        ctx.strokeStyle = paper.line(AXIS_COLOR)
        ctx.setLineDash([options.lineWidth * 4, options.lineWidth * 3])
        ctx.beginPath()
        line(along([0, 0, 0], cyl.axis, -reach), along([0, 0, 0], cyl.axis, reach))
        ctx.stroke()
        ctx.setLineDash([])
    }

    // The seen ellipse's axes go on top, so the dashed axis doesn't hide the minor axis.
    if (options.showEllipseAxes && seenCap !== null) ellipseAxes(seenCap)
}
