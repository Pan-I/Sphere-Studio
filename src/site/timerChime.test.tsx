// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { TOOLS } from '../tools/registry'
import * as chime from '../tools/shared/chime'

// Sound is checked by what gets called; chime.test.ts covers the Web Audio part.
vi.mock('../tools/shared/chime', async (importOriginal) => ({
    ...(await importOriginal<typeof chime>()),
    playChime: vi.fn(),
    unlockAudio: vi.fn(),
}))
const play = vi.mocked(chime.playChime)
const unlock = vi.mocked(chime.unlockAudio)

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
const press = async (key: string) => {
    await act(async () => {
        document.body.dispatchEvent(
            new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
        )
    })
}
const button = (text: string) =>
    [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!
const click = async (text: string) => {
    await act(async () => button(text).click())
}
const intervalInput = () => container.querySelector<HTMLInputElement>('input[type="number"]')!
const chimeBox = () =>
    [...container.querySelectorAll('label')]
        .find((l) => l.textContent?.includes('Chime on new pose'))!
        .querySelector('input')!
const typeInterval = async (text: string) => {
    await act(async () => {
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
        set.call(intervalInput(), text)
        intervalInput().dispatchEvent(new Event('input', { bubbles: true }))
    })
}
const seconds = async (n: number) => {
    await act(async () => {
        vi.advanceTimersByTime(n * 1000)
    })
}
const seedInUrl = () => new URLSearchParams(window.location.search).get('seed')
const ring = () => container.querySelector('.session-ring-fill')!.getAttribute('stroke-dasharray')

beforeEach(() => {
    vi.useFakeTimers()
    // jsdom has no canvas; this keeps its "not implemented" warnings out of the test output.
    HTMLCanvasElement.prototype.getContext = (() =>
        null) as typeof HTMLCanvasElement.prototype.getContext
    window.localStorage.clear()
    play.mockClear()
    unlock.mockClear()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})
afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.useRealTimers()
})

describe('timer chime', () => {
    it.each(TOOLS.map((t) => t.slug))(
        'chimes when the timer brings a new pose on %s',
        async (slug) => {
            await mount(`/${slug}?seed=48213`)
            await typeInterval('3')
            await click('Start')
            expect(unlock).toHaveBeenCalled()
            await seconds(2)
            expect(play).not.toHaveBeenCalled()
            await seconds(1)
            expect(seedInUrl()).not.toBe('48213')
            expect(play).toHaveBeenCalledTimes(1)
            await seconds(3)
            expect(play).toHaveBeenCalledTimes(2)
        },
    )

    it("doesn't chime for a pose you pick yourself", async () => {
        await mount('/sphere-randomizer?seed=48213')
        await click('Start')
        await click('Randomize')
        await press('ArrowLeft')
        expect(play).not.toHaveBeenCalled()
    })

    it('stays quiet with the chime off, and remembers it on every tool', async () => {
        await mount('/sphere-randomizer?seed=48213')
        expect(chimeBox().checked).toBe(true)
        await act(async () => chimeBox().click())
        expect(chimeBox().checked).toBe(false)
        expect(window.localStorage.getItem(chime.CHIME_KEY)).toBe('off')

        await typeInterval('2')
        await click('Start')
        await seconds(4)
        expect(play).not.toHaveBeenCalled()

        await act(async () => root.unmount())
        root = createRoot(container)
        await mount('/box-randomizer?seed=48213')
        expect(chimeBox().checked).toBe(false)
    })

    it('plays it once when you turn it back on, so you hear it', async () => {
        window.localStorage.setItem(chime.CHIME_KEY, 'off')
        await mount('/sphere-randomizer?seed=48213')
        await act(async () => chimeBox().click())
        expect(play).toHaveBeenCalledTimes(1)
        expect(unlock).toHaveBeenCalled()
    })

    it('turns on and off with C, which shows in the shortcuts list', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await press('c')
        expect(chimeBox().checked).toBe(false)
        await press('C')
        expect(chimeBox().checked).toBe(true)
        await press('?')
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Chime on or off')
    })

    it('unlocks sound when the timer is started with P', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await press('p')
        expect(unlock).toHaveBeenCalledTimes(1)
        await press('p') // pausing doesn't need it
        expect(unlock).toHaveBeenCalledTimes(1)
    })
})

describe('countdown ring', () => {
    it('drains as the timer runs and stays put while paused', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await typeInterval('4')
        expect(ring()).toBe('100.00 100')
        await click('Start')
        // While running it aims at the next tick, and CSS eases it there over the second.
        expect(ring()).toBe('75.00 100')
        await seconds(1)
        expect(ring()).toBe('50.00 100')
        await click('Pause')
        expect(ring()).toBe('75.00 100')
        expect(container.querySelector('[role="timer"]')?.textContent).toBe('3s')
    })

    it('is empty while the interval is invalid', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await typeInterval('abc')
        expect(ring()).toBe('0.00 100')
    })

    it('stays in view in full screen, with the chime setting hidden', async () => {
        await mount('/sphere-randomizer?seed=48213')
        const ringEl = container.querySelector('.session-ring')!
        expect(ringEl.closest('[data-focus="show"]')).not.toBeNull()
        expect(chimeBox().closest('[data-focus="hide"]')).not.toBeNull()
    })
})
