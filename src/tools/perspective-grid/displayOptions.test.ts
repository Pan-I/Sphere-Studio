import { describe, expect, it } from 'vitest'
import { parseOptions } from '../shared/options'
import { DEFAULT_OPTIONS, PERSPECTIVE_GRID_OPTIONS } from './displayOptions'

const parse = (raw: string | null) => parseOptions(PERSPECTIVE_GRID_OPTIONS.fields, raw)

describe('Perspective Grid options', () => {
    it('defaults to any number of points, colored grids, the horizon and labels, no box', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            points: 'any',
            colors: 'color',
            lineWidth: 2,
            gridLines: 10,
            showHorizon: true,
            showLabels: true,
            showBox: false,
        })
    })

    it('reads back what it saves', () => {
        const opts = {
            points: '3',
            colors: 'grayscale',
            lineWidth: 4,
            gridLines: 0,
            showHorizon: false,
            showLabels: false,
            showBox: true,
        } as const
        expect(parse(JSON.stringify(opts))).toEqual(opts)
    })

    it('falls back to the defaults for a number of points it does not know', () => {
        expect(parse(JSON.stringify({ points: '4' })).points).toBe('any')
    })
})
