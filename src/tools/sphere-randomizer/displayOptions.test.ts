import { describe, expect, it } from 'vitest'
import { parseOptions } from '../shared/options'
import { DEFAULT_OPTIONS, SPHERE_OPTIONS } from './displayOptions'

const parse = (raw: string | null) => parseOptions(SPHERE_OPTIONS.fields, raw)

describe('Sphere Randomizer options', () => {
    it('has the same defaults as before the shared panel', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            shading: 'color',
            lineWidth: 2,
            showFarSide: true,
            showMarker: true,
        })
    })

    it('reads options saved by earlier versions', () => {
        const opts = {
            shading: 'grayscale',
            lineWidth: 5,
            showFarSide: false,
            showMarker: false,
        } as const
        expect(parse(JSON.stringify(opts))).toEqual(opts)
    })

    it('turns the marker on for older stored options without it', () => {
        expect(parse('{"shading":"color","lineWidth":2,"showFarSide":true}').showMarker).toBe(true)
    })
})
