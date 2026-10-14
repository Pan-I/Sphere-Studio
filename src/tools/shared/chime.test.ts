// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    CHIME_KEY,
    loadChime,
    parseChime,
    playChime,
    resetAudioForTests,
    saveChime,
    unlockAudio,
} from './chime'

/** Just enough of an AudioContext to count the notes played. */
class FakeAudioContext {
    static made: FakeAudioContext[] = []
    state: AudioContextState = 'suspended'
    currentTime = 0
    destination = {}
    started: number[] = []
    resume = vi.fn(async () => {
        this.state = 'running'
    })
    constructor() {
        FakeAudioContext.made.push(this)
    }
    createGain() {
        const param = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
        return { gain: param, connect: (node: unknown) => node }
    }
    createOscillator() {
        return {
            type: 'sine',
            frequency: { value: 0 },
            connect: (node: unknown) => node,
            start: () => {},
            stop: () => {},
        }
    }
}

beforeEach(() => {
    window.localStorage.clear()
    resetAudioForTests()
    FakeAudioContext.made = []
})
afterEach(() => {
    vi.unstubAllGlobals()
})

describe('chime setting', () => {
    it('is on unless it was turned off', () => {
        expect(parseChime(null)).toBe(true)
        expect(parseChime('off')).toBe(false)
        expect(parseChime('garbage')).toBe(true)
    })

    it('is saved in the browser, and on again leaves nothing stored', () => {
        expect(loadChime()).toBe(true)
        saveChime(false)
        expect(window.localStorage.getItem(CHIME_KEY)).toBe('off')
        expect(loadChime()).toBe(false)
        saveChime(true)
        expect(window.localStorage.getItem(CHIME_KEY)).toBeNull()
        expect(loadChime()).toBe(true)
    })
})

describe('playChime', () => {
    it('is silent, without errors, where there is no Web Audio', () => {
        vi.stubGlobal('AudioContext', undefined)
        expect(() => {
            unlockAudio()
            playChime()
        }).not.toThrow()
    })

    it('opens one audio context for the page and wakes it up', () => {
        vi.stubGlobal('AudioContext', FakeAudioContext)
        unlockAudio()
        expect(FakeAudioContext.made[0].resume).toHaveBeenCalled()
        playChime()
        playChime()
        expect(FakeAudioContext.made).toHaveLength(1)
    })
})
