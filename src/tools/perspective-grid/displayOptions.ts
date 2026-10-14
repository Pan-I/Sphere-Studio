import { defineOptions, lineWidthField, toggleField, type ChoiceField } from '../shared/options'
import type { PointsChoice } from './pose'

export type GridColors = 'color' | 'grayscale'

export interface PerspectiveGridOptions {
    points: PointsChoice
    colors: GridColors
    lineWidth: number
    gridLines: number
    showHorizon: boolean
    showLabels: boolean
    showBox: boolean
}

export const POINTS_FIELD: ChoiceField<PerspectiveGridOptions, PointsChoice> = {
    kind: 'choice',
    label: 'Vanishing points',
    default: 'any',
    choices: [
        { value: 'any', label: 'Any (1, 2 or 3)' },
        { value: '1', label: '1 point' },
        { value: '2', label: '2 point' },
        { value: '3', label: '3 point' },
    ],
}

/** The Display panel, in order. Also gives the defaults and how the options are saved. */
export const PERSPECTIVE_GRID_OPTIONS = defineOptions<PerspectiveGridOptions>(
    'sphere-studio:perspective-grid:display',
    {
        points: POINTS_FIELD,
        colors: {
            kind: 'choice',
            label: 'Grid colors',
            default: 'color',
            choices: [
                { value: 'color', label: 'One per point' },
                { value: 'grayscale', label: 'Grayscale' },
            ],
        },
        lineWidth: lineWidthField(),
        gridLines: {
            kind: 'range',
            label: 'Grid lines per point',
            default: 10,
            min: 0,
            max: 24,
            step: 1,
            unit: '',
        },
        showHorizon: toggleField('Show horizon line', true),
        showLabels: toggleField('Label the points', true),
        showBox: toggleField('Show a sample box', false),
    },
)

export const DEFAULT_OPTIONS = PERSPECTIVE_GRID_OPTIONS.defaults
