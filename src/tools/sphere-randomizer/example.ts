import { pickMarker } from '../../math/sphere'
import { DEFAULT_OPTIONS } from './displayOptions'
import { drawSphere } from './drawSphere'
import { poseFromSeed } from './pose'

/** The pose for `seed` with the default display options, for the home-page card. */
export function drawSphereExample(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    const { q, markerPick } = poseFromSeed(seed)
    drawSphere(ctx, size, q, DEFAULT_OPTIONS, pickMarker(q, markerPick))
}
