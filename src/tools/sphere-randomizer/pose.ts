import { randomQuat, type Quat } from '../../math/quat'
import { mulberry32 } from '../../math/random'

/**
 * Orientation plus a marker pick for a seed. The orientation uses the first three
 * draws of the seed's stream, exactly as before, so existing links keep their pose.
 * The marker pick is the fourth draw, a number in [0, 1).
 */
export function poseFromSeed(seed: number): { q: Quat; markerPick: number } {
    const rand = mulberry32(seed)
    const q = randomQuat(rand)
    return { q, markerPick: rand() }
}

/** The same seed always produces the same orientation. */
export function quatFromSeed(seed: number): Quat {
    return poseFromSeed(seed).q
}
