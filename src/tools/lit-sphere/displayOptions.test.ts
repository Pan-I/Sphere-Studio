import { describe, expect, it } from 'vitest'
import { parseOptions } from '../shared/options'
import { DEFAULT_OPTIONS, LIT_SPHERE_OPTIONS } from './displayOptions'

const { fields } = LIT_SPHERE_OPTIONS
const parse = (raw: string | null) => parseOptions(fields, raw)

describe('Lit Sphere options', () => {
    it('defaults to grayscale values with the light direction shown', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            shading: 'grayscale',
            lineWidth: 2,
            flatValues: false,
            showShadowEdges: false,
            showLight: true,
            showLabels: false,
        })
    })

    it('reads back what it saves', () => {
        const opts = {
            shading: 'color',
            lineWidth: 5,
            flatValues: true,
            showShadowEdges: true,
            showLight: false,
            showLabels: true,
        } as const
        expect(parse(JSON.stringify(opts))).toEqual(opts)
    })

    it('greys out the shading options in lines only, where the shadow edges are always drawn', () => {
        const linesOnly = { ...DEFAULT_OPTIONS, shading: 'none' } as const
        expect(fields.flatValues.disabledWhen?.(linesOnly)).toBe(true)
        expect(fields.showShadowEdges.disabledWhen?.(linesOnly)).toBe(true)
        expect(fields.showShadowEdges.checkedWhenDisabled).toBe(true)
        expect(fields.flatValues.disabledWhen?.(DEFAULT_OPTIONS)).toBe(false)
    })
})
