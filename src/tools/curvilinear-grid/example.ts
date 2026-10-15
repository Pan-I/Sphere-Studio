import { DEFAULT_OPTIONS } from './displayOptions'
import { drawCurvilinearGrid } from './drawCurvilinearGrid'
import { poseFromSeed } from './pose'

/**
 * The grid for `seed` for the home-page card: the default options, but without the labels, which
 * crowd a card this small, and with the lines drawn thicker so they still show.
 */
export function drawCurvilinearGridExample(
    ctx: CanvasRenderingContext2D,
    size: number,
    seed: number,
) {
    drawCurvilinearGrid(ctx, size, poseFromSeed(seed), {
        ...DEFAULT_OPTIONS,
        lineWidth: 5,
        showLabels: false,
    })
}
