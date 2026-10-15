import type { Circle } from '../../math/circles'
import { paperFor } from '../shared/paper'
import { outlinesShown, type CircleOptions, type Fill } from './displayOptions'

/** Fill colours for the three circles, in draw order (largest first in both Circle Trios). */
const FILL_COLORS: Record<Exclude<Fill, 'none'>, readonly [string, string, string]> = {
    color: ['#3d74b8', '#d0663a', '#3f9a6e'],
    grayscale: ['#555', '#888', '#333'],
}

/** Grows with line thickness so the dots always stand out from the outlines. */
const centerRadius = (lineWidth: number) => Math.max(3, lineWidth * 1.5)

/**
 * Draws the circles on a square canvas `size` pixels wide. Circles are in canvas units,
 * where the canvas spans −1 to 1 on both axes with y pointing up.
 */
export function drawCircles(
    ctx: CanvasRenderingContext2D,
    size: number,
    circles: readonly Circle[],
    options: CircleOptions,
) {
    const { ink } = paperFor(ctx)
    const half = size / 2
    const toX = (x: number) => half + x * half
    const toY = (y: number) => half - y * half // canvas y points down
    const path = (c: Circle) => {
        ctx.beginPath()
        ctx.arc(toX(c.center[0]), toY(c.center[1]), c.radius * half, 0, Math.PI * 2)
    }

    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, size, size) // transparent, so the paper behind the canvas shows through

    // Fills: each one blends over what's already drawn, so overlaps darken on their own.
    if (options.fill !== 'none') {
        const colors = FILL_COLORS[options.fill]
        ctx.globalAlpha = options.opacity / 100
        circles.forEach((c, i) => {
            ctx.fillStyle = colors[i % colors.length]
            path(c)
            ctx.fill()
        })
        ctx.globalAlpha = 1
    }

    // Outlines at full strength, so every edge stays crisp to draw from.
    if (outlinesShown(options)) {
        ctx.lineWidth = options.lineWidth
        ctx.strokeStyle = ink
        for (const c of circles) {
            path(c)
            ctx.stroke()
        }
    }

    if (options.showCenters) {
        ctx.fillStyle = ink
        for (const c of circles) {
            ctx.beginPath()
            ctx.arc(
                toX(c.center[0]),
                toY(c.center[1]),
                centerRadius(options.lineWidth),
                0,
                Math.PI * 2,
            )
            ctx.fill()
        }
    }
}
