import { defineOptions, lineWidthField, toggleField, type ChoiceField } from '../shared/options'
import type { LensChoice } from './pose'

export type GridColors = 'color' | 'grayscale'

export interface CurvilinearGridOptions {
    lens: LensChoice
    colors: GridColors
    lineWidth: number
    gridLines: number
    showHorizon: boolean
    showLabels: boolean
    showBox: boolean
}

export const LENS_FIELD: ChoiceField<CurvilinearGridOptions, LensChoice> = {
    kind: 'choice',
    label: 'Lens',
    default: 'any',
    choices: [
        { value: 'any', label: 'Any' },
        { value: 'fisheye', label: 'Fish-eye (5 point)' },
        { value: 'panoramic', label: 'Panoramic (4 point)' },
    ],
}

/** The Display panel, in order. Also gives the defaults and how the options are saved. */
export const CURVILINEAR_GRID_OPTIONS = defineOptions<CurvilinearGridOptions>(
    'sphere-studio:curvilinear-grid:display',
    {
        lens: LENS_FIELD,
        colors: {
            kind: 'choice',
            label: 'Grid colors',
            default: 'color',
            choices: [
                { value: 'color', label: 'One per direction' },
                { value: 'grayscale', label: 'Grayscale' },
            ],
        },
        lineWidth: lineWidthField(),
        gridLines: {
            kind: 'range',
            label: 'Grid lines per direction',
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

export const DEFAULT_OPTIONS = CURVILINEAR_GRID_OPTIONS.defaults
