import { floorPointAt, sphereNormalAt } from '../../math/light'
import { lightnessOf, lightnessOfPixels } from '../../math/values'
import { layoutFor } from '../lit-sphere/drawLitSphere'
import { lightFromSeed } from '../lit-sphere/pose'
import { makeLighting, shadeFloor, shadeSphere } from '../lit-sphere/shading'

/** A picture's pixels at one size: its colors (RGBA, row by row) and the lightness of each. */
export interface Pixels {
    width: number
    height: number
    rgba: Uint8ClampedArray
    lightness: Float32Array
}

/** Something to study: a photo you loaded, or a sample drawn from a seed. */
export interface Picture {
    /** Width over height, to fit it on the canvas without stretching. */
    aspect: number
    /** Its pixels scaled to `width` × `height`. */
    pixels: (width: number, height: number) => Pixels
}

/** Keeps the last size asked for, so changing an option doesn't redo the scaling. */
function cacheLast(make: (width: number, height: number) => Pixels) {
    let last: Pixels | null = null
    return (width: number, height: number) => {
        if (last?.width !== width || last.height !== height) last = make(width, height)
        return last
    }
}

/**
 * A loaded photo. It stays in this browser tab: it's only ever drawn onto a canvas here, never
 * uploaded or saved.
 */
export function photoPicture(image: CanvasImageSource, width: number, height: number): Picture {
    return {
        aspect: width / height,
        pixels: cacheLast((w, h) => {
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (!ctx) throw new Error('No 2D canvas')
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(image, 0, 0, w, h)
            const rgba = ctx.getImageData(0, 0, w, h).data
            return { width: w, height: h, rgba, lightness: lightnessOfPixels(rgba) }
        }),
    }
}

/** The sample's floor is darker than the Lit Sphere's, so the sphere's lit side stands out from it. */
const SAMPLE_FLOOR = 0.7

/**
 * The picture to study before you load a photo: the Lit Sphere's sphere for this seed, smoothly
 * shaded in grayscale. It's worked out pixel by pixel with the Lit Sphere's own shading, so it
 * needs no canvas and draws the same everywhere.
 */
export function samplePicture(seed: number): Picture {
    const light = lightFromSeed(seed)
    const lighting = makeLighting(light)
    return {
        aspect: 1,
        pixels: cacheLast((w, h) => {
            const size = Math.min(w, h)
            const layout = layoutFor(light, size)
            const rgba = new Uint8ClampedArray(w * h * 4)
            const lightness = new Float32Array(w * h)
            for (let py = 0; py < h; py++) {
                const y = -(py + 0.5 - layout.cy) / layout.r
                for (let px = 0; px < w; px++) {
                    const x = (px + 0.5 - layout.cx) / layout.r
                    const n = sphereNormalAt(x, y)
                    const value = n
                        ? shadeSphere(n, lighting).value
                        : shadeFloor(floorPointAt(x, y), lighting).value * SAMPLE_FLOOR
                    const v = Math.round(Math.min(1, Math.max(0, value)) * 255)
                    const i = py * w + px
                    rgba.fill(v, i * 4, i * 4 + 3)
                    rgba[i * 4 + 3] = 255
                    lightness[i] = lightnessOf(v, v, v)
                }
            }
            return { width: w, height: h, rgba, lightness }
        }),
    }
}
