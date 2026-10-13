import { describe, expect, it } from 'vitest'
import { parseOptions } from '../shared/options'
import { CYLINDER_OPTIONS, DEFAULT_OPTIONS } from './displayOptions'

const parse = (raw: string | null) => parseOptions(CYLINDER_OPTIONS.fields, raw)

describe('Cylinder Randomizer options', () => {
    it('defaults to shaded in perspective, with hidden edges and the axis but no center lines', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            shading: 'color',
            lineWidth: 2,
            perspective: true,
            showHiddenEdges: true,
            showAxis: true,
            showCenterLines: false,
        })
    })

    it('reads back what it saves', () => {
        const opts = {
            shading: 'grayscale',
            lineWidth: 6,
            perspective: false,
            showHiddenEdges: false,
            showAxis: false,
            showCenterLines: true,
        } as const
        expect(parse(JSON.stringify(opts))).toEqual(opts)
    })
})
