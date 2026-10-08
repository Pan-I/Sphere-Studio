import { conjugate, rotate, type Quat } from '../../math/quat'
import { GREAT_CIRCLES, circlePoints, sectorOf, unprojectOrthographic } from '../../math/sphere'

type RGB = readonly [number, number, number]

// Neighboring sectors differ by exactly one bit, so their bit-parity always
// alternates. Warm colors on even parity and cool colors on odd parity
// guarantees that no two touching sectors look alike.
const SECTOR_COLORS: readonly RGB[] = [
    [255, 214, 165], // 0 (even) orange
    [189, 224, 254], // 1 (odd) blue
    [202, 255, 191], // 2 (odd) green
    [255, 241, 168], // 3 (even) yellow
    [214, 200, 255], // 4 (odd) lavender
    [255, 198, 220], // 5 (even) pink
    [255, 179, 167], // 6 (even) coral
    [160, 235, 230], // 7 (odd) teal
]

/** Fills the visible hemisphere pixel by pixel, working in physical pixels. */
function shadeSectors(ctx: CanvasRenderingContext2D, size: number, q: Quat) {
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
            const [r, g, b] = SECTOR_COLORS[sectorOf(p)]
            const i = (y * width + x) * 4
            data[i] = r
            data[i + 1] = g
            data[i + 2] = b
            data[i + 3] = 255
        }
    }
    ctx.putImageData(image, 0, 0) // ignores the canvas transform, hence physical pixels
}

export function drawSphere(ctx: CanvasRenderingContext2D, size: number, q: Quat) {
    const c = size / 2
    const r = size * 0.4

    ctx.clearRect(0, 0, size, size)
    shadeSectors(ctx, size, q)

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#222'

    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()

    for (const [u, v] of GREAT_CIRCLES) {
        const pts = circlePoints(u, v, 128).map((p) => rotate(q, p))
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i + 1]
            ctx.globalAlpha = (a[2] + b[2]) / 2 >= 0 ? 1 : 0.2
            ctx.beginPath()
            ctx.moveTo(c + a[0] * r, c - a[1] * r)
            ctx.lineTo(c + b[0] * r, c - b[1] * r)
            ctx.stroke()
        }
    }
    ctx.globalAlpha = 1
}