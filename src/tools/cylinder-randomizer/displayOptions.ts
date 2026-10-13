import {
    colorModeField,
    defineOptions,
    lineWidthField,
    toggleField,
    type ColorMode,
} from '../shared/options'

export type Shading = ColorMode

export interface CylinderOptions {
    shading: Shading
    lineWidth: number
    perspective: boolean
    showHiddenEdges: boolean
    showAxis: boolean
    showCenterLines: boolean
}

/** The Display panel, in order. Also gives the defaults and how the options are saved. */
export const CYLINDER_OPTIONS = defineOptions<CylinderOptions>(
    'sphere-studio:cylinder-randomizer:display',
    {
        shading: colorModeField('Shading', 'None (lines only)'),
        lineWidth: lineWidthField(),
        perspective: toggleField('Perspective', true),
        showHiddenEdges: toggleField('Show hidden edges', true),
        showAxis: toggleField('Show axis', true),
        showCenterLines: toggleField('Show center lines', false),
    },
)

export const DEFAULT_OPTIONS = CYLINDER_OPTIONS.defaults
