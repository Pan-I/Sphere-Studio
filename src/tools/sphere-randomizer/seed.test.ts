import { describe, expect, it } from 'vitest'
import { rotate } from '../../math/quat'
import { sectorOf } from '../../math/sphere'
import {
    MAX_SEED, buildShareUrl, parseSeed, quatFromSeed, randomSeed, readSeedFromUrl,
} from './seed'

describe('parseSeed', () => {
    it('accepts whole numbers in range, ignoring surrounding spaces', () => {
        expect(parseSeed('0')).toBe(0)
        expect(parseSeed(' 4821 ')).toBe(4821)
        expect(parseSeed(String(MAX_SEED))).toBe(MAX_SEED)
    })

    it('rejects empty, negative, decimal, non-numeric, and out-of-range input', () => {
        for (const bad of ['', '  ', '-1', '2.5', 'abc', '1e3', '12a', String(MAX_SEED + 1)]) {
            expect(parseSeed(bad)).toBeNull()
        }
    })
})

describe('randomSeed', () => {
    it('stays within 0..MAX_SEED, including at the extremes of the RNG', () => {
        expect(randomSeed(() => 0)).toBe(0)
        expect(randomSeed(() => 0.9999999999)).toBe(MAX_SEED)
    })

    it('always returns an integer that parseSeed accepts', () => {
        for (let i = 0; i < 1000; i++) {
            const s = randomSeed()
            expect(Number.isInteger(s)).toBe(true)
            expect(parseSeed(String(s))).toBe(s)
        }
    })
})

describe('quatFromSeed', () => {
    it('is deterministic', () => {
        expect(quatFromSeed(1234)).toEqual(quatFromSeed(1234))
    })

    it('gives different orientations for different seeds', () => {
        expect(quatFromSeed(1)).not.toEqual(quatFromSeed(2))
    })

    it('returns unit quaternions', () => {
        for (const seed of [0, 1, 999_999]) {
            expect(Math.hypot(...quatFromSeed(seed))).toBeCloseTo(1)
        }
    })

    it('spreads consecutive seeds evenly across all eight sectors', () => {
        const counts = new Array(8).fill(0)
        const n = 8000
        for (let seed = 0; seed < n; seed++) {
            counts[sectorOf(rotate(quatFromSeed(seed), [0, 0, 1]))]++
        }
        for (const c of counts) {
            expect(c / n).toBeGreaterThan(0.09) // expected 0.125
            expect(c / n).toBeLessThan(0.16)
        }
    })
})

describe('readSeedFromUrl', () => {
    it('reads a valid seed', () => {
        expect(readSeedFromUrl('?seed=42')).toBe(42)
        expect(readSeedFromUrl('?other=1&seed=9')).toBe(9)
    })

    it('returns null when missing or invalid', () => {
        for (const search of ['', '?', '?seed=', '?seed=abc', '?seed=-3', '?seed=99999999']) {
            expect(readSeedFromUrl(search)).toBeNull()
        }
    })
})

describe('buildShareUrl', () => {
    it('adds the seed to a URL without one', () => {
        expect(buildShareUrl('https://example.com/', 7)).toBe('https://example.com/?seed=7')
    })

    it('replaces an existing seed and keeps other params and the hash', () => {
        const out = buildShareUrl('https://example.com/tool?a=1&seed=5#top', 8)
        const url = new URL(out)
        expect(url.searchParams.get('seed')).toBe('8')
        expect(url.searchParams.get('a')).toBe('1')
        expect(url.hash).toBe('#top')
    })

    it('round-trips with readSeedFromUrl', () => {
        for (const seed of [0, 1234, MAX_SEED]) {
            const url = new URL(buildShareUrl('http://localhost:5173/', seed))
            expect(readSeedFromUrl(url.search)).toBe(seed)
        }
    })
})