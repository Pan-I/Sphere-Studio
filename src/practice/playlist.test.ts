// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { PRACTICE_TOOLS, TOOLS } from '../tools/registry'
import {
    DEFAULT_SESSION,
    MAX_STEPS,
    PRACTICE_KEY,
    PRESETS,
    formatDuration,
    loadDrafts,
    parseDrafts,
    parsePoses,
    parseSession,
    parseStep,
    saveDrafts,
    toDraft,
    totalPoses,
    totalSeconds,
} from './playlist'

const SLUGS = ['sphere-randomizer', 'circle-trio-1']
const draft = (tool: string, poses: string, seconds: string) => ({ tool, poses, seconds })

describe('parsePoses', () => {
    it('takes whole numbers from 1 to 50', () => {
        expect(parsePoses('1')).toBe(1)
        expect(parsePoses(' 50 ')).toBe(50)
        expect(parsePoses('0')).toBeNull()
        expect(parsePoses('51')).toBeNull()
        expect(parsePoses('2.5')).toBeNull()
        expect(parsePoses('')).toBeNull()
    })
})

describe('parseStep and parseSession', () => {
    it('reads a valid step', () => {
        expect(parseStep(draft('sphere-randomizer', '5', '60'), SLUGS)).toEqual({
            tool: 'sphere-randomizer',
            poses: 5,
            seconds: 60,
        })
    })

    it('rejects bad numbers and tools that are not offered', () => {
        expect(parseStep(draft('sphere-randomizer', '5', '0'), SLUGS)).toBeNull()
        expect(parseStep(draft('sphere-randomizer', 'x', '60'), SLUGS)).toBeNull()
        expect(parseStep(draft('value-study', '5', '60'), SLUGS)).toBeNull()
    })

    it('needs every step valid and at least one step', () => {
        const good = draft('sphere-randomizer', '5', '60')
        expect(parseSession([good, draft('circle-trio-1', '5', '90')], SLUGS)).toHaveLength(2)
        expect(parseSession([good, draft('circle-trio-1', '', '90')], SLUGS)).toBeNull()
        expect(parseSession([], SLUGS)).toBeNull()
    })
})

describe('totals', () => {
    it('counts poses and the time they take', () => {
        const steps = PRESETS[0].steps
        expect(totalPoses(steps)).toBe(10)
        expect(totalSeconds(steps)).toBe(5 * 60 + 5 * 90)
    })

    it('formats durations briefly', () => {
        expect(formatDuration(45)).toBe('45 s')
        expect(formatDuration(60)).toBe('1 min')
        expect(formatDuration(750)).toBe('12 min 30 s')
        expect(formatDuration(3600)).toBe('1 h')
        expect(formatDuration(3900)).toBe('1 h 5 min')
        expect(formatDuration(8.4)).toBe('8 s')
    })
})

describe('presets', () => {
    it('starts with the idea list example: 5 spheres at 60s, then 5 trios at 90s', () => {
        expect(DEFAULT_SESSION).toEqual([
            draft('sphere-randomizer', '5', '60'),
            draft('circle-trio-1', '5', '90'),
        ])
    })

    it('only use tools a session can run', () => {
        const slugs = PRACTICE_TOOLS.map((t) => t.slug)
        for (const preset of PRESETS) {
            expect(parseSession(preset.steps.map(toDraft), slugs)).not.toBeNull()
        }
    })

    it('leaves Value Study out, since it works on your own photo', () => {
        expect(PRACTICE_TOOLS.map((t) => t.slug)).not.toContain('value-study')
        expect(PRACTICE_TOOLS.length).toBe(TOOLS.length - 1)
    })
})

describe('parseDrafts', () => {
    it('gives the default session for nothing, bad JSON or an empty list', () => {
        expect(parseDrafts(null, SLUGS)).toEqual(DEFAULT_SESSION)
        expect(parseDrafts('{oops', SLUGS)).toEqual(DEFAULT_SESSION)
        expect(parseDrafts('[]', SLUGS)).toEqual(DEFAULT_SESSION)
        expect(parseDrafts('{"tool":"x"}', SLUGS)).toEqual(DEFAULT_SESSION)
    })

    it('keeps half-typed numbers and drops steps for tools that are gone', () => {
        const raw = JSON.stringify([
            { tool: 'circle-trio-1', poses: '', seconds: 45 },
            { tool: 'retired-tool', poses: '5', seconds: '60' },
            'junk',
        ])
        expect(parseDrafts(raw, SLUGS)).toEqual([draft('circle-trio-1', '', '45')])
    })

    it(`keeps at most ${MAX_STEPS} steps`, () => {
        const raw = JSON.stringify(Array(MAX_STEPS + 5).fill(draft('circle-trio-1', '1', '1')))
        expect(parseDrafts(raw, SLUGS)).toHaveLength(MAX_STEPS)
    })
})

describe('saving', () => {
    afterEach(() => window.localStorage.clear())

    it('round-trips through localStorage', () => {
        const drafts = [draft('circle-trio-1', '3', '20')]
        saveDrafts(drafts)
        expect(window.localStorage.getItem(PRACTICE_KEY)).not.toBeNull()
        expect(loadDrafts(SLUGS)).toEqual(drafts)
    })
})
