import { describe, expect, it } from 'vitest'
import { MAX_SECONDS, parseInterval, tick, type Countdown } from './countdown'

describe('parseInterval', () => {
    it('accepts whole numbers in range, ignoring surrounding spaces', () => {
        expect(parseInterval('30')).toBe(30)
        expect(parseInterval(' 5 ')).toBe(5)
        expect(parseInterval('1')).toBe(1)
        expect(parseInterval(String(MAX_SECONDS))).toBe(MAX_SECONDS)
    })

    it('rejects empty, zero, negative, decimal, and non-numeric input', () => {
        for (const bad of ['', '  ', '0', '-5', '2.5', 'abc', '1e2', '10s']) {
            expect(parseInterval(bad)).toBeNull()
        }
    })

    it('rejects values above the maximum', () => {
        expect(parseInterval(String(MAX_SECONDS + 1))).toBeNull()
    })
})

describe('tick', () => {
    it('counts down without firing', () => {
        expect(tick({ remaining: 5, fired: false }, 5)).toEqual({ remaining: 4, fired: false })
    })

    it('fires and resets to the full interval when time runs out', () => {
        expect(tick({ remaining: 1, fired: false }, 5)).toEqual({ remaining: 5, fired: true })
    })

    it('fires on every tick when the interval is 1 second', () => {
        expect(tick({ remaining: 1, fired: false }, 1)).toEqual({ remaining: 1, fired: true })
    })

    it('fires exactly once per interval over a full run', () => {
        let c: Countdown = { remaining: 3, fired: false }
        let fires = 0
        for (let i = 0; i < 7; i++) {
            c = tick(c, 3)
            if (c.fired) fires++
        }
        expect(fires).toBe(2) // on ticks 3 and 6
    })
})