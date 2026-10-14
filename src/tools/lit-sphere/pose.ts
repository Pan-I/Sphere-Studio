import { lightDirection } from '../../math/light'
import type { Vec3 } from '../../math/quat'
import { mulberry32 } from '../../math/random'

const DEG = Math.PI / 180

/**
 * The light can come from anywhere around the sphere except close to straight behind the viewer
 * (flat, with the shadow hidden) or straight behind the sphere (almost all shadow).
 */
export const MIN_AZIMUTH = 30 * DEG
export const MAX_AZIMUTH = 150 * DEG

/** High enough that the whole cast shadow fits on the canvas, low enough to give it some length. */
export const MIN_ELEVATION = 30 * DEG
export const MAX_ELEVATION = 65 * DEG

/**
 * The light for a seed. The first draw picks the side (left or right), the second how far round
 * from the viewer, the third how high. New draws must only be added after these, so shared links
 * keep their light.
 */
export function lightFromSeed(seed: number): Vec3 {
    const rand = mulberry32(seed)
    const side = rand() < 0.5 ? -1 : 1
    const azimuth = side * (MIN_AZIMUTH + (MAX_AZIMUTH - MIN_AZIMUTH) * rand())
    const elevation = MIN_ELEVATION + (MAX_ELEVATION - MIN_ELEVATION) * rand()
    return lightDirection(azimuth, elevation)
}

/** Where the light comes from, for screen readers, e.g. "the left, in front of it". */
export function describeLight(light: Vec3): string {
    const side = light[0] < 0 ? 'left' : 'right'
    return `the ${side}, ${light[2] >= 0 ? 'in front of it' : 'behind it'}`
}
