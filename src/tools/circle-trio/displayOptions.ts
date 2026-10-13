import {
    colorModeField,
    defineOptions,
    lineWidthField,
    toggleField,
    type ColorMode,
    type OptionFields,
} from '../shared/options'

export type Fill = ColorMode

export interface CircleOptions {
    fill: Fill
    opacity: number // percent, how solid each translucent fill is
    lineWidth: number
    showOutlines: boolean
    showCenters: boolean
}

const noFill = (options: CircleOptions) => options.fill === 'none'

/** The Display panel, in order. Circle Trio 1 and 2 share it, each saving its own choices. */
export const CIRCLE_FIELDS: OptionFields<CircleOptions> = {
    fill: colorModeField('Fill', 'None (outlines only)'),
    opacity: {
        kind: 'range',
        label: 'Opacity',
        default: 35,
        min: 15,
        max: 60,
        step: 5,
        unit: '%',
        disabledWhen: noFill,
    },
    lineWidth: lineWidthField(),
    showOutlines: {
        ...toggleField('Show outlines', true),
        disabledWhen: noFill,
        checkedWhenDisabled: true,
    },
    showCenters: toggleField('Show centers', false),
}

/** Circle Trio 1's options. The key predates the "1", so saved choices carry over. */
export const CIRCLE_OPTIONS = defineOptions('sphere-studio:circle-trio:display', CIRCLE_FIELDS)

export const DEFAULT_OPTIONS = CIRCLE_OPTIONS.defaults

/** With no fill, the outlines are all there is, so they're always drawn. */
export const outlinesShown = (options: CircleOptions) => options.showOutlines || noFill(options)
