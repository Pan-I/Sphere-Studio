import { describe, expect, it } from 'vitest'
import {
    LINE_WIDTH_MAX,
    LINE_WIDTH_MIN,
    clampToRange,
    colorModeField,
    defaultsOf,
    defineOptions,
    lineWidthField,
    parseOptions,
    sameOptions,
    toggleField,
    type OptionFields,
} from './options'

interface Opts {
    mode: 'color' | 'grayscale' | 'none'
    width: number
    show: boolean
}

const fields: OptionFields<Opts> = {
    mode: colorModeField('Mode', 'None'),
    width: lineWidthField(),
    show: toggleField('Show', true),
}
const DEFAULTS: Opts = { mode: 'color', width: 2, show: true }

describe('clampToRange', () => {
    const width = lineWidthField()

    it('rounds to whole numbers and clamps to the field range', () => {
        expect(clampToRange(width, 3.6)).toBe(4)
        expect(clampToRange(width, 0)).toBe(LINE_WIDTH_MIN)
        expect(clampToRange(width, 99)).toBe(LINE_WIDTH_MAX)
    })

    it('falls back to the default for non-finite input', () => {
        expect(clampToRange(width, NaN)).toBe(width.default)
        expect(clampToRange(width, Infinity)).toBe(width.default)
    })
})

describe('defaultsOf', () => {
    it('collects each field default', () => {
        expect(defaultsOf(fields)).toEqual(DEFAULTS)
    })
})

describe('parseOptions', () => {
    it('returns defaults for missing or unparseable input', () => {
        for (const raw of [null, '', 'not json', '{', 'null', '42', '[]', '"text"']) {
            expect(parseOptions(fields, raw)).toEqual(DEFAULTS)
        }
    })

    it('round-trips valid options', () => {
        const opts: Opts = { mode: 'grayscale', width: 5, show: false }
        expect(parseOptions(fields, JSON.stringify(opts))).toEqual(opts)
    })

    it('replaces invalid fields individually and keeps the valid ones', () => {
        const raw = JSON.stringify({ mode: 'neon', width: '5', show: false })
        expect(parseOptions(fields, raw)).toEqual({ ...DEFAULTS, show: false })
    })

    it('clamps out-of-range numbers and drops unknown keys', () => {
        expect(parseOptions(fields, '{"width":500,"extra":1}')).toEqual({
            ...DEFAULTS,
            width: LINE_WIDTH_MAX,
        })
    })
})

describe('sameOptions', () => {
    it('compares every field', () => {
        expect(sameOptions(fields, { ...DEFAULTS }, DEFAULTS)).toBe(true)
        expect(sameOptions(fields, { ...DEFAULTS, width: 3 }, DEFAULTS)).toBe(false)
        expect(sameOptions(fields, { ...DEFAULTS, show: false }, DEFAULTS)).toBe(false)
    })
})

describe('defineOptions', () => {
    it('saves and loads through localStorage, under the given key', () => {
        const store = new Map<string, string>()
        const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: {
                localStorage: {
                    getItem: (k: string) => store.get(k) ?? null,
                    setItem: (k: string, v: string) => store.set(k, v),
                    removeItem: (k: string) => store.delete(k),
                },
            },
        })
        try {
            const set = defineOptions('test:key', fields)
            expect(set.load()).toEqual(DEFAULTS)
            set.save({ mode: 'none', width: 7, show: false })
            expect(JSON.parse(store.get('test:key')!)).toEqual({
                mode: 'none',
                width: 7,
                show: false,
            })
            expect(set.load()).toEqual({ mode: 'none', width: 7, show: false })
            set.save({ ...DEFAULTS })
            expect(store.has('test:key')).toBe(false) // back at the defaults: nothing stored
            expect(set.load()).toEqual(DEFAULTS)
        } finally {
            if (original) Object.defineProperty(globalThis, 'window', original)
            else delete (globalThis as { window?: unknown }).window
        }
    })

    it('hands out fresh defaults, never the shared frozen object', () => {
        const set = defineOptions('test:key', fields)
        expect(Object.isFrozen(set.defaults)).toBe(true)
        expect(parseOptions(fields, null)).not.toBe(set.defaults)
    })
})
