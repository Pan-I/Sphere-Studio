// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { TOOLS } from '../tools/registry'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

const mount = async (url: string) => {
    window.history.replaceState(null, '', url)
    await act(async () => {
        root.render(
            <BrowserRouter>
                <App />
            </BrowserRouter>,
        )
    })
}
const canvas = () => container.querySelector<HTMLCanvasElement>('.tool-canvas')!
const seedInUrl = () => new URLSearchParams(window.location.search).get('seed')
const history = () => container.querySelector('.session-history-position')?.textContent
const starred = () =>
    [...container.querySelectorAll('button')]
        .find((b) => b.textContent?.includes('Favorite'))
        ?.getAttribute('aria-pressed')

// jsdom has no PointerEvent, so a MouseEvent carries the pointer fields the gestures read.
const pointer = (type: string, x: number, y: number, pointerType = 'touch') => {
    const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })
    Object.assign(e, { pointerId: 1, pointerType, isPrimary: true })
    return e
}
const drag = async (dx: number, pointerType = 'touch') => {
    await act(async () => {
        canvas().dispatchEvent(pointer('pointerdown', 200, 200, pointerType))
        canvas().dispatchEvent(pointer('pointerup', 200 + dx, 205, pointerType))
    })
}
const doubleTap = async () => {
    await drag(0)
    await drag(0)
}

beforeEach(() => {
    // jsdom has no canvas; this keeps its "not implemented" warnings out of the test output.
    HTMLCanvasElement.prototype.getContext = (() =>
        null) as typeof HTMLCanvasElement.prototype.getContext
    window.localStorage.clear()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})
afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

describe('touch gestures on the drawing', () => {
    it.each(TOOLS.map((t) => t.slug))('swipe and double-tap work on %s', async (slug) => {
        await mount(`/${slug}?seed=48213`)

        // Swiping left from the newest pose brings a new one; right goes back to it.
        await drag(-120)
        expect(seedInUrl()).not.toBe('48213')
        expect(history()).toBe('Pose 2 of 2')
        await drag(120)
        expect(seedInUrl()).toBe('48213')
        expect(history()).toBe('Pose 1 of 2')
        // Left again steps forward through history rather than making a third pose.
        await drag(-120)
        expect(history()).toBe('Pose 2 of 2')

        expect(starred()).toBe('false')
        await doubleTap()
        expect(starred()).toBe('true')
        expect(container.querySelector('.session-star-flash')?.textContent).toBe('★')
        await doubleTap()
        expect(starred()).toBe('false')
    })

    it('leaves a mouse alone', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await drag(-120, 'mouse')
        await drag(0, 'mouse')
        await drag(0, 'mouse')
        expect(seedInUrl()).toBe('48213')
        expect(starred()).toBe('false')
    })
})
