import { proportionFromPick } from '../../math/cylinder'
import { randomQuat, type Quat } from '../../math/quat'
import { mulberry32 } from '../../math/random'

/**
 * Orientation plus proportions for a seed. The orientation uses the first three draws of the
 * seed's stream, so a seed turns the cylinder the same way it turns the sphere and the cube. The
 * fourth draw picks the length-to-diameter ratio. New draws must only be added after these, so
 * shared links keep their pose.
 */
export function poseFromSeed(seed: number): { q: Quat; proportion: number } {
    const rand = mulberry32(seed)
    const q = randomQuat(rand)
    return { q, proportion: proportionFromPick(rand()) }
}
