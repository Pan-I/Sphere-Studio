import { useEffect, useRef, type RefObject } from 'react'

/** One finger on the drawing, from touching down to lifting off. Times in ms, positions in px. */
export interface Touch {
    x0: number
    y0: number
    t0: number
    x1: number
    y1: number
    t1: number
}

export type Gesture = 'swipeLeft' | 'swipeRight' | 'tap' | null

/** How far a swipe must travel sideways, and how quickly. */
export const SWIPE_MIN_PX = 50
export const SWIPE_MAX_MS = 600
/** A tap barely moves and is short. Two of them close together, in time and place, are a double-tap. */
export const TAP_MAX_PX = 10
export const TAP_MAX_MS = 300
export const DOUBLE_TAP_MS = 300
export const DOUBLE_TAP_PX = 40

/**
 * What a single touch was. A swipe has to be mostly sideways, so scrolling the page up or down
 * past the drawing is never taken for one.
 */
export function classifyTouch(t: Touch): Gesture {
    const dx = t.x1 - t.x0
    const dy = t.y1 - t.y0
    const ms = t.t1 - t.t0
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > 1.5 * Math.abs(dy) && ms <= SWIPE_MAX_MS) {
        return dx < 0 ? 'swipeLeft' : 'swipeRight'
    }
    if (Math.hypot(dx, dy) <= TAP_MAX_PX && ms <= TAP_MAX_MS) return 'tap'
    return null
}

/** Whether a tap follows the last one closely enough to make a double-tap. */
export function isDoubleTap(previous: Touch | null, tap: Touch): boolean {
    if (!previous) return false
    return (
        tap.t0 - previous.t1 <= DOUBLE_TAP_MS &&
        Math.hypot(tap.x0 - previous.x0, tap.y0 - previous.y0) <= DOUBLE_TAP_PX
    )
}

export interface GestureHandlers {
    swipeLeft: () => void
    swipeRight: () => void
    /** Where the second tap landed, in viewport coordinates. */
    doubleTap: (x: number, y: number) => void
}

/**
 * Swipes and double-taps on the tool's drawing, found next to `anchor` in the same tool layout.
 * Only fingers and pens count; a mouse keeps its clicks and the keyboard has its own keys.
 */
export function useCanvasGestures(
    anchor: RefObject<HTMLElement | null>,
    handlers: GestureHandlers,
) {
    // The latest handlers, so the listeners don't need re-adding on every render.
    const latest = useRef(handlers)
    useEffect(() => {
        latest.current = handlers
    })

    useEffect(() => {
        const canvas = anchor.current?.closest('.tool-layout')?.querySelector('.tool-canvas')
        if (!(canvas instanceof HTMLElement)) return
        let start: { id: number; x: number; y: number; t: number } | null = null
        let lastTap: Touch | null = null

        const down = (e: PointerEvent) => {
            if (e.pointerType === 'mouse' || !e.isPrimary) return
            start = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp }
        }
        const up = (e: PointerEvent) => {
            if (!start || e.pointerId !== start.id) return
            const touch: Touch = {
                x0: start.x,
                y0: start.y,
                t0: start.t,
                x1: e.clientX,
                y1: e.clientY,
                t1: e.timeStamp,
            }
            start = null
            const gesture = classifyTouch(touch)
            if (gesture === 'swipeLeft') latest.current.swipeLeft()
            if (gesture === 'swipeRight') latest.current.swipeRight()
            if (gesture !== 'tap') {
                lastTap = null
                return
            }
            if (isDoubleTap(lastTap, touch)) {
                lastTap = null // a third tap starts over rather than unstarring again
                latest.current.doubleTap(e.clientX, e.clientY)
            } else {
                lastTap = touch
            }
        }
        // The browser took the touch over (say, to scroll the page), so it isn't a gesture.
        const cancel = () => {
            start = null
        }

        canvas.addEventListener('pointerdown', down)
        canvas.addEventListener('pointerup', up)
        canvas.addEventListener('pointercancel', cancel)
        return () => {
            canvas.removeEventListener('pointerdown', down)
            canvas.removeEventListener('pointerup', up)
            canvas.removeEventListener('pointercancel', cancel)
        }
    }, [anchor])
}
