import { drawnPicture, expect, picture, test, toolCanvas } from './fixtures'

test('opening a photo studies it, and Back to samples returns', async ({ page }) => {
    await page.goto('/value-study?seed=5')
    const canvas = toolCanvas(page)
    const sample = await drawnPicture(canvas)

    // Make a small photo in the browser: a left-to-right gradient with a dark square in it.
    const png = await page.evaluate(() => {
        const c = document.createElement('canvas')
        c.width = 120
        c.height = 80
        const ctx = c.getContext('2d')!
        const gradient = ctx.createLinearGradient(0, 0, 120, 0)
        gradient.addColorStop(0, '#f4e2c0')
        gradient.addColorStop(1, '#2b3a55')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 120, 80)
        ctx.fillStyle = '#111'
        ctx.fillRect(40, 20, 30, 30)
        return c.toDataURL('image/png').split(',')[1]
    })
    await page.getByLabel('Photo to study').setInputFiles({
        name: 'test-photo.png',
        mimeType: 'image/png',
        buffer: Buffer.from(png, 'base64'),
    })

    await expect(page.getByText('Studying test-photo.png.')).toBeVisible()
    await expect(canvas).toHaveAttribute('aria-label', 'Value study of test-photo.png')
    await expect.poll(() => picture(canvas)).not.toBe(sample)
    // Seeds are for the samples, so their controls go away while a photo is open.
    await expect(page.getByRole('button', { name: 'Randomize' })).toBeHidden()

    await page.getByRole('button', { name: 'Back to samples' }).click()
    await expect(canvas).toHaveAttribute('aria-label', 'Value study of a sample sphere, pose 5')
    await expect.poll(() => picture(canvas)).toBe(sample)
})

test('a file that is not really a photo shows a message instead', async ({ page }) => {
    await page.goto('/value-study?seed=5')
    await page.getByLabel('Photo to study').setInputFiles({
        name: 'notes.png',
        mimeType: 'image/png',
        buffer: Buffer.from('not really a picture'),
    })
    await expect(page.getByText("Couldn't open notes.png. Try a JPEG, PNG or WebP.")).toBeVisible()
    await expect(page.getByRole('button', { name: 'Randomize' })).toBeVisible()
})
