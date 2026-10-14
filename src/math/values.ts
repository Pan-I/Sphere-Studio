/**
 * Image processing for value studies: how light each pixel looks, and grouping those values into a
 * few flat steps. Works on plain arrays, one number per pixel row by row, so it has no canvas or UI
 * dependencies.
 *
 * Values are CIE L* lightness, 0 (black) to 100 (white). Unlike raw RGB, equal steps in L* look
 * like equal steps to the eye, so a 5-value scale made in L* looks evenly spaced.
 */

/** sRGB channel (0–255) to linear light (0–1), worked out once for every channel value. */
const LINEAR = Array.from({ length: 256 }, (_, c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
})

const EPSILON = 216 / 24389 // where L* switches from a cube root to a straight line
const KAPPA = 24389 / 27

/** Relative luminance (0–1) to L* lightness (0–100). */
export function lightnessFromLuminance(y: number): number {
    return y > EPSILON ? 116 * Math.cbrt(y) - 16 : KAPPA * y
}

/** The L* lightness of an sRGB color, channels 0–255. */
export function lightnessOf(r: number, g: number, b: number): number {
    return lightnessFromLuminance(0.2126 * LINEAR[r] + 0.7152 * LINEAR[g] + 0.0722 * LINEAR[b])
}

/** The sRGB gray (0–255) that has lightness `l`, so a gray swatch shows exactly that value. */
export function grayOf(l: number): number {
    const t = Math.min(100, Math.max(0, l))
    const y = t > KAPPA * EPSILON ? ((t + 16) / 116) ** 3 : t / KAPPA
    const s = y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055
    return Math.round(s * 255)
}

/** The lightness of every pixel of RGBA data, as from `getImageData`. Alpha is ignored. */
export function lightnessOfPixels(rgba: ArrayLike<number>): Float32Array {
    const out = new Float32Array(rgba.length / 4)
    for (let i = 0; i < out.length; i++) {
        out[i] = lightnessOf(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2])
    }
    return out
}

/** One pass of a box blur along rows (step 1) or columns (step width), with edges held. */
function boxPass(
    src: Float32Array,
    dst: Float32Array,
    lines: number,
    length: number,
    lineStep: number,
    step: number,
    radius: number,
) {
    const span = radius * 2 + 1
    for (let line = 0; line < lines; line++) {
        const start = line * lineStep
        const at = (k: number) => src[start + Math.min(length - 1, Math.max(0, k)) * step]
        let sum = 0
        for (let k = -radius; k <= radius; k++) sum += at(k)
        for (let k = 0; k < length; k++) {
            dst[start + k * step] = sum / span
            sum += at(k + radius + 1) - at(k - radius)
        }
    }
}

/**
 * Softens the picture like squinting does, so small details drop out and the big value shapes are
 * left. Two box blurs in each direction, which looks close to a Gaussian blur and costs the same
 * whatever the radius. `radius` is in pixels; 0 returns the values unchanged.
 */
export function blur(values: Float32Array, width: number, height: number, radius: number) {
    const r = Math.round(radius)
    if (r < 1) return values
    const a = Float32Array.from(values)
    const b = new Float32Array(values.length)
    for (let i = 0; i < 2; i++) {
        boxPass(a, b, height, width, width, 1, r) // rows, a into b
        boxPass(b, a, width, height, 1, width, r) // columns, back into a
    }
    return a
}

/** The lightness below which `fraction` of the values fall, to the nearest 0.1. */
export function percentile(values: Float32Array, fraction: number): number {
    const bins = new Uint32Array(1001)
    for (const v of values) bins[Math.round(Math.min(100, Math.max(0, v)) * 10)]++
    const target = fraction * values.length
    let seen = 0
    for (let i = 0; i < bins.length; i++) {
        seen += bins[i]
        if (seen >= target && seen > 0) return i / 10
    }
    return 100
}

/** How much of the picture may be clipped to pure black, and to pure white, when stretching. */
export const STRETCH_CLIP = 0.01

/**
 * Spreads the values out to fill 0 to 100, for a flat or hazy photo. The darkest and lightest 1%
 * are clipped, so a few stray pixels can't hold the rest back. A picture of one flat value is
 * left as it is.
 */
export function stretch(values: Float32Array): Float32Array {
    const low = percentile(values, STRETCH_CLIP)
    const high = percentile(values, 1 - STRETCH_CLIP)
    if (high - low < 1) return values
    const scale = 100 / (high - low)
    return values.map((v) => Math.min(100, Math.max(0, (v - low) * scale)))
}

/**
 * The values on an `count`-step scale, from black to white in even steps of lightness, like a
 * printed value scale: 3 is black, middle gray and white.
 */
export function valueScale(count: number): number[] {
    return Array.from({ length: count }, (_, k) => (100 * k) / (count - 1))
}

/**
 * Which step of a `count`-step scale each value falls in, 0 being black. The range is cut into
 * `count` equal bands, so with 3 values the darkest third of the range becomes black, the middle
 * third middle gray and the lightest third white.
 */
export function posterize(values: Float32Array, count: number): Uint8Array {
    const out = new Uint8Array(values.length)
    for (let i = 0; i < values.length; i++) {
        out[i] = Math.min(count - 1, Math.max(0, Math.floor((values[i] * count) / 100)))
    }
    return out
}

/** The fraction of the picture each step covers, in order from black. They add up to 1. */
export function coverage(steps: Uint8Array, count: number): number[] {
    const counts = new Array<number>(count).fill(0)
    for (const s of steps) counts[s]++
    return counts.map((c) => (steps.length ? c / steps.length : 0))
}

/**
 * Marks the pixels on the border between two value shapes, `thickness` pixels wide, so the shapes
 * can be drawn as outlines. 1 means on an edge.
 */
export function shapeEdges(
    steps: Uint8Array,
    width: number,
    height: number,
    thickness: number,
): Uint8Array {
    const t = Math.max(1, Math.round(thickness))
    const out = new Uint8Array(steps.length)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x
            const right = x + 1 < width && steps[i + 1] !== steps[i]
            const below = y + 1 < height && steps[i + width] !== steps[i]
            if (!right && !below) continue
            // Thicken toward the right and down, so the line sits across the border.
            for (let dy = 0; dy < t && y + dy < height; dy++) {
                for (let dx = 0; dx < t && x + dx < width; dx++) out[i + dy * width + dx] = 1
            }
        }
    }
    return out
}
