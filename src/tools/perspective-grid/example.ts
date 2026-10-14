import { DEFAULT_OPTIONS } from './displayOptions'
import { drawPerspectiveGrid } from './drawPerspectiveGrid'
import { poseFromSeed } from './pose'

/**
 * The grid for `seed` for the home-page card: the default options, but without the labels, which
 * crowd a card this small, and with the lines drawn thicker so they still show.
 */
export function drawPerspectiveGridExample(
    ctx: CanvasRenderingContext2D,
    size: number,
    seed: number,
) {
    drawPerspectiveGrid(ctx, size, poseFromSeed(seed), {
        ...DEFAULT_OPTIONS,
        lineWidth: 5,
        showLabels: false,
    })
}
