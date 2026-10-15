import { describe, expect, it } from 'vitest'
import { parseOptions } from '../shared/options'
import { CURVILINEAR_GRID_OPTIONS, DEFAULT_OPTIONS } from './displayOptions'

const parse = (raw: string | null) => parseOptions(CURVILINEAR_GRID_OPTIONS.fields, raw)

describe('Curvilinear Grid options', () => {
    it('defaults to any lens, colored grids, the horizon and labels, no box', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            lens: 'any',
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
            lens: 'panoramic',
            colors: 'grayscale',
            lineWidth: 4,
            gridLines: 0,
            showHorizon: false,
            showLabels: false,
            showBox: true,
        } as const
        expect(parse(JSON.stringify(opts))).toEqual(opts)
    })

    it('falls back to the defaults for a lens it does not know', () => {
        expect(parse(JSON.stringify({ lens: 'tilt-shift' })).lens).toBe('any')
    })
})
