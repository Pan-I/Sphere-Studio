import { projectedCircle } from '../../math/ellipse'
import type { Vec3 } from '../../math/quat'

/** The major axis is color-coded red. The minor axis is a dark blue, so the two read apart. */
export const MAJOR_AXIS_COLOR = '#e63946'
export const MINOR_AXIS_COLOR = '#1d4e89'

/** The axes are construction lines, a little thinner than the outline. */
const AXIS_WIDTH = 0.75

/**
 * Strokes the major and minor axes of the ellipse that the circle `centre + cos φ·a + sin φ·b`
 * becomes on screen, end to end across the ellipse. `toCanvas` turns projected coordinates into
 * canvas ones. Leaves globalAlpha alone, so a caller can draw the axes of a hidden ellipse
 * faintly.
 */
export function strokeEllipseAxes(
    ctx: CanvasRenderingContext2D,
    circle: { centre: Vec3; a: Vec3; b: Vec3 },
    camera: number | null,
    toCanvas: (x: number, y: number) => [number, number],
    lineWidth: number,
) {
    const e = projectedCircle(circle.centre, circle.a, circle.b, camera)
    // Seen edge-on the ellipse is a line, with no axes to show.
    if (e === null) return
    const [x, y] = e.centre
    ctx.save()
    ctx.lineWidth = Math.max(1, lineWidth * AXIS_WIDTH)
    ctx.setLineDash([])
    for (const [half, color] of [
        [e.minor, MINOR_AXIS_COLOR],
        [e.major, MAJOR_AXIS_COLOR],
    ] as const) {
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(...toCanvas(x - half[0], y - half[1]))
        ctx.lineTo(...toCanvas(x + half[0], y + half[1]))
        ctx.stroke()
    }
    ctx.restore()
}

/** The circle `centre + radius·(cos φ·u + sin φ·v)`, in the form strokeEllipseAxes takes. */
export function rimCircle(
    shape: { u: Vec3; v: Vec3; radius: number },
    centre: Vec3,
): { centre: Vec3; a: Vec3; b: Vec3 } {
    const scale = (d: Vec3): Vec3 => [d[0] * shape.radius, d[1] * shape.radius, d[2] * shape.radius]
    return { centre, a: scale(shape.u), b: scale(shape.v) }
}
