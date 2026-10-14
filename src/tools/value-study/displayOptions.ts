import { defineOptions, toggleField } from '../shared/options'

export type View = 'values' | 'grayscale' | 'original'
export type ValueCount = '3' | '5' | '7'

export const VIEWS: readonly View[] = ['values', 'grayscale', 'original']
export const VALUE_COUNTS: readonly ValueCount[] = ['3', '5', '7']

export interface ValueStudyOptions {
    view: View
    valueCount: ValueCount
    simplify: number
    stretch: boolean
    outlineShapes: boolean
    showScale: boolean
}

/** Simplify only changes the grouped values, so it does nothing in grayscale or the original without outlines. */
const showsGroups = (o: ValueStudyOptions) => o.view === 'values' || o.outlineShapes

/** The Display panel, in order. Also gives the defaults and how the options are saved. */
export const VALUE_STUDY_OPTIONS = defineOptions<ValueStudyOptions>(
    'sphere-studio:value-study:display',
    {
        view: {
            kind: 'choice',
            label: 'Show',
            default: 'values',
            choices: [
                { value: 'values', label: 'Values' },
                { value: 'grayscale', label: 'Grayscale' },
                { value: 'original', label: 'Original' },
            ],
        },
        valueCount: {
            kind: 'choice',
            label: 'Number of values',
            default: '5',
            choices: VALUE_COUNTS.map((n) => ({ value: n, label: `${n} values` })),
        },
        // Like squinting: small details merge into the big shapes before the values are grouped.
        simplify: {
            kind: 'range',
            label: 'Simplify (squint)',
            default: 2,
            min: 0,
            max: 10,
            step: 1,
            unit: 'px',
            disabledWhen: (o) => !showsGroups(o),
        },
        // On, so a flat or hazy photo still splits into every value. Off shows the photo's own range.
        stretch: toggleField('Stretch to full range', true),
        outlineShapes: toggleField('Outline the value shapes', false),
        showScale: toggleField('Show value scale', true),
    },
)

export const DEFAULT_OPTIONS = VALUE_STUDY_OPTIONS.defaults

/** The view after `view`, for the V shortcut. */
export const nextView = (view: View): View => VIEWS[(VIEWS.indexOf(view) + 1) % VIEWS.length]
