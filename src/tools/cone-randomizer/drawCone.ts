import { baseNormal, frontArc, makeCone, type Cone } from '../../math/cone'
import { facesViewer, project } from '../../math/cube'
import { capDiameters, rimPoint, UNIFORM_PROPORTION } from '../../math/cylinder'
import type { Quat, Vec3 } from '../../math/quat'
import { rimCircle, strokeEllipseAxes } from '../shared/ellipseAxes'
import type { ConeOptions, Shading } from './displayOptions'

const HIDDEN_ALPHA = 0.2
const LINE_COLOR = '#222'
const AXIS_COLOR = '#d62828'
const PAPER_COLOR = '#fff'

/** Distance from the cone's centre to the eye, the same as the Box and Cylinder Randomizers'. */
const CAMERA_DISTANCE = 5

/** The base rim's distance from the centre as a fraction of the canvas, the same as the cube's. */
const SCALE = 0.36

/** How far the axis line runs past the base and the apex, as a fraction of the radius. */
const AXIS_OVERHANG = 0.6

/** The farthest the axis line reaches from the centre, so it stays on the canvas in perspective. */
const AXIS_MAX_REACH = 1.05

/** Straight pieces per full rim. Plenty for a smooth curve at any canvas size we use. */
const RIM_STEPS = 120

/** One fill for the side and one for the base, the Cylinder Randomizer's side and cap colors. */
const FILLS: Record<Exclude<Shading, 'none'>, { side: string; base: string }> = {
    color: { side: '#bde0fe', base: '#ffd6a5' },
    grayscale: { side: '#c8c8c8', base: '#ececec' },
}

/** The point `k` units from `p` in direction `d`. */
const along = (p: Vec3, d: Vec3, k: number): Vec3 => [
    p[0] + d[0] * k,
    p[1] + d[1] * k,
    p[2] + d[2] * k,
]

/**
 * Draws the cone rotated by `q`, with height / diameter = `proportion` (or 2 with uniform size
 * on), on a square canvas `size` units wide. The side and, when it faces the viewer, the base
 * are filled; the back of the base rim is drawn faintly, and so are the base ellipse's axes.
 */
export function drawCone(
    ctx: CanvasRenderingContext2D,
    size: number,
    q: Quat,
    proportion: number,
    options: ConeOptions,
) {
    const camera = options.perspective ? CAMERA_DISTANCE : null
    const c = size / 2
    const r = size * SCALE
    // Projected coordinates to canvas ones. Canvas y points down.
    const toCanvas = (x: number, y: number): [number, number] => [c + x * r, c - y * r]
    // With uniform size on, the seed's proportions give way to a fixed 2:1.
    const cone: Cone = makeCone(q, options.uniformSize ? UNIFORM_PROPORTION : proportion)

    const toScreen = (p: Vec3): [number, number] => {
        const [x, y] = project(p, camera)
        return toCanvas(x, y)
    }
    const line = (a: Vec3, b: Vec3) => {
        ctx.moveTo(...toScreen(a))
        ctx.lineTo(...toScreen(b))
    }
    /** Adds the base rim from angle `from` to `to` (either way round) to the path. */
    const arc = (from: number, to: number, start: 'move' | 'line') => {
        const steps = Math.max(1, Math.ceil((Math.abs(to - from) / (2 * Math.PI)) * RIM_STEPS))
        for (let i = 0; i <= steps; i++) {
            const [x, y] = toScreen(rimPoint(cone, cone.base, from + ((to - from) * i) / steps))
            if (i === 0 && start === 'move') ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }
    }

    // The side faces you between these two angles. The rest of the rim is the back.
    const [front0, front1] = frontArc(cone, camera)
    const back0 = front1
    const back1 = front0 + 2 * Math.PI
    // Seen from the base side with the apex behind it, no side shows. Seen from above the apex,
    // the side shows all round and there are no side lines: the rim is the whole outline.
    const sideShows = front1 > front0
    const sideAllRound = front1 - front0 >= 2 * Math.PI - 1e-9
    const baseSeen = facesViewer(baseNormal(cone), cone.base, camera)

    ctx.globalAlpha = 1
    ctx.setLineDash([])
    ctx.clearRect(0, 0, size, size)

    // Fills. The side is the apex joined to the front of the rim, and the base goes on top of
    // it when it faces you. Lines-only mode fills them paper white, which keeps the lines
    // visible on any page theme.
    const fills =
        options.shading === 'none'
            ? { side: PAPER_COLOR, base: PAPER_COLOR }
            : FILLS[options.shading]
    if (sideShows) {
        ctx.fillStyle = fills.side
        ctx.beginPath()
        if (!sideAllRound) ctx.moveTo(...toScreen(cone.apex))
        arc(front0, front1, sideAllRound ? 'move' : 'line')
        ctx.closePath()
        ctx.fill()
    }
    if (baseSeen) {
        ctx.fillStyle = fills.base
        ctx.beginPath()
        arc(0, 2 * Math.PI, 'move')
        ctx.closePath()
        ctx.fill()
    }

    ctx.lineWidth = options.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = LINE_COLOR

    // A cross on the base through its true centre, along the diameters that become the
    // ellipse's axes in a flat view.
    const { major, minor } = capDiameters(cone)
    const centerLines = () => {
        const o = cone.base
        line(along(o, major, -cone.radius), along(o, major, cone.radius))
        line(along(o, minor, -cone.radius), along(o, minor, cone.radius))
    }

    // Hidden lines first and faint: the back of the rim, when the base faces away.
    if (options.showHiddenEdges && !baseSeen) {
        ctx.globalAlpha = HIDDEN_ALPHA
        ctx.beginPath()
        if (!sideAllRound) arc(back0, back1, 'move')
        if (options.showCenterLines) centerLines()
        ctx.stroke()
        ctx.globalAlpha = 1
    }

    // The base ellipse's major and minor axes: faint when the base faces away, like its hidden
    // rim, and at full strength when you see it.
    const ellipseAxes = () =>
        strokeEllipseAxes(ctx, rimCircle(cone, cone.base), camera, toCanvas, options.lineWidth)
    if (options.showEllipseAxes && options.showHiddenEdges && !baseSeen) {
        ctx.globalAlpha = HIDDEN_ALPHA
        ellipseAxes()
        ctx.globalAlpha = 1
    }

    // Front lines: the two side lines, and the front of the rim or all of it.
    ctx.beginPath()
    if (sideShows && !sideAllRound) {
        for (const phi of [front0, front1]) line(rimPoint(cone, cone.base, phi), cone.apex)
    }
    if (baseSeen || sideAllRound) arc(0, 2 * Math.PI, 'move')
    else if (sideShows) arc(front0, front1, 'move')
    if (baseSeen && options.showCenterLines) centerLines()
    ctx.stroke()

    // The axis is a construction line, drawn dashed over the shape and past both ends.
    if (options.showAxis) {
        const reach = Math.min(cone.halfLength + AXIS_OVERHANG * cone.radius, AXIS_MAX_REACH)
        ctx.strokeStyle = AXIS_COLOR
        ctx.setLineDash([options.lineWidth * 4, options.lineWidth * 3])
        ctx.beginPath()
        line(along([0, 0, 0], cone.axis, -reach), along([0, 0, 0], cone.axis, reach))
        ctx.stroke()
        ctx.setLineDash([])
    }

    // The seen ellipse's axes go on top, so the dashed axis doesn't hide the minor axis.
    if (options.showEllipseAxes && baseSeen) ellipseAxes()
}
