import { describe, expect, it } from 'vitest'
import { classifyTouch, isDoubleTap, type Touch } from './canvasGestures'

const touch = (dx: number, dy: number, ms: number, x0 = 100, y0 = 100, t0 = 0): Touch => ({
    x0,
    y0,
    t0,
    x1: x0 + dx,
    y1: y0 + dy,
    t1: t0 + ms,
})

describe('classifyTouch', () => {
    it('reads a quick sideways drag as a swipe, by its direction', () => {
        expect(classifyTouch(touch(-80, 10, 200))).toBe('swipeLeft')
        expect(classifyTouch(touch(80, -10, 200))).toBe('swipeRight')
    })

    it('ignores drags that are short, slow or mostly up and down (scrolling)', () => {
        expect(classifyTouch(touch(-30, 0, 200))).toBeNull()
        expect(classifyTouch(touch(-80, 0, 900))).toBeNull()
        expect(classifyTouch(touch(-60, 80, 200))).toBeNull()
    })

    it('reads a short touch that barely moves as a tap', () => {
        expect(classifyTouch(touch(3, 2, 120))).toBe('tap')
        expect(classifyTouch(touch(3, 2, 600))).toBeNull() // a long press isn't a tap
    })
})

describe('isDoubleTap', () => {
    const first = touch(0, 0, 100, 100, 100, 0)

    it('pairs a second tap soon after and close by', () => {
        expect(isDoubleTap(first, touch(0, 0, 100, 110, 105, 250))).toBe(true)
    })

    it('needs a first tap, and not one too long ago or too far away', () => {
        expect(isDoubleTap(null, first)).toBe(false)
        expect(isDoubleTap(first, touch(0, 0, 100, 100, 100, 600))).toBe(false)
        expect(isDoubleTap(first, touch(0, 0, 100, 200, 100, 250))).toBe(false)
    })
})
