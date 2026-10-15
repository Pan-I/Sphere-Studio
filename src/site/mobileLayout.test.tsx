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
const favoritesHint = () => container.querySelector('.session-favorites .tool-hint')

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

describe('tool layout', () => {
    // The side-by-side landscape layout and full screen both rely on this shape.
    it.each(TOOLS.map((t) => t.slug))(
        'has the canvas, then one column of controls, on %s',
        async (slug) => {
            await mount(`/${slug}?seed=48213`)
            const layout = container.querySelector('.tool-layout')!
            const children = [...layout.children]
            expect(children.map((c) => c.className)).toEqual(['tool-canvas', 'tool-controls'])
            expect(layout.querySelector('.tool-controls .tool-display')).not.toBeNull()
        },
    )
})

describe('the tool links on a phone', () => {
    it('scroll the current tool into view when the row overflows', async () => {
        const originals = {
            scrollWidth: Object.getOwnPropertyDescriptor(Element.prototype, 'scrollWidth')!,
            clientWidth: Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')!,
            rect: Element.prototype.getBoundingClientRect,
        }
        // A 300px row holding 1000px of links, with the current one at 600–700px.
        Object.defineProperty(Element.prototype, 'scrollWidth', {
            configurable: true,
            get: () => 1000,
        })
        Object.defineProperty(Element.prototype, 'clientWidth', {
            configurable: true,
            get: () => 300,
        })
        Element.prototype.getBoundingClientRect = function (this: Element) {
            const active = this.classList.contains('active')
            return { left: active ? 600 : 0, width: active ? 100 : 300 } as DOMRect
        }
        try {
            await mount('/form-combo?seed=48213')
            const row = container.querySelector<HTMLElement>('.site-nav')!
            // Centred: 600 - (300 - 100) / 2.
            expect(row.scrollLeft).toBe(500)
        } finally {
            Object.defineProperty(Element.prototype, 'scrollWidth', originals.scrollWidth)
            Object.defineProperty(Element.prototype, 'clientWidth', originals.clientWidth)
            Element.prototype.getBoundingClientRect = originals.rect
        }
    })
})

describe('the favorites hint', () => {
    afterEach(() => {
        delete (window as { matchMedia?: unknown }).matchMedia
    })

    it('mentions the S key where there is a keyboard', async () => {
        await mount('/sphere-randomizer?seed=48213')
        expect(favoritesHint()?.querySelector('kbd')?.textContent).toBe('S')
    })

    it('says to tap, with no key, on a touch-only device', async () => {
        window.matchMedia = ((query: string) => ({
            matches: query.includes('pointer: coarse'),
            addEventListener: () => {},
            removeEventListener: () => {},
        })) as unknown as typeof window.matchMedia
        await mount('/sphere-randomizer?seed=48213')
        expect(favoritesHint()?.textContent).toBe(
            'Tap ☆ Favorite to keep a pose here for next time.',
        )
        expect(favoritesHint()?.querySelector('kbd')).toBeNull()
    })
})
