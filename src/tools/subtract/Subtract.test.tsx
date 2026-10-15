// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'

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
const label = () => container.querySelector('canvas')?.getAttribute('aria-label') ?? ''
const stored = () =>
    JSON.parse(window.localStorage.getItem('sphere-studio:subtract:display') ?? '{}')

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

describe('Subtract', () => {
    it('names the form and the cut of the pose a link points to', async () => {
        await mount('/subtract?seed=48213')
        expect(label()).toBe('Box with a cone cut out of it, pose 48213')
    })

    it('switches between one and two cuts with the number keys', async () => {
        await mount('/subtract?seed=48213')
        await press('2')
        expect(label()).toMatch(/ and an? [a-z]+ cut out of it/)
        expect(stored()).toMatchObject({ cuts: 'two' })
        await press('1')
        expect(label()).not.toContain(' and ')
    })

    it('toggles the highlight, hidden edges and cut-away part from the keyboard, and remembers them', async () => {
        await mount('/subtract?seed=48213')
        await press('m')
        await press('h')
        await press('g')
        expect(stored()).toMatchObject({
            highlightMeet: false,
            showHiddenEdges: true,
            showCutAway: false,
        })
    })
})
