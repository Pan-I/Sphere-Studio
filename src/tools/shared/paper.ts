/** A colour as red, green and blue, each 0 to 255. */
export type RGB = readonly [number, number, number]

/**
 * In dark mode, how far fills and shading are pulled toward the paper. Values keep their order
 * and their spacing, just over a dimmer range, like turning the lights down.
 */
const FILL_DIM = 0.55
/** In dark mode, how far coloured lines (axes, vanishing points) are lifted toward the ink. */
const LINE_LIFT = 0.35

const WHITE: RGB = [255, 255, 255]
const PENCIL: RGB = [34, 34, 34] // #222

/** The colours a drawing is made in: the paper under it, the pencil, and how colours adapt. */
export interface Paper {
    dark: boolean
    /** The background, as a CSS colour. */
    paper: string
    /** Outlines and text, as a CSS colour. */
    ink: string
    /** A fill colour as it sits on this paper: unchanged on white, dimmed on dark paper. */
    fill: (color: string) => string
    /** The same as `fill`, for pixel-by-pixel shading. */
    fillRGB: (rgb: RGB) => RGB
    /**
     * For value studies, where the lights matter as much as the darks: on dark paper, black
     * becomes the paper and white becomes the ink, with everything between spaced evenly. So a
     * highlight stays bright, unlike `fillRGB`, which dims the whole range.
     */
    valueRGB: (rgb: RGB) => RGB
    /** A coloured line: unchanged on white, lifted toward the ink on dark paper so it shows. */
    line: (color: string) => string
}

/** Reads `#rgb`, `#rrggbb` or `rgb(r, g, b)`. Null for anything else. */
export function parseColor(color: string): RGB | null {
    const c = color.trim()
    const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(c)
    if (short) return [1, 2, 3].map((i) => parseInt(short[i] + short[i], 16)) as never
    const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c)
    if (long) return [1, 2, 3].map((i) => parseInt(long[i], 16)) as never
    const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(c)
    if (rgb) return [1, 2, 3].map((i) => Number(rgb[i])) as never
    return null
}

/** `a` moved a fraction `t` of the way toward `b`. */
export function mix(a: RGB, b: RGB, t: number): RGB {
    return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as never
}

const css = ([r, g, b]: RGB) => `rgb(${r}, ${g}, ${b})`

/** Perceived lightness from 0 to 1, close enough to tell dark paper from light. */
const lightness = ([r, g, b]: RGB) => (0.299 * r + 0.587 * g + 0.114 * b) / 255

/** Paper and ink as given, with fills and lines adapted when the paper is dark. */
export function makePaper(paper: RGB, ink: RGB): Paper {
    const dark = lightness(paper) < 0.5
    const fillRGB = (rgb: RGB) => (dark ? mix(rgb, paper, FILL_DIM) : rgb)
    const adapt = (color: string, f: (rgb: RGB) => RGB) => {
        const rgb = parseColor(color)
        return dark && rgb ? css(f(rgb)) : color
    }
    return {
        dark,
        paper: css(paper),
        ink: css(ink),
        fill: (color) => adapt(color, fillRGB),
        fillRGB,
        valueRGB: (rgb) =>
            dark
                ? ([0, 1, 2].map((i) =>
                      Math.round(paper[i] + ((ink[i] - paper[i]) * rgb[i]) / 255),
                  ) as never)
                : rgb,
        line: (color) => adapt(color, (rgb) => mix(rgb, ink, LINE_LIFT)),
    }
}

/** White paper and a dark pencil: the light theme, and the fallback anywhere styles can't be read. */
export const WHITE_PAPER = makePaper(WHITE, PENCIL)

/**
 * The paper for a canvas, from the `--paper` and `--ink` CSS variables it inherits (set for light
 * and dark in index.css), so the drawing follows the site's theme. White paper when they aren't
 * set, as in tests.
 */
export function paperFor(ctx: CanvasRenderingContext2D): Paper {
    const canvas = ctx.canvas as HTMLCanvasElement | undefined
    if (typeof getComputedStyle === 'undefined' || !(canvas instanceof Element)) return WHITE_PAPER
    const style = getComputedStyle(canvas)
    const paper = parseColor(style.getPropertyValue('--paper'))
    const ink = parseColor(style.getPropertyValue('--ink'))
    return paper && ink ? makePaper(paper, ink) : WHITE_PAPER
}
