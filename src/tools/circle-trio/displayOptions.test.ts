import { describe, expect, it } from 'vitest'
import { parseOptions } from '../shared/options'
import { CIRCLE_OPTIONS, DEFAULT_OPTIONS, outlinesShown } from './displayOptions'

const parse = (raw: string | null) => parseOptions(CIRCLE_OPTIONS.fields, raw)

describe('outlinesShown', () => {
    it('follows the setting when there is a fill', () => {
        expect(outlinesShown({ ...DEFAULT_OPTIONS, showOutlines: false })).toBe(false)
        expect(outlinesShown({ ...DEFAULT_OPTIONS, showOutlines: true })).toBe(true)
    })

    it('always draws outlines when there is no fill, so something is visible', () => {
        expect(outlinesShown({ ...DEFAULT_OPTIONS, fill: 'none', showOutlines: false })).toBe(true)
    })
})

describe('Circle Trio options', () => {
    it('has the same defaults as before the shared panel', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            fill: 'color',
            opacity: 35,
            lineWidth: 2,
            showOutlines: true,
            showCenters: false,
        })
    })

    it('reads options saved by earlier versions', () => {
        const opts = {
            fill: 'grayscale',
            opacity: 50,
            lineWidth: 4,
            showOutlines: false,
            showCenters: true,
        } as const
        expect(parse(JSON.stringify(opts))).toEqual(opts)
    })

    it('keeps opacity within 15% to 60%', () => {
        expect(parse('{"opacity":500}').opacity).toBe(60)
        expect(parse('{"opacity":0}').opacity).toBe(15)
    })

    it('greys out opacity and outlines when there is no fill', () => {
        const none = { ...DEFAULT_OPTIONS, fill: 'none' } as const
        expect(CIRCLE_OPTIONS.fields.opacity.disabledWhen?.(none)).toBe(true)
        expect(CIRCLE_OPTIONS.fields.showOutlines.disabledWhen?.(none)).toBe(true)
        expect(CIRCLE_OPTIONS.fields.opacity.disabledWhen?.(DEFAULT_OPTIONS)).toBe(false)
    })
})
