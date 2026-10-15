import { createContext, type RefObject } from 'react'

/**
 * How wide a downloaded PNG is, in pixels, whatever the canvas's size on screen: about 13.5 cm
 * (5.3 in) at 300 dpi, enough to print sharp on half a sheet.
 */
export const EXPORT_PIXELS = 1600

/** What the Download PNG button needs from a tool's canvas, registered by useSquareCanvas. */
export interface CanvasSource {
    /** The canvas on screen; the export is drawn beside it so it picks up the same colours. */
    canvas: HTMLCanvasElement
    /** The canvas's logical size, as passed to useSquareCanvas. */
    size: number
    draw: (ctx: CanvasRenderingContext2D) => void
    /** Overrides the file name's subject, e.g. the photo's name in Value Study. */
    name?: string
}

/**
 * Set by the tool page, so the canvas inside a tool can register itself for Download PNG without
 * every tool passing it up. Null when a canvas is drawn without a tool page, e.g. a thumbnail.
 */
export const CanvasExportContext = createContext<RefObject<CanvasSource | null> | null>(null)

/**
 * The downloaded file's name: the tool's slug, then the photo's name or the seed, e.g.
 * `box-randomizer-48213.png`. Only letters, digits and dashes, so it's safe on every system.
 */
export function exportFileName(slug: string, seed: number | null, name?: string): string {
    const subject = name ?? (seed === null ? '' : String(seed))
    const clean = `${slug}-${subject}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return `${clean || 'drawing'}.png`
}

/**
 * Redraws the tool's canvas at EXPORT_PIXELS on a fresh canvas, over the paper colour so the PNG
 * looks like the screen, in the theme it's showing, rather than having a transparent background.
 */
export function renderForExport(source: CanvasSource, pixels = EXPORT_PIXELS): HTMLCanvasElement {
    const out = document.createElement('canvas')
    out.width = pixels
    out.height = pixels
    // Drawn hidden next to the real canvas, so the paper and ink colours it reads from the CSS
    // (see paper.ts) resolve the same way, light or dark.
    out.className = source.canvas.className
    out.hidden = true
    out.style.background = 'var(--paper)'
    source.canvas.after(out)
    try {
        const ctx = out.getContext('2d')
        if (!ctx) return out
        const background = getComputedStyle(out).backgroundColor
        const scale = pixels / source.size
        ctx.setTransform(scale, 0, 0, scale, 0, 0)
        source.draw(ctx)
        // Fill the background behind what was drawn.
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'destination-over'
        ctx.fillStyle = background || '#fff'
        ctx.fillRect(0, 0, pixels, pixels)
        ctx.globalCompositeOperation = 'source-over'
    } finally {
        out.remove()
    }
    return out
}

/** Saves a canvas as a PNG through the browser's usual download. */
export function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
    canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        // Give the browser a moment to start the download before letting go of the file.
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
}
