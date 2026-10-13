// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

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
const press = async (key: string, target: Element = document.body) => {
    await act(async () => {
        target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    })
}
const button = (text: string) =>
    [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) ?? null
const seedInUrl = () => new URLSearchParams(window.location.search).get('seed')
const frame = () => container.querySelector('.tool-frame')!

beforeEach(() => {
    // jsdom has no canvas; this keeps its "not implemented" warnings out of the test output.
    HTMLCanvasElement.prototype.getContext = (() =>
        null) as typeof HTMLCanvasElement.prototype.getContext
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})
afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

describe('keyboard shortcuts', () => {
    it('shows a new pose on Space', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await press(' ')
        expect(seedInUrl()).not.toBe('48213')
        expect(container.textContent).toContain(`Seed: ${seedInUrl()}`)
    })

    it('starts and pauses the timer on P', async () => {
        await mount('/circle-trio-1?seed=48213')
        await press('p')
        expect(button('Pause')).not.toBeNull()
        await press('P')
        expect(button('Resume')).not.toBeNull()
    })

    it('ignores shortcuts while typing in a field', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await press(' ', container.querySelector('input[aria-label="Seed to load"]')!)
        await press('p', container.querySelector('input[type="number"]')!)
        expect(seedInUrl()).toBe('48213')
        expect(button('Start')).not.toBeNull()
    })

    it('lists every shortcut on ?, and closes the list on Escape', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await press('?')
        const dialog = document.querySelector('[role="dialog"]')
        expect(dialog?.textContent).toContain('New pose')
        expect(dialog?.textContent).toContain('Start or pause the timer')
        expect(dialog?.textContent).toContain('Full screen on or off')

        // Other shortcuts wait until the list is closed.
        await press(' ')
        expect(seedInUrl()).toBe('48213')
        await press('Escape')
        expect(document.querySelector('[role="dialog"]')).toBeNull()
    })

    it('drops a tool’s shortcuts when you leave it', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await act(async () => {
            ;(container.querySelector('.site-title') as HTMLElement).click()
        })
        await press('?')
        const dialog = document.querySelector('[role="dialog"]')
        expect(dialog?.textContent).toContain('Show keyboard shortcuts')
        expect(dialog?.textContent).not.toContain('New pose')
    })
})

describe('full screen', () => {
    // jsdom has no Fullscreen API, so these cover the focus-mode fallback that iPhones use.
    it('toggles on F and keeps only the drawing and timer marked to show', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await press('f')
        expect(frame().classList).toContain('focus-mode')
        expect(frame().querySelector('canvas')?.dataset.focus).toBe('show')
        expect(
            frame().querySelector('[role="timer"]')?.closest('[data-focus="show"]'),
        ).not.toBeNull()
        expect(button('Exit full screen')).not.toBeNull()

        await press('F')
        expect(frame().classList).not.toContain('focus-mode')
    })

    it('leaves on Escape or the exit button, and keeps the other shortcuts working', async () => {
        await mount('/circle-trio-1?seed=48213')
        await act(async () => button('Full screen')!.click())
        expect(frame().classList).toContain('focus-mode')

        await press(' ')
        expect(seedInUrl()).not.toBe('48213')

        await press('Escape')
        expect(frame().classList).not.toContain('focus-mode')

        await press('f')
        await act(async () => button('Exit full screen')!.click())
        expect(frame().classList).not.toContain('focus-mode')
    })
})

describe('on a touch-only device', () => {
    beforeEach(() => {
        // jsdom has no matchMedia; pretend to be a phone.
        window.matchMedia = ((query: string) => ({
            matches: query.includes('pointer: coarse'),
            addEventListener: () => {},
            removeEventListener: () => {},
        })) as unknown as typeof window.matchMedia
    })
    afterEach(() => {
        delete (window as { matchMedia?: unknown }).matchMedia
    })

    it('hides Full screen and Shortcuts, and ignores F and ?', async () => {
        await mount('/sphere-randomizer?seed=48213')
        expect(button('Full screen')).toBeNull()
        expect(container.querySelector('button[aria-label="Keyboard shortcuts"]')).toBeNull()

        await press('f')
        expect(frame().classList).not.toContain('focus-mode')
        await press('?')
        expect(document.querySelector('[role="dialog"]')).toBeNull()

        // Randomize still works.
        await press(' ')
        expect(seedInUrl()).not.toBe('48213')
    })
})
