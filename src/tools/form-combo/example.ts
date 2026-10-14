import { DEFAULT_OPTIONS } from './displayOptions'
import { drawFormCombo } from './drawFormCombo'
import { comboFromSeed } from './pose'

/** The pose for `seed` with the default display options, for the home-page card. */
export function drawFormComboExample(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    drawFormCombo(
        ctx,
        size,
        comboFromSeed(seed, DEFAULT_OPTIONS.forms, DEFAULT_OPTIONS.uniformSize),
        DEFAULT_OPTIONS,
    )
}
