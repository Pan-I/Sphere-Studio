import { DEFAULT_OPTIONS } from './displayOptions'
import { drawValueStudy } from './drawValueStudy'
import { samplePicture } from './picture'

/** The sample picture for `seed` with the default display options, for the home-page card. */
export function drawValueStudyExample(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    drawValueStudy(ctx, size, samplePicture(seed), DEFAULT_OPTIONS)
}
