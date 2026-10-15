import { TOOLS, colourCount, expect, shownSeed, test, urlSeed } from './fixtures'

test('the home page lists every tool, each with a drawn example', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Sphere Studio')
    const cards = page.locator('.tool-card')
    await expect(cards.locator('h3')).toHaveText(TOOLS.map((tool) => tool.name))

    for (const card of await cards.all()) {
        const canvas = card.locator('canvas')
        await expect.poll(() => colourCount(canvas)).toBeGreaterThan(2)
    }
})

test('the header links to every tool', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Tools' })
    for (const tool of TOOLS) {
        await expect(nav.getByRole('link', { name: tool.name, exact: true })).toHaveAttribute(
            'href',
            `/${tool.slug}`,
        )
    }
})

test("a tool's example opens the tool on the same seed", async ({ page }) => {
    await page.goto('/')
    const example = page.getByRole('link', { name: /^Open Box Randomizer on this example/ })
    const label = await example.getAttribute('aria-label')
    const seed = label?.match(/seed (\d+)/)?.[1]
    expect(seed).toBeDefined()

    await example.click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Box Randomizer')
    expect(urlSeed(page)).toBe(seed)
    await expect(shownSeed(page)).toHaveText(seed!)
})

test('clicking a header link opens that tool', async ({ page }) => {
    await page.goto('/')
    await page
        .getByRole('navigation', { name: 'Tools' })
        .getByRole('link', { name: 'Perspective Grid', exact: true })
        .click()
    await expect(page).toHaveURL(/\/perspective-grid(\?seed=\d+)?$/)
    await expect(page).toHaveTitle('Perspective Grid · Sphere Studio')
})

test("an old tool address redirects and keeps the link's seed", async ({ page }) => {
    await page.goto('/circle-trio?seed=42')
    await expect(page).toHaveURL(/\/circle-trio-1\?seed=42$/)
    await expect(shownSeed(page)).toHaveText('42')
})

test('an unknown address shows the not-found page', async ({ page }) => {
    await page.goto('/no-such-tool')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await page.getByRole('link', { name: 'Back to all tools' }).click()
    await expect(page).toHaveURL(/\/$/)
})
