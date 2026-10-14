// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { favoritesKey } from '../tools/shared/favorites'
import { TOOLS } from '../tools/registry'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

const render = async () => {
    await act(async () => {
        root.render(
            <BrowserRouter>
                <App />
            </BrowserRouter>,
        )
    })
}
const mount = async (url: string) => {
    window.history.replaceState(null, '', url)
    await render()
}
// Leaves the page and comes back, as a reload would.
const remount = async (url: string) => {
    await act(async () => root.unmount())
    root = createRoot(container)
    await mount(url)
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
const labelled = (label: string) =>
    container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
const click = async (el: HTMLElement) => {
    await act(async () => el.click())
}
const starButton = () => button('☆ Favorite') ?? button('★ Favorite')
const favorites = () =>
    [...container.querySelectorAll('.session-favorite-seed')].map((b) => b.textContent?.trim())
const seedInUrl = () => new URLSearchParams(window.location.search).get('seed')

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

describe('favorites', () => {
    it.each(TOOLS.map((t) => t.slug))('stars, keeps and shows a pose on %s', async (slug) => {
        await mount(`/${slug}?seed=48213`)
        expect(favorites()).toEqual([])
        expect(starButton().getAttribute('aria-pressed')).toBe('false')

        await click(starButton())
        expect(starButton().textContent).toBe('★ Favorite')
        expect(starButton().getAttribute('aria-pressed')).toBe('true')
        expect(favorites()).toEqual(['★ 48213'])

        // Still there after a reload, and a click brings the pose back.
        await remount(`/${slug}?seed=5`)
        expect(favorites()).toEqual(['★ 48213'])
        expect(starButton().textContent).toBe('☆ Favorite')
        await click(labelled('Show favorite pose 48213')!)
        expect(seedInUrl()).toBe('48213')
        expect(container.textContent).toContain('Seed: 48213')
        expect(starButton().textContent).toBe('★ Favorite')
    })

    it('stars and unstars with the S key, newest first', async () => {
        await mount('/sphere-randomizer?seed=111')
        await press('s')
        await press(' ')
        const second = seedInUrl()
        await press('s')
        expect(favorites()).toEqual([`★ ${second}`, '★ 111'])
        await press('s')
        expect(favorites()).toEqual(['★ 111'])
    })

    it('removes a favorite with its × button', async () => {
        await mount('/box-randomizer?seed=111')
        await click(starButton())
        await click(labelled('Remove favorite 111')!)
        expect(favorites()).toEqual([])
        expect(window.localStorage.getItem(favoritesKey('box-randomizer'))).toBeNull()
    })

    it('keeps each tool’s favorites separate', async () => {
        await mount('/box-randomizer?seed=111')
        await click(starButton())
        await remount('/cone-randomizer?seed=111')
        expect(favorites()).toEqual([])
        expect(starButton().textContent).toBe('☆ Favorite')
    })

    it('puts a shown favorite in the pose history', async () => {
        await mount('/cylinder-randomizer?seed=111')
        await click(starButton())
        await click(button('Randomize'))
        await click(labelled('Show favorite pose 111')!)
        expect(container.querySelector('.session-history-position')?.textContent).toBe(
            'Pose 3 of 3',
        )
        await click(button('← Back'))
        expect(seedInUrl()).not.toBe('111')
    })

    it('survives Reset to defaults', async () => {
        await mount('/sphere-randomizer?seed=111')
        await click(starButton())
        const thickness = container.querySelector<HTMLInputElement>('input[type="range"]')!
        await act(async () => {
            const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!
            setValue.set!.call(thickness, String(Number(thickness.value) + 1))
            thickness.dispatchEvent(new Event('input', { bubbles: true }))
        })
        expect(button('Reset to defaults').disabled).toBe(false)
        await click(button('Reset to defaults'))
        expect(favorites()).toEqual(['★ 111'])
    })

    it('ignores bad stored data', async () => {
        window.localStorage.setItem(favoritesKey('lit-sphere'), '{oops')
        await mount('/lit-sphere?seed=111')
        expect(favorites()).toEqual([])
        await click(starButton())
        expect(favorites()).toEqual(['★ 111'])
    })
})
