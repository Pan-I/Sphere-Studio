// src/tools/sphere-randomizer/drawSphere.ts
import { rotate, type Quat } from '../../math/quat'
import { GREAT_CIRCLES, circlePoints } from '../../math/sphere'

export function drawSphere(ctx: CanvasRenderingContext2D, size: number, q: Quat) {
    const c = size / 2
    const r = size * 0.4

    ctx.clearRect(0, 0, size, size)
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
            ctx.globalAlpha = (a[2] + b[2]) / 2 >= 0 ? 1 : 0.2 // near vs far side
            ctx.beginPath()
            ctx.moveTo(c + a[0] * r, c - a[1] * r) // canvas y points down
            ctx.lineTo(c + b[0] * r, c - b[1] * r)
            ctx.stroke()
        }
    }
    ctx.globalAlpha = 1
}