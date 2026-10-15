import { drawnPicture, expect, shownSeed, test, toolCanvas, urlSeed } from './fixtures'

test.beforeEach(async ({ page }) => {
    await page.goto('/sphere-randomizer?seed=100')
    await drawnPicture(toolCanvas(page))
})

test('Space brings a new pose and ← goes back to it', async ({ page }) => {
    await page.keyboard.press('Space')
    await expect(page.getByText('Pose 2 of 2')).toBeVisible()
    expect(urlSeed(page)).not.toBe('100')

    await page.keyboard.press('ArrowLeft')
    await expect(shownSeed(page)).toHaveText('100')
    expect(urlSeed(page)).toBe('100')
})

test('S stars the pose, and it is still there after a reload', async ({ page }) => {
    await page.keyboard.press('s')
    await expect(page.getByRole('button', { name: '★ Favorite' })).toHaveAttribute(
        'aria-pressed',
        'true',
    )
    await expect(page.getByRole('button', { name: 'Show favorite pose 100' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('button', { name: 'Show favorite pose 100' })).toBeVisible()
})

test('? lists the shortcuts', async ({ page }) => {
    await page.keyboard.press('?')
    const help = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
    await expect(help).toBeVisible()
    await expect(help).toContainText('New pose')
    await page.keyboard.press('Escape')
    await expect(help).toBeHidden()
})

test('T switches the theme, and it is remembered', async ({ page }) => {
    const html = page.locator('html')
    await page.keyboard.press('t') // Auto → Light
    await expect(html).toHaveAttribute('data-theme', 'light')
    await page.keyboard.press('t') // Light → Dark
    await expect(html).toHaveAttribute('data-theme', 'dark')

    await page.reload()
    await expect(html).toHaveAttribute('data-theme', 'dark')
})

test('F and the Full screen button hide everything but the drawing', async ({ page }) => {
    await page.getByRole('button', { name: 'Full screen' }).click()
    await expect(page.locator('.tool-frame')).toHaveClass(/focus-mode/)
    await expect(page.getByRole('button', { name: 'Randomize' })).toBeHidden()
    await expect(toolCanvas(page)).toBeVisible()

    await page.getByRole('button', { name: 'Exit full screen' }).click()
    await expect(page.locator('.tool-frame')).not.toHaveClass(/focus-mode/)

    await page.keyboard.press('f')
    await expect(page.locator('.tool-frame')).toHaveClass(/focus-mode/)
})
