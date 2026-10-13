import {
    colorModeField,
    defineOptions,
    lineWidthField,
    toggleField,
    type ColorMode,
} from '../shared/options'

export type Shading = ColorMode

export interface DisplayOptions {
    shading: Shading
    lineWidth: number
    showFarSide: boolean
    showMarker: boolean
}

/** The Display panel, in order. Also gives the defaults and how the options are saved. */
export const SPHERE_OPTIONS = defineOptions<DisplayOptions>(
    'sphere-studio:sphere-randomizer:display',
    {
        shading: colorModeField('Shading', 'None (lines only)'),
        lineWidth: lineWidthField(),
        showFarSide: toggleField('Show far-side lines', true),
        showMarker: toggleField('Show center marker', true),
    },
)

export const DEFAULT_OPTIONS = SPHERE_OPTIONS.defaults
