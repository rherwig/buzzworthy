import { test, expect } from '@playwright/test'

test('home page renders and the counter works', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible()

    await expect(page.getByText('count: 0')).toBeVisible()
    await page.getByRole('button', { name: 'Increment' }).click()
    await expect(page.getByText('count: 1')).toBeVisible()
})
