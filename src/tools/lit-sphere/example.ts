import { DEFAULT_OPTIONS } from './displayOptions'
import { drawLitSphere } from './drawLitSphere'
import { lightFromSeed } from './pose'

/** The light for `seed` with the default display options, for the home-page card. */
export function drawLitSphereExample(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    drawLitSphere(ctx, size, lightFromSeed(seed), DEFAULT_OPTIONS)
}
