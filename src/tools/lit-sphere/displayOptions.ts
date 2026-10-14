import {
    colorModeField,
    defineOptions,
    lineWidthField,
    toggleField,
    type ColorMode,
} from '../shared/options'

export type Shading = ColorMode

export interface LitSphereOptions {
    shading: Shading
    lineWidth: number
    flatValues: boolean
    showShadowEdges: boolean
    showLight: boolean
    showLabels: boolean
}

const linesOnly = (o: LitSphereOptions) => o.shading === 'none'

/** The Display panel, in order. Also gives the defaults and how the options are saved. */
export const LIT_SPHERE_OPTIONS = defineOptions<LitSphereOptions>(
    'sphere-studio:lit-sphere:display',
    {
        // Grayscale first: a lit sphere is a value study. Color adds warm light and cool shadow.
        shading: { ...colorModeField('Shading', 'None (lines only)'), default: 'grayscale' },
        lineWidth: lineWidthField(),
        flatValues: { ...toggleField('Flat value zones', true), disabledWhen: linesOnly },
        // Lines only has nothing else to show where the shadow starts, so it always draws them.
        showShadowEdges: {
            ...toggleField('Show terminator and shadow edge', true),
            disabledWhen: linesOnly,
            checkedWhenDisabled: true,
        },
        showLight: toggleField('Show light direction', true),
        showLabels: toggleField('Label the zones', true),
    },
)

export const DEFAULT_OPTIONS = LIT_SPHERE_OPTIONS.defaults
