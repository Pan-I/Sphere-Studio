import {
    colorModeField,
    defineOptions,
    lineWidthField,
    toggleField,
    type ColorMode,
} from '../shared/options'

export type Shading = ColorMode

export interface BoxOptions {
    shading: Shading
    lineWidth: number
    perspective: boolean
    showHiddenEdges: boolean
    showCenterLines: boolean
}

/** The Display panel, in order. Also gives the defaults and how the options are saved. */
export const BOX_OPTIONS = defineOptions<BoxOptions>('sphere-studio:box-randomizer:display', {
    shading: colorModeField('Shading', 'None (lines only)'),
    lineWidth: lineWidthField(),
    perspective: toggleField('Perspective', true),
    showHiddenEdges: toggleField('Show hidden edges', true),
    showCenterLines: toggleField('Show center lines', false),
})

export const DEFAULT_OPTIONS = BOX_OPTIONS.defaults
