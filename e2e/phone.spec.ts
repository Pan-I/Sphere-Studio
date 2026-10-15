import type { Locator, Page } from '@playwright/test'
import { TOOLS, drawnPicture, expect, test, toolCanvas, urlSeed } from './fixtures'

// Runs on an emulated phone (see playwright.config.ts): a touch screen and no keyboard.

const noSideScroll = (page: Page) =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

test('the home page fits the screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.tool-card')).toHaveCount(TOOLS.length)
    expect(await noSideScroll(page)).toBe(true)
})

for (const { slug, name } of TOOLS) {
    test(`${name} fits the screen, without the keyboard-only buttons`, async ({ page }) => {
        await page.goto(`/${slug}?seed=4242`)
        await drawnPicture(toolCanvas(page))
        expect(await noSideScroll(page)).toBe(true)
        await expect(page.getByRole('button', { name: 'Download PNG' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Full screen' })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Keyboard shortcuts' })).toHaveCount(0)
    })
}

test('swiping the drawing brings a new pose, and swiping back returns', async ({ page }) => {
    await page.goto('/sphere-randomizer?seed=4242')
    const canvas = toolCanvas(page)
    await drawnPicture(canvas)
    await expect(page.getByText('Swipe the drawing for the next or last pose')).toBeVisible()

    await swipe(canvas, 'left')
    await expect(page.getByText('Pose 2 of 2')).toBeVisible()
    expect(urlSeed(page)).not.toBe('4242')

    await swipe(canvas, 'right')
    await expect(page.getByText('Pose 1 of 2')).toBeVisible()
    expect(urlSeed(page)).toBe('4242')
})

/** A quick sideways swipe across the middle of an element, as touch pointer events. */
async function swipe(target: Locator, direction: 'left' | 'right') {
    await target.evaluate((el, direction) => {
        const box = el.getBoundingClientRect()
        const y = box.top + box.height / 2
        const [from, to] =
            direction === 'left'
                ? [box.left + box.width * 0.8, box.left + box.width * 0.2]
                : [box.left + box.width * 0.2, box.left + box.width * 0.8]
        const fire = (type: string, x: number) =>
            el.dispatchEvent(
                new PointerEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    pointerId: 1,
                    pointerType: 'touch',
                    isPrimary: true,
                    clientX: x,
                    clientY: y,
                }),
            )
        fire('pointerdown', from)
        fire('pointermove', (from + to) / 2)
        fire('pointerup', to)
    }, direction)
}
