import { describe, expect, it } from 'vitest'
import { parseOptions } from '../shared/options'
import { DEFAULT_OPTIONS, VALUE_STUDY_OPTIONS, nextView } from './displayOptions'

const { fields } = VALUE_STUDY_OPTIONS
const parse = (raw: string | null) => parseOptions(fields, raw)

describe('Value Study options', () => {
    it('defaults to five values, stretched and a little simplified, with the scale shown', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            view: 'values',
            valueCount: '5',
            simplify: 2,
            stretch: true,
            outlineShapes: false,
            showScale: true,
        })
    })

    it('reads back what it saves', () => {
        const opts = {
            view: 'original',
            valueCount: '7',
            simplify: 6,
            stretch: false,
            outlineShapes: true,
            showScale: false,
        } as const
        expect(parse(JSON.stringify(opts))).toEqual(opts)
    })

    it('only offers 3, 5 or 7 values', () => {
        expect(parse(JSON.stringify({ valueCount: '4' })).valueCount).toBe('5')
        expect(parse(JSON.stringify({ valueCount: 3 })).valueCount).toBe('5')
    })

    it('greys out Simplify when nothing grouped is shown', () => {
        const off = (o: Partial<typeof DEFAULT_OPTIONS>) =>
            fields.simplify.disabledWhen?.({ ...DEFAULT_OPTIONS, ...o })
        expect(off({ view: 'values' })).toBe(false)
        expect(off({ view: 'grayscale' })).toBe(true)
        expect(off({ view: 'original', outlineShapes: true })).toBe(false)
    })

    it('cycles through the views', () => {
        expect(nextView('values')).toBe('grayscale')
        expect(nextView('grayscale')).toBe('original')
        expect(nextView('original')).toBe('values')
    })
})
