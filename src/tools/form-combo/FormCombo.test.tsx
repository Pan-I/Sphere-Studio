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
/** The forms the label names, e.g. ['Sphere', 'box', 'cylinder']. */
const forms = () =>
    label()
        .split(' running')[0]
        .split(/, | and /)
const stored = () =>
    JSON.parse(window.localStorage.getItem('sphere-studio:form-combo:display') ?? '{}')

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

describe('Form Combo', () => {
    it('names the forms of the pose a link points to', async () => {
        await mount('/form-combo?seed=48213')
        expect(label()).toBe('Cylinder, box and sphere running into each other, pose 48213')
    })

    it('switches between two, three and four forms with the number keys', async () => {
        await mount('/form-combo?seed=48213')
        await press('4')
        expect(label()).toContain('cone')
        expect(forms()).toHaveLength(4)
        await press('2')
        expect(forms()).toHaveLength(2)
        await press('3')
        expect(forms()).toHaveLength(3)
    })

    it('toggles the highlight and hidden edges from the keyboard, and remembers them', async () => {
        await mount('/form-combo?seed=48213')
        await press('m')
        await press('h')
        expect(stored()).toMatchObject({ highlightMeet: false, showHiddenEdges: false })
    })
})
