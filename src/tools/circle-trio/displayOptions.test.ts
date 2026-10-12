import { describe, expect, it } from 'vitest'
import {
    DEFAULT_OPTIONS,
    OPACITY_MAX,
    OPACITY_MIN,
    clampOpacity,
    outlinesShown,
    parseOptions,
} from './displayOptions'

describe('clampOpacity', () => {
    it('rounds to whole percents and clamps to the allowed range', () => {
        expect(clampOpacity(33.6)).toBe(34)
        expect(clampOpacity(0)).toBe(OPACITY_MIN)
        expect(clampOpacity(100)).toBe(OPACITY_MAX)
    })

    it('falls back to the default for non-finite input', () => {
        expect(clampOpacity(NaN)).toBe(DEFAULT_OPTIONS.opacity)
    })
})

describe('outlinesShown', () => {
    it('follows the setting when there is a fill', () => {
        expect(outlinesShown({ ...DEFAULT_OPTIONS, showOutlines: false })).toBe(false)
        expect(outlinesShown({ ...DEFAULT_OPTIONS, showOutlines: true })).toBe(true)
    })

    it('always draws outlines when there is no fill, so something is visible', () => {
        expect(outlinesShown({ ...DEFAULT_OPTIONS, fill: 'none', showOutlines: false })).toBe(true)
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
            fill: 'grayscale',
            opacity: 50,
            lineWidth: 4,
            showOutlines: false,
            showCenters: true,
        } as const
        expect(parseOptions(JSON.stringify(opts))).toEqual(opts)
    })

    it('replaces invalid fields individually and keeps the valid ones', () => {
        const raw = JSON.stringify({ fill: 'neon', opacity: '50', showCenters: true })
        expect(parseOptions(raw)).toEqual({ ...DEFAULT_OPTIONS, showCenters: true })
    })

    it('clamps out-of-range opacity', () => {
        expect(parseOptions('{"opacity":500}').opacity).toBe(OPACITY_MAX)
    })

    it('never hands out the shared default object', () => {
        expect(parseOptions(null)).not.toBe(DEFAULT_OPTIONS)
    })
})
