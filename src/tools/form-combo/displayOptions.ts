import {
    colorModeField,
    defineOptions,
    lineWidthField,
    toggleField,
    type ChoiceField,
    type ColorMode,
} from '../shared/options'
import type { FormsChoice } from './pose'

export type Shading = ColorMode

export interface FormComboOptions {
    forms: FormsChoice
    shading: Shading
    lineWidth: number
    perspective: boolean
    uniformSize: boolean
    highlightMeet: boolean
    showHiddenEdges: boolean
    showSphereLines: boolean
    showAxes: boolean
    showEllipseAxes: boolean
}

export const FORMS_FIELD: ChoiceField<FormComboOptions, FormsChoice> = {
    kind: 'choice',
    label: 'Forms',
    default: 'three',
    choices: [
        { value: 'three', label: 'Sphere, box and cylinder' },
        { value: 'two', label: 'Two of them' },
        { value: 'four', label: 'All three and a cone' },
    ],
}

/** The Display panel, in order. Also gives the defaults and how the options are saved. */
export const FORM_COMBO_OPTIONS = defineOptions<FormComboOptions>(
    'sphere-studio:form-combo:display',
    {
        forms: FORMS_FIELD,
        shading: colorModeField('Shading', 'None (lines only)'),
        lineWidth: lineWidthField(),
        perspective: toggleField('Perspective', true),
        uniformSize: toggleField('Uniform cylinders and cones (height 2× diameter)', true),
        highlightMeet: toggleField('Highlight where forms meet', true),
        showHiddenEdges: toggleField('Show hidden edges', false),
        showSphereLines: toggleField("Show the sphere's sector lines", true),
        showAxes: toggleField('Show cylinder and cone axes', false),
        showEllipseAxes: toggleField('Show ellipse axes', true),
    },
)

export const DEFAULT_OPTIONS = FORM_COMBO_OPTIONS.defaults
