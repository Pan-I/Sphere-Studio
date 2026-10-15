// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { lensForSeed } from './pose'

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
const seedInUrl = () => Number(new URLSearchParams(window.location.search).get('seed'))
const label = () => container.querySelector('canvas')?.getAttribute('aria-label')

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

describe('Curvilinear Grid', () => {
    it('shows the grid a link points to, whatever lens is picked', async () => {
        window.localStorage.setItem(
            'sphere-studio:curvilinear-grid:display',
            JSON.stringify({ lens: 'panoramic' }),
        )
        await mount('/curvilinear-grid?seed=48212')
        expect(seedInUrl()).toBe(48212)
        expect(label()).toBe('Fish-eye curvilinear grid, pose 48212')
    })

    it('switches to a grid with the chosen lens, and keeps to it', async () => {
        await mount('/curvilinear-grid?seed=48212')
        expect(label()).toContain('Fish-eye')
        await press('2')
        expect(label()).toContain('Panoramic')
        expect(seedInUrl()).toBe(48213)
        for (let i = 0; i < 5; i++) {
            await press(' ')
            expect(lensForSeed(seedInUrl())).toBe('panoramic')
        }
        await press('1')
        expect(label()).toContain('Fish-eye')
    })

    it('picks either lens again on 0', async () => {
        await mount('/curvilinear-grid?seed=48212')
        await press('1')
        await press('0')
        const lenses = new Set<string>()
        for (let i = 0; i < 30; i++) {
            await press(' ')
            lenses.add(lensForSeed(seedInUrl()))
        }
        expect(lenses.size).toBe(2)
    })

    it('turns the sample box on and off with B', async () => {
        await mount('/curvilinear-grid?seed=48212')
        const saved = () =>
            JSON.parse(
                window.localStorage.getItem('sphere-studio:curvilinear-grid:display') ?? '{}',
            )
        await press('b')
        expect(saved().showBox).toBe(true)
        await press('b')
        expect(saved().showBox ?? false).toBe(false) // defaults are not saved
    })
})
