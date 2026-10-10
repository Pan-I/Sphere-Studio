import { describe, expect, it } from 'vitest'
import {
    DEFAULT_OPTIONS,
    LINE_WIDTH_MAX,
    LINE_WIDTH_MIN,
    clampLineWidth,
    parseOptions,
} from './displayOptions'

describe('clampLineWidth', () => {
    it('rounds to whole pixels and clamps to the allowed range', () => {
        expect(clampLineWidth(3.6)).toBe(4)
        expect(clampLineWidth(0)).toBe(LINE_WIDTH_MIN)
        expect(clampLineWidth(-5)).toBe(LINE_WIDTH_MIN)
        expect(clampLineWidth(99)).toBe(LINE_WIDTH_MAX)
    })

    it('falls back to the default for non-finite input', () => {
        expect(clampLineWidth(NaN)).toBe(DEFAULT_OPTIONS.lineWidth)
        expect(clampLineWidth(Infinity)).toBe(DEFAULT_OPTIONS.lineWidth)
    })
})

describe('parseOptions', () => {
    it('returns defaults for missing or unparseable input', () => {
        for (const raw of [null, '', 'not json', '{', 'null', '42', '[]', '"text"']) {
            expect(parseOptions(raw)).toEqual(DEFAULT_OPTIONS)
        }
    })

    it('round-trips valid options', () => {
        const opts = {
            shading: 'grayscale',
            lineWidth: 5,
            showFarSide: false,
            showMarker: false,
        } as const
        expect(parseOptions(JSON.stringify(opts))).toEqual(opts)
    })

    it('fills in defaults for missing fields', () => {
        expect(parseOptions('{"shading":"none"}')).toEqual({ ...DEFAULT_OPTIONS, shading: 'none' })
    })

    it('replaces invalid fields individually and keeps the valid ones', () => {
        const raw = JSON.stringify({ shading: 'neon', lineWidth: '5', showFarSide: false })
        expect(parseOptions(raw)).toEqual({ ...DEFAULT_OPTIONS, showFarSide: false })
    })

    it('clamps out-of-range line widths', () => {
        expect(parseOptions('{"lineWidth":500}').lineWidth).toBe(LINE_WIDTH_MAX)
        expect(parseOptions('{"lineWidth":-1}').lineWidth).toBe(LINE_WIDTH_MIN)
    })

    it('turns the marker on by default, including for older stored options without it', () => {
        expect(DEFAULT_OPTIONS.showMarker).toBe(true)
        expect(
            parseOptions('{"shading":"color","lineWidth":2,"showFarSide":true}').showMarker,
        ).toBe(true)
    })

    it('never hands out the shared default object', () => {
        expect(parseOptions(null)).not.toBe(DEFAULT_OPTIONS)
    })
})
