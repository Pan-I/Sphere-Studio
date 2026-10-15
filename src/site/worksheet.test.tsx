// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { TOOLS } from '../tools/registry'
import { WORKSHEET_KEY, worksheetLayout } from '../worksheet/worksheet'

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
const click = async (el: HTMLElement) => {
    await act(async () => el.click())
}
const params = () => Object.fromEntries(new URLSearchParams(window.location.search))
const captions = () =>
    [...container.querySelectorAll('.worksheet-pose figcaption')].map((c) => c.textContent)
const poseLabels = () =>
    [...container.querySelectorAll('.worksheet-pose canvas')].map((c) =>
        c.getAttribute('aria-label'),
    )
const typeSeed = async (text: string) => {
    const input = container.querySelector<HTMLInputElement>('[aria-label="First seed"]')!
    await act(async () => {
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
        set.call(input, text)
        input.dispatchEvent(new Event('input', { bubbles: true }))
    })
}

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
    vi.restoreAllMocks()
})

describe('finding it', () => {
    it('has a Worksheet link in the header and on the home page', async () => {
        await mount('/')
        const links = [...container.querySelectorAll('a[href="/worksheet"]')]
        expect(links.some((a) => a.closest('.site-nav'))).toBe(true)
        expect(links.some((a) => a.closest('.home-practice'))).toBe(true)
        await act(async () => (links[0] as HTMLAnchorElement).click())
        expect(container.querySelector('h1')?.textContent).toBe('Worksheet')
        expect(document.title).toContain('Worksheet')
    })
})

describe('the sheet', () => {
    it('shows 6 poses from consecutive seeds, from a link', async () => {
        await mount('/worksheet?tool=box-randomizer&seed=48213&poses=6&room=1')
        expect(captions()).toEqual([
            '1 · seed 48213',
            '2 · seed 48214',
            '3 · seed 48215',
            '4 · seed 48216',
            '5 · seed 48217',
            '6 · seed 48218',
        ])
        expect(poseLabels()[0]).toBe('Box Randomizer, seed 48213')
        expect(container.querySelector('.worksheet-header')?.textContent).toContain(
            'Seeds 48213–48218',
        )
        expect(container.querySelector('.worksheet-sheet')?.classList).toContain('with-room')
    })

    it('draws each pose with its tool, at print resolution', async () => {
        const box = TOOLS.find((t) => t.slug === 'box-randomizer')!
        const draw = vi.spyOn(box, 'drawExample').mockImplementation(() => {})
        const ctx = { setTransform: vi.fn() }
        HTMLCanvasElement.prototype.getContext = (() =>
            ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext
        await mount('/worksheet?tool=box-randomizer&seed=100&poses=12&room=0')
        expect(draw.mock.calls.map((call) => call[2])).toEqual(
            Array.from({ length: 12 }, (_, i) => 100 + i),
        )
        const canvas = container.querySelector('canvas')!
        expect(canvas.width).toBe(worksheetLayout(12, false).pixels)
    })

    it('picks a seed and puts the sheet in the address bar when opened without one', async () => {
        await mount('/worksheet')
        const { tool, seed, poses, room } = params()
        expect([tool, poses, room]).toEqual(['sphere-randomizer', '6', '1'])
        expect(captions()[0]).toBe(`1 · seed ${seed}`)
    })

    it('leaves Value Study out, since it has no poses', async () => {
        await mount('/worksheet?tool=value-study')
        expect(params().tool).toBe('sphere-randomizer')
        const options = [...container.querySelectorAll('.worksheet-controls option')]
        expect(options.map((o) => o.getAttribute('value'))).not.toContain('value-study')
    })
})

describe('changing it', () => {
    it('switches tool, count and room, and remembers them for next time', async () => {
        await mount('/worksheet?tool=sphere-randomizer&seed=5&poses=6&room=1')
        const select = container.querySelector<HTMLSelectElement>('.worksheet-controls select')!
        await act(async () => {
            select.value = 'cone-randomizer'
            select.dispatchEvent(new Event('change', { bubbles: true }))
        })
        const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]')
        await click(radios[1])
        await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!)
        expect(params()).toEqual({ tool: 'cone-randomizer', seed: '5', poses: '12', room: '0' })
        expect(captions()).toHaveLength(12)
        expect(poseLabels()[0]).toBe('Cone Randomizer, seed 5')
        expect(JSON.parse(window.localStorage.getItem(WORKSHEET_KEY)!)).toEqual({
            tool: 'cone-randomizer',
            poses: 12,
            room: false,
        })

        await act(async () => root.unmount())
        root = createRoot(container)
        await mount('/worksheet')
        const { tool, poses, room } = params()
        expect([tool, poses, room]).toEqual(['cone-randomizer', '12', '0'])
    })

    it('loads a first seed you type', async () => {
        await mount('/worksheet?tool=sphere-randomizer&seed=5&poses=6&room=1')
        await typeSeed('abc')
        expect(button('Load').disabled).toBe(true)
        expect(container.textContent).toContain('Seeds are whole numbers')
        await typeSeed('999998')
        await click(button('Load'))
        expect(captions().slice(0, 3)).toEqual(['1 · seed 999998', '2 · seed 999999', '3 · seed 0'])
        expect(params().seed).toBe('999998')
    })

    it('brings a new sheet with New sheet or Space', async () => {
        await mount('/worksheet?tool=sphere-randomizer&seed=5&poses=6&room=1')
        vi.spyOn(Math, 'random').mockReturnValue(0.25)
        await click(button('New sheet'))
        expect(params().seed).toBe('250000')
        vi.spyOn(Math, 'random').mockReturnValue(0.5)
        await press(' ')
        expect(params().seed).toBe('500000')
    })

    it('opens the print dialog with Print', async () => {
        const print = vi.fn()
        window.print = print
        await mount('/worksheet')
        await click(button('Print'))
        expect(print).toHaveBeenCalledOnce()
    })
})
