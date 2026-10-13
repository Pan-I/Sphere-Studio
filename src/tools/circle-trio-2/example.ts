import { DEFAULT_OPTIONS } from '../circle-trio/displayOptions'
import { drawCircles } from '../circle-trio/drawCircles'
import { layoutFromSeed } from './layout'

/** The layout for `seed` with the default display options, for the home-page card. */
export function drawCircleTrio2Example(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    drawCircles(ctx, size, layoutFromSeed(seed), DEFAULT_OPTIONS)
}
