import { DEFAULT_OPTIONS } from './displayOptions'
import { drawSubtract } from './drawSubtract'
import { cutoutFromSeed } from './pose'

/** The pose for `seed` with the default display options, for the home-page card. */
export function drawSubtractExample(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    drawSubtract(
        ctx,
        size,
        cutoutFromSeed(seed, DEFAULT_OPTIONS.cuts, DEFAULT_OPTIONS.uniformSize),
        DEFAULT_OPTIONS,
    )
}
