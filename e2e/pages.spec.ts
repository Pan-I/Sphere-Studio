import { colourCount, expect, test, toolCanvas } from './fixtures'

test('the worksheet draws a page of poses from consecutive seeds', async ({ page }) => {
    await page.goto('/worksheet')
    const sheet = page.getByRole('region', { name: 'Worksheet' })
    await page
        .getByRole('combobox', { name: 'Tool' })
        .selectOption({ label: 'Cylinder Randomizer' })
    // The sheet lives in the address bar, so the radio button turns on once the page has moved
    // there, a moment after the click. check() would give up before that.
    const twelve = page.getByRole('radio', { name: '12' })
    await twelve.click()
    await expect(twelve).toBeChecked()
    await page.getByRole('textbox', { name: 'First seed' }).fill('500')
    await page.getByRole('button', { name: 'Load', exact: true }).click()

    await expect(sheet).toContainText('Seeds 500–511')
    const poses = sheet.getByRole('img')
    await expect(poses).toHaveCount(12)
    await expect(poses.first()).toHaveAttribute('aria-label', 'Cylinder Randomizer, seed 500')
    await expect(poses.last()).toHaveAttribute('aria-label', 'Cylinder Randomizer, seed 511')
    for (const pose of await poses.all()) {
        await expect.poll(() => colourCount(pose)).toBeGreaterThan(2)
    }
})

test('a practice session runs through its steps', async ({ page }) => {
    await page.goto('/practice')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('button', { name: 'Start session' }).click()

    const now = page.locator('.practice-bar-now')
    await expect(now).toContainText('Step 1 of')
    await expect.poll(() => colourCount(toolCanvas(page))).toBeGreaterThan(2)

    await page.getByRole('button', { name: /^(Next step|Finish)$/ }).click()
    await expect(now).toContainText('Step 2 of')
    await page.getByRole('button', { name: 'End session' }).click()
    await expect(page.locator('.practice-bar-now')).toBeHidden()
})
