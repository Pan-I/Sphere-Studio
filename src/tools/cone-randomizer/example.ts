import { DEFAULT_OPTIONS } from './displayOptions'
import { drawCone } from './drawCone'
import { poseFromSeed } from './pose'

/** The pose for `seed` with the default display options, for the home-page card. */
export function drawConeExample(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    const { q, proportion } = poseFromSeed(seed)
    drawCone(ctx, size, q, proportion, DEFAULT_OPTIONS)
}
