import {
    CONTACT,
    floorPointAt,
    sceneBounds,
    shadowEdgeAt,
    shadowOutline,
    sphereNormalAt,
    terminator,
    toView,
    pointFromLight,
} from '../../math/light'
import { dot, type Vec3 } from '../../math/quat'
import { splitByVisibility } from '../../math/sphere'
import { paperFor, type Paper } from '../shared/paper'
import type { LitSphereOptions } from './displayOptions'
import {
    flatValue,
    makeLighting,
    shadeColor,
    shadeFloor,
    shadeSphere,
    type Lighting,
    type Shade,
} from './shading'

const HIDDEN_ALPHA = 0.2
const SUN_COLOR = '#e8a000'

/** The sphere's radius as a fraction of the canvas, when the shadow leaves room for it. */
const MAX_RADIUS = 0.26
/** How much of the canvas the sphere, its shadow and the light arrow may fill. */
const FILL = 0.9
/** The sun's distance from the sphere's centre, in radii, and the arrow from it toward the sphere. */
const SUN_DISTANCE = 1.75
const ARROW_FROM = 1.55
const ARROW_TO = 1.12
const SUN_RADIUS = 0.1

/** Straight pieces per terminator and shadow edge. */
const CURVE_STEPS = 128

/** Where the scene goes on the canvas: the sphere's centre and radius, in canvas units. */
export interface Layout {
    cx: number
    cy: number
    r: number
}

/** Unit screen direction toward the light (y up), and whether the light is in front of the sphere. */
function lightOnScreen(light: Vec3): { dir: [number, number]; inFront: boolean } {
    const [x, y, depth] = toView(light)
    const len = Math.hypot(x, y)
    return { dir: len > 1e-6 ? [x / len, y / len] : [0, 1], inFront: depth >= 0 }
}

/**
 * Fits the sphere, its whole cast shadow and the sun onto the canvas, centred, with the sphere as
 * large as that allows. The layout depends only on the light, so changing options never moves it.
 */
export function layoutFor(light: Vec3, size: number): Layout {
    const box = sceneBounds(light)
    const { dir } = lightOnScreen(light)
    const reach = SUN_DISTANCE + SUN_RADIUS * 2
    const sun = [dir[0] * reach, dir[1] * reach]
    const minX = Math.min(box.minX, sun[0])
    const maxX = Math.max(box.maxX, sun[0])
    const minY = Math.min(box.minY, sun[1])
    const maxY = Math.max(box.maxY, sun[1])
    const r = Math.min(size * MAX_RADIUS, (size * FILL) / Math.max(maxX - minX, maxY - minY))
    return {
        cx: size / 2 - (r * (minX + maxX)) / 2,
        cy: size / 2 + (r * (minY + maxY)) / 2, // canvas y points down
        r,
    }
}

/** Shades every pixel: the sphere where it covers the floor, the floor everywhere else. */
function shadePixels(
    ctx: CanvasRenderingContext2D,
    size: number,
    layout: Layout,
    lighting: Lighting,
    options: LitSphereOptions,
    paper: Paper,
) {
    if (options.shading === 'none') return
    const mode = options.shading
    const { width, height } = ctx.canvas
    const dpr = width / size
    const image = ctx.createImageData(width, height)
    const data = image.data

    for (let py = 0; py < height; py++) {
        const y = -((py + 0.5) / dpr - layout.cy) / layout.r
        for (let px = 0; px < width; px++) {
            const x = ((px + 0.5) / dpr - layout.cx) / layout.r
            const n = sphereNormalAt(x, y)
            const shade: Shade = n
                ? shadeSphere(n, lighting)
                : shadeFloor(floorPointAt(x, y), lighting)
            if (options.flatValues) {
                shade.value = flatValue(shade.zone, lighting)
                shade.warmth = Math.round(shade.warmth)
            }
            const [r, g, b] = paper.valueRGB(shadeColor(shade, mode))
            const i = (py * width + px) * 4
            data[i] = r
            data[i + 1] = g
            data[i + 2] = b
            data[i + 3] = 255
        }
    }
    ctx.putImageData(image, 0, 0) // ignores the canvas transform, hence physical pixels
}

interface Label {
    text: string
    /** The point labelled, in canvas units. */
    at: [number, number]
}

/** Where to put each zone's label, as points in canvas units. Zones that can't be seen are left out. */
function labelsFor(lighting: Lighting, layout: Layout): Label[] {
    const { light } = lighting
    const toCanvas = (p: Vec3): [number, number] => {
        const [x, y] = toView(p)
        return [layout.cx + x * layout.r, layout.cy - y * layout.r]
    }
    const facesViewer = (n: Vec3) => toView(n)[2] > 0.15
    const labels: Label[] = []
    const add = (text: string, p: Vec3, onSphere: boolean) => {
        if (!onSphere || facesViewer(p)) labels.push({ text, at: toCanvas(p) })
    }

    add('Highlight', lighting.half, true)
    // Turned to either side of the line through the highlight, so the labels don't stack up.
    add('Halftone', pointFromLight(light, 0.25, -0.6), true)
    add('Core shadow', pointFromLight(light, -0.2, 0.4), true)

    // Reflected light: the visible shadow-side point that catches the most bounced light.
    let best: Vec3 | null = null
    let bestBounce = 0.3
    for (let i = -20; i <= 20; i++) {
        for (let j = -20; j <= 20; j++) {
            const n = sphereNormalAt(i / 20, j / 20)
            if (!n || toView(n)[2] < 0.3 || dot(n, light) > -0.3) continue
            const b = dot(n, lighting.bounce)
            if (b > bestBounce) {
                best = n
                bestBounce = b
            }
        }
    }
    if (best) add('Reflected light', best, true)

    // Cast shadow: the nearest point along the middle of the shadow that's clear of the sphere.
    const flat = Math.hypot(light[0], light[2])
    const away: Vec3 = [-light[0] / flat, 0, -light[2] / flat]
    for (let s = 0.5; s < 6; s += 0.1) {
        const g: Vec3 = [CONTACT[0] + away[0] * s, CONTACT[1], CONTACT[2] + away[2] * s]
        if (shadowEdgeAt(g, light).edge > 0.6) break // reached the far end
        const [x, y] = toView(g)
        if (Math.hypot(x, y) > 1.25) {
            add('Cast shadow', g, false)
            break
        }
    }

    // Occlusion: right beside the contact point, on the side toward the light, just clear of the
    // sphere's outline.
    add('Occlusion', [CONTACT[0] + (light[0] < 0 ? -0.32 : 0.32), CONTACT[1], 0.2], false)
    return labels
}

function drawLabels(
    ctx: CanvasRenderingContext2D,
    size: number,
    layout: Layout,
    labels: Label[],
    paper: Paper,
) {
    const font = Math.max(10, Math.round(size * 0.03))
    const gap = font * 0.8
    const lineHeight = font * 1.3
    ctx.font = `${font}px system-ui, sans-serif`
    ctx.textBaseline = 'middle'

    // Text goes on the outer side of its point, then is nudged down until it clears the labels
    // above it on the same side.
    const placed = labels
        .map((l) => {
            const right = l.at[0] >= layout.cx
            // jsdom (tests) can't measure text, so fall back to an estimate there.
            const width = ctx.measureText(l.text).width || l.text.length * font * 0.55
            const x = right ? l.at[0] + gap : l.at[0] - gap - width
            return { ...l, right, width, x, y: l.at[1] }
        })
        .sort((a, b) => a.y - b.y)
    placed.forEach((l, i) => {
        for (const other of placed.slice(0, i)) {
            const overlapX = l.x < other.x + other.width + gap && other.x < l.x + l.width + gap
            if (overlapX && l.y - other.y < lineHeight) l.y = other.y + lineHeight
        }
        l.x = Math.min(size - l.width - 2, Math.max(2, l.x))
        l.y = Math.min(size - font, Math.max(font, l.y))
    })

    for (const l of placed) {
        const textEdge = l.right ? l.x : l.x + l.width
        ctx.strokeStyle = paper.paper
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(...l.at)
        ctx.lineTo(textEdge, l.y)
        ctx.stroke()
        ctx.strokeStyle = paper.ink
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = paper.ink
        ctx.beginPath()
        ctx.arc(l.at[0], l.at[1], 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = paper.paper
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.lineWidth = 4
        ctx.lineJoin = 'round'
        ctx.strokeText(l.text, l.x, l.y)
        ctx.fillText(l.text, l.x, l.y)
    }
}

/** A small sun with rays, and an arrow from it toward the sphere. Faint when the light is behind. */
function drawLight(ctx: CanvasRenderingContext2D, layout: Layout, light: Vec3, lineWidth: number) {
    const { dir, inFront } = lightOnScreen(light)
    const { cx, cy, r } = layout
    const at = (k: number): [number, number] => [cx + dir[0] * k * r, cy - dir[1] * k * r]
    ctx.globalAlpha = inFront ? 1 : 0.45

    const [sx, sy] = at(SUN_DISTANCE)
    const sun = SUN_RADIUS * r
    ctx.strokeStyle = SUN_COLOR
    ctx.fillStyle = SUN_COLOR
    ctx.lineWidth = Math.max(1.5, lineWidth * 0.75)
    ctx.beginPath()
    ctx.arc(sx, sy, sun, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        ctx.moveTo(sx + Math.cos(a) * sun * 1.5, sy + Math.sin(a) * sun * 1.5)
        ctx.lineTo(sx + Math.cos(a) * sun * 2, sy + Math.sin(a) * sun * 2)
    }
    ctx.stroke()

    // The arrow, from the sun toward the sphere.
    const [ax, ay] = at(ARROW_FROM)
    const [bx, by] = at(ARROW_TO)
    const head = Math.max(8, lineWidth * 3)
    const back = Math.atan2(ay - by, ax - bx)
    ctx.lineWidth = Math.max(1.5, lineWidth)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.moveTo(bx + Math.cos(back + 0.45) * head, by + Math.sin(back + 0.45) * head)
    ctx.lineTo(bx, by)
    ctx.lineTo(bx + Math.cos(back - 0.45) * head, by + Math.sin(back - 0.45) * head)
    ctx.stroke()
    ctx.globalAlpha = 1
}

/**
 * Draws the sphere on its floor, lit from `light` (a unit vector toward the light), on a square
 * canvas `size` units wide.
 */
export function drawLitSphere(
    ctx: CanvasRenderingContext2D,
    size: number,
    light: Vec3,
    options: LitSphereOptions,
) {
    const paper = paperFor(ctx)
    const layout = layoutFor(light, size)
    const { cx, cy, r } = layout
    const lighting = makeLighting(light)
    const linesOnly = options.shading === 'none'
    const toCanvas = (p: Vec3): [number, number] => {
        const [x, y] = toView(p)
        return [cx + x * r, cy - y * r]
    }
    const polyline = (points: readonly Vec3[]) => {
        ctx.beginPath()
        points.forEach((p, i) => {
            const [x, y] = toCanvas(p)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        })
        ctx.stroke()
    }

    ctx.clearRect(0, 0, size, size)
    if (linesOnly) {
        ctx.fillStyle = paper.paper
        ctx.fillRect(0, 0, size, size)
    } else {
        shadePixels(ctx, size, layout, lighting, options, paper)
    }

    ctx.lineWidth = options.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = paper.ink

    if (linesOnly || options.showShadowEdges) {
        // The cast shadow's edge, except where the sphere hides it.
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, size, size)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.clip('evenodd')
        polyline(shadowOutline(light, CURVE_STEPS))
        ctx.restore()

        // The terminator, faint where it runs round the back.
        const runs = splitByVisibility(terminator(light, CURVE_STEPS).map(toView))
        for (const run of runs) {
            ctx.globalAlpha = run.front ? 1 : HIDDEN_ALPHA
            ctx.beginPath()
            run.points.forEach(([x, y], i) => {
                if (i === 0) ctx.moveTo(cx + x * r, cy - y * r)
                else ctx.lineTo(cx + x * r, cy - y * r)
            })
            ctx.stroke()
        }
        ctx.globalAlpha = 1
    }

    if (linesOnly) {
        // Mark the highlight, which shading would otherwise show.
        const [hx, hy] = toCanvas(lighting.half)
        ctx.beginPath()
        ctx.arc(hx, hy, Math.max(4, r * 0.07), 0, Math.PI * 2)
        ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()

    if (options.showLight) drawLight(ctx, layout, light, options.lineWidth)
    if (options.showLabels) drawLabels(ctx, size, layout, labelsFor(lighting, layout), paper)
}
