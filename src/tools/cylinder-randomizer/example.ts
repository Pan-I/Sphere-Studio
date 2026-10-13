import { DEFAULT_OPTIONS } from './displayOptions'
import { drawCylinder } from './drawCylinder'
import { poseFromSeed } from './pose'

/** The pose for `seed` with the default display options, for the home-page card. */
export function drawCylinderExample(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    const { q, proportion } = poseFromSeed(seed)
    drawCylinder(ctx, size, q, proportion, DEFAULT_OPTIONS)
}
