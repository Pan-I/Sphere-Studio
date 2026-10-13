import {
    colorModeField,
    defineOptions,
    lineWidthField,
    toggleField,
    type ColorMode,
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

/** The Display panel, in order. Also gives the defaults and how the options are saved. */
export const CIRCLE_OPTIONS = defineOptions<CircleOptions>('sphere-studio:circle-trio:display', {
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
})

export const DEFAULT_OPTIONS = CIRCLE_OPTIONS.defaults

/** With no fill, the outlines are all there is, so they're always drawn. */
export const outlinesShown = (options: CircleOptions) => options.showOutlines || noFill(options)
