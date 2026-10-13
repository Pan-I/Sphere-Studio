import { DEFAULT_OPTIONS } from './displayOptions'
import { drawBox } from './drawBox'
import { quatFromSeed } from './pose'

/** The pose for `seed` with the default display options, for the home-page card. */
export function drawBoxExample(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    drawBox(ctx, size, quatFromSeed(seed), DEFAULT_OPTIONS)
}
