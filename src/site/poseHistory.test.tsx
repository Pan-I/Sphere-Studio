// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { HISTORY_LIMIT } from '../tools/shared/poseHistory'
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
const seedInUrl = () => new URLSearchParams(window.location.search).get('seed')
const position = () => container.querySelector('.session-history-position')?.textContent

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

describe('pose history', () => {
    it.each(TOOLS.map((t) => t.slug))('goes back and forward on %s', async (slug) => {
        await mount(`/${slug}?seed=48213`)
        expect(button('← Back').disabled).toBe(true)
        expect(button('Forward →').disabled).toBe(true)
        expect(position()).toBe('Pose 1 of 1')

        await click('Randomize')
        const second = seedInUrl()
        expect(second).not.toBe('48213')
        expect(position()).toBe('Pose 2 of 2')

        await click('← Back')
        expect(seedInUrl()).toBe('48213')
        expect(container.textContent).toContain('Seed: 48213')
        expect(position()).toBe('Pose 1 of 2')
        expect(button('← Back').disabled).toBe(true)

        await click('Forward →')
        expect(seedInUrl()).toBe(second)
        expect(button('Forward →').disabled).toBe(true)
    })

    it('uses the arrow keys', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await press(' ')
        const second = seedInUrl()
        await press('ArrowLeft')
        expect(seedInUrl()).toBe('48213')
        await press('ArrowRight')
        expect(seedInUrl()).toBe(second)
    })

    it('keeps a loaded seed in the history too', async () => {
        await mount('/box-randomizer?seed=48213')
        const input = container.querySelector<HTMLInputElement>('input[aria-label="Seed to load"]')!
        await act(async () => {
            const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!
            setValue.set!.call(input, '777')
            input.dispatchEvent(new Event('input', { bubbles: true }))
        })
        await click('Load')
        expect(seedInUrl()).toBe('777')
        await click('← Back')
        expect(seedInUrl()).toBe('48213')
    })

    it(`remembers the last ${HISTORY_LIMIT} poses`, async () => {
        await mount('/cone-randomizer?seed=48213')
        for (let i = 0; i < HISTORY_LIMIT + 3; i++) await press(' ')
        expect(position()).toBe(`Pose ${HISTORY_LIMIT} of ${HISTORY_LIMIT}`)
        for (let i = 0; i < HISTORY_LIMIT + 3; i++) await press('ArrowLeft')
        expect(position()).toBe(`Pose 1 of ${HISTORY_LIMIT}`)
        expect(seedInUrl()).not.toBe('48213')
    })
})
