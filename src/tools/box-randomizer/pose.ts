import { randomQuat, type Quat } from '../../math/quat'
import { mulberry32 } from '../../math/random'

/**
 * The cube's orientation for a seed: the first three draws of the seed's stream, the same way
 * the Sphere Randomizer picks its rotation. New draws must only be added after these, so
 * shared links keep their pose.
 */
export function quatFromSeed(seed: number): Quat {
    return randomQuat(mulberry32(seed))
}
