import { describe, expect, it } from 'vitest'
import {
    HISTORY_LIMIT,
    canGoBack,
    canGoForward,
    currentSeed,
    pushPose,
    startHistory,
    stepHistory,
} from './poseHistory.ts'

const pushAll = (seeds: number[]) =>
    seeds.slice(1).reduce((history, seed) => pushPose(history, seed), startHistory(seeds[0]))

describe('poseHistory', () => {
    it('starts with just the first pose', () => {
        const history = startHistory(5)
        expect(currentSeed(history)).toBe(5)
        expect(canGoBack(history)).toBe(false)
        expect(canGoForward(history)).toBe(false)
    })

    it('adds new poses at the end and shows them', () => {
        const history = pushAll([1, 2, 3])
        expect(history).toEqual({ seeds: [1, 2, 3], index: 2 })
        expect(canGoBack(history)).toBe(true)
        expect(canGoForward(history)).toBe(false)
    })

    it('ignores showing the pose already on screen', () => {
        const history = pushAll([1, 2])
        expect(pushPose(history, 2)).toBe(history)
    })

    it('steps back and forward, and stays put at either end', () => {
        const history = pushAll([1, 2, 3])
        const back = stepHistory(history, -1)
        expect(currentSeed(back)).toBe(2)
        expect(canGoForward(back)).toBe(true)
        expect(currentSeed(stepHistory(back, 1))).toBe(3)
        expect(stepHistory(history, 1)).toBe(history)
        const start = stepHistory(stepHistory(back, -1), -1)
        expect(currentSeed(start)).toBe(1)
        expect(canGoBack(start)).toBe(false)
    })

    it('drops the poses ahead when a new one is shown after going back', () => {
        const back = stepHistory(stepHistory(pushAll([1, 2, 3]), -1), -1)
        expect(pushPose(back, 9)).toEqual({ seeds: [1, 9], index: 1 })
    })

    it(`keeps only the last ${HISTORY_LIMIT} poses`, () => {
        const seeds = Array.from({ length: HISTORY_LIMIT + 5 }, (_, i) => i)
        const history = pushAll(seeds)
        expect(history.seeds).toHaveLength(HISTORY_LIMIT)
        expect(history.seeds[0]).toBe(5)
        expect(currentSeed(history)).toBe(HISTORY_LIMIT + 4)
    })

    it('does not modify the history it was given', () => {
        const history = pushAll([1, 2])
        pushPose(history, 3)
        stepHistory(history, -1)
        expect(history).toEqual({ seeds: [1, 2], index: 1 })
    })
})
