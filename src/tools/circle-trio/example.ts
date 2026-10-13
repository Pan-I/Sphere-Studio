import { DEFAULT_OPTIONS } from './displayOptions'
import { drawCircles } from './drawCircles'
import { layoutFromSeed } from './layout'

/** The layout for `seed` with the default display options, for the home-page card. */
export function drawCircleExample(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    drawCircles(ctx, size, layoutFromSeed(seed), DEFAULT_OPTIONS)
}
