import { readFileSync } from 'node:fs'
import { expect, test as base, type Locator, type Page } from '@playwright/test'

export { expect }

export interface ToolInfo {
    slug: string
    name: string
}

/**
 * Every tool in src/tools/registry.ts, in order. The registry imports React components and CSS,
 * which Node can't load, so this reads the slugs and names from its source instead. The home-page
 * test checks the list against the real site, so a change to the registry can't slip past.
 */
export const TOOLS: readonly ToolInfo[] = (() => {
    const source = readFileSync(new URL('../src/tools/registry.ts', import.meta.url), 'utf8')
    const list = source.slice(source.indexOf('export const TOOLS'))
    const tools = [...list.matchAll(/slug: '([^']+)',[^}]*?name: '([^']+)'/g)].map(
        ([, slug, name]) => ({ slug, name }),
    )
    if (tools.length === 0) throw new Error('Found no tools in src/tools/registry.ts')
    return tools
})()

/**
 * Fails the test if the page throws or logs an error, so every test also checks that nothing
 * broke along the way. Each test gets a fresh browser profile, so saved options and favorites
 * start empty.
 */
export const test = base.extend<{ failOnErrors: void }>({
    failOnErrors: [
        async ({ page }, use) => {
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(error.message))
            page.on('console', (message) => {
                if (message.type() === 'error') errors.push(message.text())
            })
            await use()
            expect(errors, 'errors in the browser console').toEqual([])
        },
        { auto: true },
    ],
})

/** The tool's drawing. */
export const toolCanvas = (page: Page) => page.locator('canvas.tool-canvas')

/** The seed the tool says it's showing. */
export const shownSeed = (page: Page) => page.locator('.session-seed strong')

/** The ?seed= in the address bar, or null. */
export const urlSeed = (page: Page) => new URL(page.url()).searchParams.get('seed')

/** The canvas's pixels as a PNG data URL: equal pictures give equal strings. */
export const picture = (canvas: Locator) => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())

/** How many different colours the canvas has, sampled on a grid. A blank one has 1. */
export const colourCount = (canvas: Locator) =>
    canvas.evaluate((c: HTMLCanvasElement) => {
        const ctx = c.getContext('2d')
        if (!ctx || c.width === 0 || c.height === 0) return 0
        const data = ctx.getImageData(0, 0, c.width, c.height).data
        const seen = new Set<number>()
        const step = Math.max(1, Math.floor(c.width / 64))
        for (let y = 0; y < c.height; y += step) {
            for (let x = 0; x < c.width; x += step) {
                const i = (y * c.width + x) * 4
                seen.add((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3])
            }
        }
        return seen.size
    })

/** Waits until the canvas has something drawn on it, and returns its picture. */
export async function drawnPicture(canvas: Locator): Promise<string> {
    await expect
        .poll(() => colourCount(canvas), { message: 'the canvas is drawn' })
        .toBeGreaterThan(2)
    return picture(canvas)
}
