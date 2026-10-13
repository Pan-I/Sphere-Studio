import { proportionFromPick } from '../../math/cylinder'
import { randomQuat, type Quat } from '../../math/quat'
import { mulberry32 } from '../../math/random'

/**
 * Orientation plus proportions for a seed, drawn exactly as the Cylinder Randomizer draws them:
 * the first three draws of the seed's stream turn the cone the same way they turn the sphere,
 * the cube and the cylinder, and the fourth picks the height-to-diameter ratio from the same
 * range. New draws must only be added after these, so shared links keep their pose.
 */
export function poseFromSeed(seed: number): { q: Quat; proportion: number } {
    const rand = mulberry32(seed)
    const q = randomQuat(rand)
    return { q, proportion: proportionFromPick(rand()) }
}
