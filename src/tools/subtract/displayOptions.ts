import {
    colorModeField,
    defineOptions,
    lineWidthField,
    toggleField,
    type ChoiceField,
    type ColorMode,
} from '../shared/options'
import type { CutsChoice } from './pose'

export type Shading = ColorMode

export interface SubtractOptions {
    cuts: CutsChoice
    shading: Shading
    lineWidth: number
    perspective: boolean
    uniformSize: boolean
    highlightMeet: boolean
    showCutAway: boolean
    showHiddenEdges: boolean
    showSphereLines: boolean
    showAxes: boolean
    showEllipseAxes: boolean
}

export const CUTS_FIELD: ChoiceField<SubtractOptions, CutsChoice> = {
    kind: 'choice',
    label: 'Cuts',
    default: 'one',
    choices: [
        { value: 'one', label: 'One cut' },
        { value: 'two', label: 'Two cuts' },
    ],
}

/** The Display panel, in order. Also gives the defaults and how the options are saved. */
export const SUBTRACT_OPTIONS = defineOptions<SubtractOptions>('sphere-studio:subtract:display', {
    cuts: CUTS_FIELD,
    shading: colorModeField('Shading', 'None (lines only)'),
    lineWidth: lineWidthField(),
    perspective: toggleField('Perspective', true),
    uniformSize: toggleField('Uniform cylinders and cones (height 2× diameter)', true),
    highlightMeet: toggleField('Highlight where the cut meets the form', true),
    showCutAway: toggleField('Show what was cut away (dashed)', true),
    showHiddenEdges: toggleField('Show hidden edges', false),
    showSphereLines: toggleField("Show the sphere's sector lines", true),
    showAxes: toggleField('Show cylinder and cone axes', false),
    showEllipseAxes: toggleField('Show ellipse axes', true),
})

export const DEFAULT_OPTIONS = SUBTRACT_OPTIONS.defaults
