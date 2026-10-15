import {
    blur,
    coverage,
    grayOf,
    posterize,
    shapeEdges,
    stretch,
    valueScale,
} from '../../math/values'
import type { ValueStudyOptions } from './displayOptions'
import { paperFor, type Paper } from '../shared/paper'
import type { Picture } from './picture'

/** Outlines in a cyan that shows on black, white, every gray, and the warm colors most photos have. */
const OUTLINE_RGB = [0, 176, 255] as const
/** Outline width in canvas units. */
const OUTLINE_WIDTH = 1.5

/** The canvas width the Simplify radius is measured on, so a thumbnail blurs as much, relatively. */
export const REFERENCE_SIZE = 480
/** The value scale's height, as a fraction of the canvas. */
const SCALE_BAND = 0.12

/** Where the picture goes on the canvas, in canvas units. */
export interface Frame {
    x: number
    y: number
    width: number
    height: number
}

/**
 * Fits the picture into the canvas as large as it goes, leaving room for the value scale (if shown)
 * right under it, with the two centred together.
 */
export function frameFor(aspect: number, size: number, showScale: boolean): Frame {
    const band = showScale ? size * SCALE_BAND : 0
    const width = Math.min(size, (size - band) * aspect)
    const height = width / aspect
    return { x: (size - width) / 2, y: (size - height - band) / 2, width, height }
}

/** A coverage fraction as a short label: whole percent, or "<1%" for a sliver. */
export function percentLabel(fraction: number): string {
    if (fraction > 0 && fraction < 0.005) return '<1%'
    return `${Math.round(fraction * 100)}%`
}

/**
 * Draws the picture as a value study on a square canvas `size` units wide: grouped into a few flat
 * values, in grayscale, or as it is, with the shapes outlined and a value scale underneath if asked.
 */
export function drawValueStudy(
    ctx: CanvasRenderingContext2D,
    size: number,
    picture: Picture,
    options: ValueStudyOptions,
) {
    const paper = paperFor(ctx)
    const count = Number(options.valueCount)
    const frame = frameFor(picture.aspect, size, options.showScale)

    // The picture is processed at the canvas's real resolution, in physical pixels.
    const dpr = ctx.canvas.width / size
    const px = Math.round(frame.x * dpr)
    const py = Math.round(frame.y * dpr)
    const pw = Math.max(1, Math.round((frame.x + frame.width) * dpr) - px)
    const ph = Math.max(1, Math.round((frame.y + frame.height) * dpr) - py)
    const { rgba, lightness } = picture.pixels(pw, ph)

    const values = options.stretch ? stretch(lightness) : lightness
    const radius = (options.simplify * dpr * size) / REFERENCE_SIZE
    const steps = posterize(blur(values, pw, ph, radius), count)
    const levels = valueScale(count).map(grayOf)

    const image = ctx.createImageData(pw, ph)
    const out = image.data
    for (let i = 0; i < pw * ph; i++) {
        const o = i * 4
        if (options.view === 'original') {
            out[o] = rgba[o]
            out[o + 1] = rgba[o + 1]
            out[o + 2] = rgba[o + 2]
        } else {
            const v = options.view === 'values' ? levels[steps[i]] : grayOf(values[i])
            out[o] = v
            out[o + 1] = v
            out[o + 2] = v
        }
        out.set(paper.fillRGB([out[o], out[o + 1], out[o + 2]]), o)
        out[o + 3] = 255
    }
    if (options.outlineShapes) {
        const edges = shapeEdges(steps, pw, ph, OUTLINE_WIDTH * dpr)
        for (let i = 0; i < edges.length; i++) {
            if (edges[i]) out.set(OUTLINE_RGB, i * 4)
        }
    }

    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = paper.paper
    ctx.fillRect(0, 0, size, size)
    ctx.putImageData(image, px, py) // ignores the canvas transform, hence physical pixels

    ctx.strokeStyle = paper.ink
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.rect(frame.x, frame.y, frame.width, frame.height)
    ctx.stroke()

    if (options.showScale) {
        drawScale(ctx, size, frame.y + frame.height, levels, coverage(steps, count), paper)
    }
}

/** One swatch per value under the picture, each with how much of the picture it covers. */
function drawScale(
    ctx: CanvasRenderingContext2D,
    size: number,
    below: number,
    levels: readonly number[],
    shares: readonly number[],
    paper: Paper,
) {
    const band = size * SCALE_BAND
    const pad = size * 0.02
    const top = below + pad
    const height = band - pad * 2
    const width = (size - pad * 2) / levels.length
    const font = Math.max(8, Math.round(height * 0.38))
    ctx.font = `${font}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 1

    levels.forEach((gray, k) => {
        const x = pad + k * width
        const [shown] = paper.fillRGB([gray, gray, gray])
        ctx.fillStyle = `rgb(${shown}, ${shown}, ${shown})`
        ctx.fillRect(x, top, width, height)
        ctx.fillStyle = shown > 118 ? '#222' : '#fff' // middle gray is 119
        ctx.fillText(percentLabel(shares[k]), x + width / 2, top + height / 2)
    })
    ctx.strokeStyle = paper.ink
    ctx.beginPath()
    ctx.rect(pad, top, size - pad * 2, height)
    for (let k = 1; k < levels.length; k++) {
        ctx.moveTo(pad + k * width, top)
        ctx.lineTo(pad + k * width, top + height)
    }
    ctx.stroke()
}
