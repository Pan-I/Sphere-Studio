import { describe, expect, it } from 'vitest'
import { parseOptions } from '../shared/options'
import { BOX_OPTIONS, DEFAULT_OPTIONS } from './displayOptions'

const parse = (raw: string | null) => parseOptions(BOX_OPTIONS.fields, raw)

describe('Box Randomizer options', () => {
    it('defaults to shaded faces in perspective, with hidden edges and no center lines', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            shading: 'color',
            lineWidth: 2,
            perspective: true,
            showHiddenEdges: true,
            showCenterLines: false,
        })
    })

    it('reads back what it saves', () => {
        const opts = {
            shading: 'grayscale',
            lineWidth: 6,
            perspective: false,
            showHiddenEdges: false,
            showCenterLines: true,
        } as const
        expect(parse(JSON.stringify(opts))).toEqual(opts)
    })
})
