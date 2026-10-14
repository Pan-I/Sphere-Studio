// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { pointsForSeed } from './pose'

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

describe('Perspective Grid', () => {
    it('shows the grid a link points to, whatever number of points is picked', async () => {
        window.localStorage.setItem(
            'sphere-studio:perspective-grid:display',
            JSON.stringify({ points: '1' }),
        )
        await mount('/perspective-grid?seed=48212')
        expect(seedInUrl()).toBe(48212)
        expect(label()).toBe('3 point perspective grid, pose 48212')
    })

    it('switches to a grid with the chosen number of points, and keeps to it', async () => {
        await mount('/perspective-grid?seed=48213')
        expect(label()).toContain('1 point')
        await press('2')
        expect(label()).toContain('2 point')
        expect(seedInUrl()).toBe(48214)
        for (let i = 0; i < 5; i++) {
            await press(' ')
            expect(pointsForSeed(seedInUrl())).toBe(2)
        }
        await press('3')
        expect(label()).toContain('3 point')
    })

    it('picks any number of points again on 0', async () => {
        await mount('/perspective-grid?seed=48213')
        await press('3')
        await press('0')
        const counts = new Set<number>()
        for (let i = 0; i < 30; i++) {
            await press(' ')
            counts.add(pointsForSeed(seedInUrl()))
        }
        expect(counts.size).toBe(3)
    })
})
