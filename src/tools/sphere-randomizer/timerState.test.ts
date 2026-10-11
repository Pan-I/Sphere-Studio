import { describe, expect, it } from 'vitest'
import { initialTimerState, timerReducer, type TimerState } from './timerState'

const running = (remaining: number, seed = 7): TimerState => ({
    seed,
    running: true,
    countdown: { remaining, fired: false },
})

describe('initialTimerState', () => {
    it('starts stopped with no countdown', () => {
        expect(initialTimerState(42)).toEqual({ seed: 42, running: false, countdown: null })
    })
})

describe('timerReducer', () => {
    describe('tick', () => {
        it('swaps the seed and resets the countdown when it fires', () => {
            const next = timerReducer(running(1), { type: 'tick', interval: 30, nextSeed: 99 })
            expect(next.seed).toBe(99)
            expect(next.countdown).toEqual({ remaining: 30, fired: true })
        })

        it('keeps the seed when it does not fire', () => {
            const next = timerReducer(running(5), { type: 'tick', interval: 30, nextSeed: 99 })
            expect(next.seed).toBe(7)
            expect(next.countdown).toEqual({ remaining: 4, fired: false })
        })

        it('does nothing without a countdown', () => {
            const state = initialTimerState(7)
            expect(timerReducer(state, { type: 'tick', interval: 30, nextSeed: 99 })).toBe(state)
        })

        it('does not modify the state it was given', () => {
            const state = running(1)
            timerReducer(state, { type: 'tick', interval: 30, nextSeed: 99 })
            expect(state).toEqual(running(1))
        })
    })

    describe('showSeed', () => {
        it('restarts the countdown while running', () => {
            const next = timerReducer(running(3), { type: 'showSeed', seed: 12, interval: 30 })
            expect(next.seed).toBe(12)
            expect(next.countdown).toEqual({ remaining: 30, fired: false })
        })

        it('leaves a paused countdown alone', () => {
            const paused = { ...running(3), running: false }
            const next = timerReducer(paused, { type: 'showSeed', seed: 12, interval: 30 })
            expect(next.seed).toBe(12)
            expect(next.countdown).toEqual({ remaining: 3, fired: false })
        })

        it('does not start a countdown when the timer was never started', () => {
            const next = timerReducer(initialTimerState(7), {
                type: 'showSeed',
                seed: 12,
                interval: 30,
            })
            expect(next).toEqual({ seed: 12, running: false, countdown: null })
        })
    })

    describe('start and pause', () => {
        it('starts a fresh countdown at the full interval', () => {
            const next = timerReducer(initialTimerState(7), { type: 'start', interval: 30 })
            expect(next).toEqual({
                seed: 7,
                running: true,
                countdown: { remaining: 30, fired: false },
            })
        })

        it('pauses without losing the time left, and resumes from it', () => {
            const paused = timerReducer(running(3), { type: 'pause' })
            expect(paused.running).toBe(false)
            expect(paused.countdown).toEqual({ remaining: 3, fired: false })

            const resumed = timerReducer(paused, { type: 'start', interval: 30 })
            expect(resumed.running).toBe(true)
            expect(resumed.countdown).toEqual({ remaining: 3, fired: false })
        })
    })

    describe('intervalChanged', () => {
        it('clears the countdown and keeps the seed', () => {
            const paused = { ...running(3), running: false }
            const next = timerReducer(paused, { type: 'intervalChanged' })
            expect(next).toEqual({ seed: 7, running: false, countdown: null })
        })
    })
})
