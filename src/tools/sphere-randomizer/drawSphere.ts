import { conjugate, rotate, type Quat, type Vec3 } from '../../math/quat'
import {
    GREAT_CIRCLES,
    circlePoints,
    sectorOf,
    splitByVisibility,
    unprojectOrthographic,
} from '../../math/sphere'
import type { DisplayOptions } from './displayOptions'
import { paletteFor, type RGB } from './palettes'

const FAR_SIDE_ALPHA = 0.2
const LINE_COLOR = '#222'
const PAPER_COLOR = '#fff'
const MARKER_COLOR = '#000'

/** Grows with line thickness so the marker always stands out from the lines it sits on. */
const markerRadius = (lineWidth: number) => Math.max(6, lineWidth * 1.5)

/** Fills the visible hemisphere pixel by pixel, working in physical pixels. */
function shadeSectors(
    ctx: CanvasRenderingContext2D,
    size: number,
    q: Quat,
    palette: readonly RGB[],
) {
    const { width, height } = ctx.canvas
    const dpr = width / size
    const center = width / 2
    const radius = size * 0.4 * dpr
    const inverse = conjugate(q)

    const image = ctx.createImageData(width, height)
    const data = image.data

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const p = unprojectOrthographic(
                (x + 0.5 - center) / radius,
                -(y + 0.5 - center) / radius, // canvas y points down
                inverse,
            )
            if (!p) continue
            const [r, g, b] = palette[sectorOf(p)]
            const i = (y * width + x) * 4
            data[i] = r
            data[i + 1] = g
            data[i + 2] = b
            data[i + 3] = 255
        }
    }
    ctx.putImageData(image, 0, 0) // ignores the canvas transform, hence physical pixels
}

export function drawSphere(
    ctx: CanvasRenderingContext2D,
    size: number,
    q: Quat,
    options: DisplayOptions,
    marker: Vec3 | null,
) {
    const c = size / 2
    const r = size * 0.4

    ctx.clearRect(0, 0, size, size)

    const palette = paletteFor(options.shading)
    if (palette) {
        shadeSectors(ctx, size, q, palette)
    } else {
        // Lines-only mode: a plain paper-white disc keeps the lines visible on any page theme.
        ctx.fillStyle = PAPER_COLOR
        ctx.beginPath()
        ctx.arc(c, c, r, 0, Math.PI * 2)
        ctx.fill()
    }

    ctx.lineWidth = options.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = LINE_COLOR

    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()

    for (const [u, v] of GREAT_CIRCLES) {
        const pts = circlePoints(u, v, 128).map((p) => rotate(q, p))
        // Each run is stroked as a single path, so semi-transparent far-side lines
        // stay smooth instead of showing dots where short segments overlap.
        for (const run of splitByVisibility(pts)) {
            if (!run.front && !options.showFarSide) continue
            ctx.globalAlpha = run.front ? 1 : FAR_SIDE_ALPHA
            ctx.beginPath()
            run.points.forEach(([x, y], i) => {
                const px = c + x * r
                const py = c - y * r
                if (i === 0) ctx.moveTo(px, py)
                else ctx.lineTo(px, py)
            })
            ctx.stroke()
        }
    }
    ctx.globalAlpha = 1

    if (options.showMarker && marker) {
        ctx.fillStyle = MARKER_COLOR
        ctx.beginPath()
        ctx.arc(c + marker[0] * r, c - marker[1] * r, markerRadius(options.lineWidth), 0, Math.PI * 2)
        ctx.fill()
    }
}