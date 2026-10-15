// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { TOOLS } from '../tools/registry'
import { useSquareCanvas } from '../tools/shared/useSquareCanvas'
import { resetThemeForTests, setThemeChoice, THEME_KEY } from './theme'

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
const toggle = () => container.querySelector<HTMLButtonElement>('.theme-toggle')!
const clickToggle = async () => {
    await act(async () => toggle().click())
}
const press = async (key: string) => {
    await act(async () => {
        document.body.dispatchEvent(
            new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
        )
    })
}
const pageTheme = () => document.documentElement.dataset.theme

beforeEach(() => {
    // jsdom has no canvas; this keeps its "not implemented" warnings out of the test output.
    HTMLCanvasElement.prototype.getContext = (() =>
        null) as typeof HTMLCanvasElement.prototype.getContext
    window.localStorage.clear()
    resetThemeForTests()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    resetThemeForTests()
})

describe('theme button', () => {
    it.each(['/', ...TOOLS.map((t) => `/${t.slug}`)])('is in the header on %s', async (url) => {
        await mount(url)
        expect(container.querySelector('.site-header .theme-toggle')).not.toBeNull()
    })

    it('starts on Auto, leaving the colours to the device', async () => {
        await mount('/')
        expect(toggle().textContent).toContain('Auto')
        expect(pageTheme()).toBeUndefined()
    })

    it('steps through Light, Dark and back to Auto, and remembers the choice', async () => {
        await mount('/')
        await clickToggle()
        expect(toggle().textContent).toContain('Light')
        expect(pageTheme()).toBe('light')
        expect(window.localStorage.getItem(THEME_KEY)).toBe('light')

        await clickToggle()
        expect(toggle().textContent).toContain('Dark')
        expect(pageTheme()).toBe('dark')
        expect(window.localStorage.getItem(THEME_KEY)).toBe('dark')

        await clickToggle()
        expect(toggle().textContent).toContain('Auto')
        expect(pageTheme()).toBeUndefined()
        expect(window.localStorage.getItem(THEME_KEY)).toBeNull()
    })

    it('says what it is and what a press does', async () => {
        await mount('/')
        expect(toggle().getAttribute('aria-label')).toBe(
            'Theme: Auto, following your device. Switch to Light.',
        )
    })

    it('picks up a choice saved on an earlier visit', async () => {
        window.localStorage.setItem(THEME_KEY, 'dark')
        await mount('/sphere-randomizer')
        expect(toggle().textContent).toContain('Dark')
    })

    it('changes with T, on the home page and in a tool', async () => {
        await mount('/')
        await press('t')
        expect(pageTheme()).toBe('light')
        await mount('/box-randomizer')
        await press('t')
        expect(pageTheme()).toBe('dark')
    })

    it('is in the shortcuts list', async () => {
        await mount('/sphere-randomizer')
        await press('?')
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
            'Theme: auto, light or dark',
        )
    })
})

describe('drawings', () => {
    it('redraw when the theme changes, since they take their colours from it', async () => {
        HTMLCanvasElement.prototype.getContext = (() => ({
            setTransform: () => {},
        })) as unknown as typeof HTMLCanvasElement.prototype.getContext
        const draw = vi.fn()
        function Drawing() {
            return <canvas ref={useSquareCanvas(100, draw)} />
        }
        await act(async () => root.render(<Drawing />))
        const before = draw.mock.calls.length
        expect(before).toBeGreaterThan(0)

        await act(async () => setThemeChoice('dark'))
        expect(draw.mock.calls.length).toBe(before + 1)
    })
})
