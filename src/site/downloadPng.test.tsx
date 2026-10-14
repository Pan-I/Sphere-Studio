// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { EXPORT_PIXELS } from '../tools/shared/canvasExport'
import { TOOLS } from '../tools/registry'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root
// Each download: the file name and the width of the canvas it was saved from.
let downloads: { name: string; width: number }[]

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

beforeEach(() => {
    // jsdom has no canvas; this keeps its "not implemented" warnings out of the test output.
    HTMLCanvasElement.prototype.getContext = (() =>
        null) as typeof HTMLCanvasElement.prototype.getContext
    downloads = []
    let width = 0
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
        this: HTMLCanvasElement,
        callback: BlobCallback,
    ) {
        width = this.width
        callback(new Blob(['png'], { type: 'image/png' }))
    })
    URL.createObjectURL = () => 'blob:drawing'
    URL.revokeObjectURL = () => {}
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
        this: HTMLAnchorElement,
    ) {
        downloads.push({ name: this.download, width })
    })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})
afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
})

describe('Download PNG', () => {
    it.each(TOOLS.map((t) => t.slug))('saves the pose on %s at print size', async (slug) => {
        await mount(`/${slug}?seed=48213`)
        await click(button('Download PNG'))
        expect(downloads).toEqual([{ name: `${slug}-48213.png`, width: EXPORT_PIXELS }])
    })

    it('saves with the D key, named after the pose on screen', async () => {
        await mount('/sphere-randomizer?seed=111')
        await press('d')
        await press(' ')
        const seed = new URLSearchParams(window.location.search).get('seed')
        await press('d')
        expect(downloads.map((d) => d.name)).toEqual([
            'sphere-randomizer-111.png',
            `sphere-randomizer-${seed}.png`,
        ])
    })

    it('follows pose history', async () => {
        await mount('/box-randomizer?seed=111')
        await click(button('Randomize'))
        await click(button('← Back'))
        await click(button('Download PNG'))
        expect(downloads.map((d) => d.name)).toEqual(['box-randomizer-111.png'])
    })

    it('is listed with the other shortcuts', async () => {
        await mount('/sphere-randomizer?seed=111')
        await press('?')
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
            'Download the drawing as a PNG',
        )
    })
})
