import { CORNERS, EDGES, FACES, facesViewer, project } from '../../math/cube'
import { rotate, type Quat, type Vec3 } from '../../math/quat'
import { paperFor } from '../shared/paper'
import type { BoxOptions, Shading } from './displayOptions'

const HIDDEN_ALPHA = 0.2

/** Distance from the cube's centre to the eye, in units of the cube's corner distance. */
const CAMERA_DISTANCE = 5

/**
 * The cube's corner distance as a fraction of the canvas. Near corners grow by up to
 * CAMERA_DISTANCE / (CAMERA_DISTANCE − 1) in perspective, so this keeps them inside the canvas.
 */
const SCALE = 0.36

/** One fill per axis, so the faces you see (never two of one axis) always differ. */
const FACE_FILLS: Record<Exclude<Shading, 'none'>, readonly [string, string, string]> = {
    color: ['#bde0fe', '#ffd6a5', '#caffbf'], // x blue, y orange, z green
    grayscale: ['#e6e6e6', '#b4b4b4', '#828282'],
}

/** The midpoint of two points. */
const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]

/**
 * Draws the cube rotated by `q` on a square canvas `size` units wide. Faces pointing at the
 * viewer are filled, their edges drawn solid, and the edges behind drawn faintly.
 */
export function drawBox(ctx: CanvasRenderingContext2D, size: number, q: Quat, options: BoxOptions) {
    const paper = paperFor(ctx)
    const camera = options.perspective ? CAMERA_DISTANCE : null
    const c = size / 2
    const r = size * SCALE

    const corners = CORNERS.map((p) => rotate(q, p))
    const toScreen = (p: Vec3): [number, number] => {
        const [x, y] = project(p, camera)
        return [c + x * r, c - y * r] // canvas y points down
    }
    const line = (a: Vec3, b: Vec3) => {
        ctx.moveTo(...toScreen(a))
        ctx.lineTo(...toScreen(b))
    }

    const faces = FACES.map((f) => ({
        ...f,
        seen: facesViewer(rotate(q, f.normal), corners[f.corners[0]], camera),
    }))
    const seen = faces.filter((f) => f.seen)
    const hidden = faces.filter((f) => !f.seen)

    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, size, size)

    // Fills. The faces you see never overlap, so the order doesn't matter. Lines-only mode
    // fills them with the paper colour.
    for (const f of seen) {
        ctx.fillStyle =
            options.shading === 'none'
                ? paper.paper
                : paper.fill(FACE_FILLS[options.shading][f.axis])
        ctx.beginPath()
        f.corners.forEach((i, n) => {
            const [x, y] = toScreen(corners[i])
            if (n === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        })
        ctx.closePath()
        ctx.fill()
    }

    ctx.lineWidth = options.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = paper.ink

    // An edge is in front when either face beside it is seen, and behind when neither is.
    const inFront = ([a, b]: readonly [number, number]) =>
        seen.some((f) => f.corners.includes(a) && f.corners.includes(b))

    // Center lines join the midpoints of a face's opposite edges, crossing at its centre.
    const centerLines = (list: typeof faces) => {
        for (const {
            corners: [a, b, cc, d],
        } of list) {
            line(mid(corners[a], corners[b]), mid(corners[cc], corners[d]))
            line(mid(corners[b], corners[cc]), mid(corners[d], corners[a]))
        }
    }

    // Hidden lines first and faint, so the front edges stay crisp where they cross.
    if (options.showHiddenEdges) {
        ctx.globalAlpha = HIDDEN_ALPHA
        ctx.beginPath()
        for (const e of EDGES) if (!inFront(e)) line(corners[e[0]], corners[e[1]])
        if (options.showCenterLines) centerLines(hidden)
        ctx.stroke()
        ctx.globalAlpha = 1
    }

    ctx.beginPath()
    for (const e of EDGES) if (inFront(e)) line(corners[e[0]], corners[e[1]])
    if (options.showCenterLines) centerLines(seen)
    ctx.stroke()
}
