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
const click = async (el: Element | null) => {
    expect(el).not.toBeNull()
    await act(async () => {
        el!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    })
}
const byText = (selector: string, text: string) =>
    [...document.querySelectorAll(selector)].find((e) => e.textContent?.trim() === text) ?? null
const seedInUrl = () => new URLSearchParams(window.location.search).get('seed')

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

describe('navigation with seeded poses', () => {
    it('opens a shared link on the right pose', async () => {
        await mount('/sphere-randomizer?seed=48213')
        expect(container.textContent).toContain('Seed: 48213')
    })

    it('keeps the address bar in sync while randomizing', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await click(byText('button', 'Randomize'))
        expect(seedInUrl()).not.toBeNull()
        expect(seedInUrl()).not.toBe('48213')
        expect(container.textContent).toContain(`Seed: ${seedInUrl()}`)
    })

    it('ignores a click on the link for the page you are already on', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await click(byText('.site-nav a', 'Sphere Randomizer'))
        expect(window.location.search).toBe('?seed=48213')
        expect(container.textContent).toContain('Seed: 48213')
    })

    it('restores the same pose when you come Back from another page', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await click(byText('button', 'Randomize'))
        const seed = seedInUrl()

        await click(document.querySelector('.site-title'))
        expect(window.location.pathname).toBe('/')
        expect(container.textContent).toContain('Simple, browser-based drawing tools')

        await act(async () => {
            window.history.back()
            await new Promise((r) => setTimeout(r, 50))
        })
        expect(window.location.pathname).toBe('/sphere-randomizer')
        expect(seedInUrl()).toBe(seed)
        expect(container.textContent).toContain(`Seed: ${seed}`)
    })

    it('navigates from home to the tool through its card link', async () => {
        await mount('/')
        await click(byText('.tool-card a', 'Sphere Randomizer'))
        expect(window.location.pathname).toBe('/sphere-randomizer')
        expect(container.querySelector('canvas')).not.toBeNull()
        expect(document.title).toContain('Sphere Randomizer')
    })

    it('shows a live example on every home-page card', async () => {
        await mount('/')
        expect(container.querySelectorAll('.tool-card canvas')).toHaveLength(TOOLS.length)
    })

    it('lists the tools on the home page under group headings', async () => {
        await mount('/')
        const groups = [...container.querySelectorAll('.tool-group')].map((section) => [
            section.querySelector('h2')?.textContent,
            [...section.querySelectorAll('.tool-card h3')].map((h) => h.textContent),
        ])
        expect(groups).toEqual([
            [
                'Forms',
                [
                    'Sphere Randomizer',
                    'Box Randomizer',
                    'Cylinder Randomizer',
                    'Cone Randomizer',
                    'Form Combo',
                    'Subtract',
                ],
            ],
            ['Value', ['Lit Sphere', 'Value Study']],
            ['Perspective', ['Perspective Grid']],
            ['Shapes', ['Circle Trio 1', 'Circle Trio 2']],
        ])
    })

    it('groups the header links the same way, after Practice and Worksheet', async () => {
        await mount('/')
        const nav = container.querySelector('.site-nav')!
        expect([...nav.children].map((c) => c.getAttribute('aria-label') ?? c.textContent)).toEqual(
            ['Practice', 'Worksheet', 'Forms', 'Value', 'Perspective', 'Shapes'],
        )
        const shapes = nav.querySelector('[aria-label="Shapes"]')!
        expect([...shapes.querySelectorAll('a')].map((a) => a.textContent)).toEqual([
            'Circle Trio 1',
            'Circle Trio 2',
        ])
    })

    it('opens the tool on the same pose when you click its example', async () => {
        await mount('/')
        const card = byText('.tool-card h3', 'Sphere Randomizer')!.closest('.tool-card')!
        const thumbnail = card.querySelector('a.tool-thumbnail')!
        const seed = new URL(thumbnail.getAttribute('href')!, 'http://x').searchParams.get('seed')
        expect(seed).toMatch(/^\d+$/)

        await click(thumbnail)
        expect(window.location.pathname).toBe('/sphere-randomizer')
        expect(seedInUrl()).toBe(seed)
        expect(container.textContent).toContain(`Seed: ${seed}`)
    })

    it('lets the canvas scale to the screen instead of pinning it to a pixel size', async () => {
        await mount('/sphere-randomizer?seed=48213')
        const canvas = container.querySelector('canvas')!
        expect(canvas.style.width).toBe('')
        expect(canvas.style.height).toBe('')
        expect(canvas.className).toContain('tool-canvas')
    })

    it('opens a shared Circle Trio 1 link on the right layout', async () => {
        await mount('/circle-trio-1?seed=48213')
        expect(document.title).toContain('Circle Trio 1')
        expect(container.textContent).toContain('Seed: 48213')
    })

    it('sends old Circle Trio links to Circle Trio 1, keeping the seed', async () => {
        await mount('/circle-trio?seed=48213')
        expect(window.location.pathname).toBe('/circle-trio-1')
        expect(seedInUrl()).toBe('48213')
        expect(document.title).toContain('Circle Trio 1')
        expect(container.textContent).toContain('Seed: 48213')
    })

    it('gives each tool its own seed when you switch between them', async () => {
        await mount('/sphere-randomizer?seed=48213')
        await click(byText('.site-nav a', 'Circle Trio 2'))
        expect(window.location.pathname).toBe('/circle-trio-2')
        expect(seedInUrl()).not.toBeNull()
        expect(container.textContent).toContain(`Seed: ${seedInUrl()}`)
    })
})
