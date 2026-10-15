import {
    TOOLS,
    drawnPicture,
    expect,
    picture,
    shownSeed,
    test,
    toolCanvas,
    urlSeed,
} from './fixtures'

// One set of tests per tool in the registry, so a new tool is covered without touching this file.
for (const { slug, name } of TOOLS) {
    test.describe(name, () => {
        test('a seed link always shows the same pose', async ({ page, context }) => {
            await page.goto(`/${slug}?seed=4242`)
            await expect(page.getByRole('heading', { level: 1 })).toHaveText(name)
            await expect(shownSeed(page)).toHaveText('4242')
            await expect(toolCanvas(page)).toHaveAttribute('aria-label', /4242/)
            const first = await drawnPicture(toolCanvas(page))

            // The same link in another tab draws exactly the same picture...
            const again = await context.newPage()
            await again.goto(`/${slug}?seed=4242`)
            expect(await drawnPicture(toolCanvas(again))).toBe(first)

            // ...and another seed draws a different one.
            await again.goto(`/${slug}?seed=4243`)
            await expect(shownSeed(again)).toHaveText('4243')
            expect(await drawnPicture(toolCanvas(again))).not.toBe(first)
        })

        test('Randomize, Back and Forward move between poses', async ({ page }) => {
            await page.goto(`/${slug}?seed=4242`)
            const canvas = toolCanvas(page)
            const first = await drawnPicture(canvas)

            await page.getByRole('button', { name: 'Randomize' }).click()
            await expect(page.getByText('Pose 2 of 2')).toBeVisible()
            const next = urlSeed(page)
            expect(next).not.toBe('4242')
            await expect(shownSeed(page)).toHaveText(next!)
            await expect.poll(() => picture(canvas)).not.toBe(first)
            const second = await picture(canvas)

            await page.getByRole('button', { name: '← Back' }).click()
            await expect(page.getByText('Pose 1 of 2')).toBeVisible()
            expect(urlSeed(page)).toBe('4242')
            await expect.poll(() => picture(canvas)).toBe(first)

            await page.getByRole('button', { name: 'Forward →' }).click()
            expect(urlSeed(page)).toBe(next)
            await expect.poll(() => picture(canvas)).toBe(second)
        })

        test('Load seed shows that pose and updates the link', async ({ page }) => {
            await page.goto(`/${slug}?seed=1`)
            await page.getByRole('textbox', { name: 'Seed to load' }).fill('777')
            await page.getByRole('button', { name: 'Load', exact: true }).click()
            await expect(shownSeed(page)).toHaveText('777')
            expect(urlSeed(page)).toBe('777')
        })

        test('Download PNG saves the drawing, named after the pose', async ({ page }) => {
            await page.goto(`/${slug}?seed=4242`)
            await drawnPicture(toolCanvas(page))
            const [download] = await Promise.all([
                page.waitForEvent('download'),
                page.getByRole('button', { name: 'Download PNG' }).click(),
            ])
            expect(download.suggestedFilename()).toBe(`${slug}-4242.png`)
        })
    })
}
