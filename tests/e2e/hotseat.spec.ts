import { test, expect, type Page } from '@playwright/test'

/**
 * The M1 happy path: pick a board, set up local seats, play a clue and score it.
 * Requires a seeded database (`pnpm db:seed`).
 */

/**
 * Open a lobby for the first seeded board.
 *
 * The click is retried until the lobby shows: a click that lands before Vue has
 * hydrated the freshly server-rendered page is silently lost.
 */
async function hostFirstBoard(page: Page) {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Jeopardy' })).toBeVisible()

    await expect(async () => {
        await page.getByRole('button', { name: 'Host' }).first().click()
        await expect(page.getByRole('heading', { name: 'Lobby' })).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 15_000 })
}

test('a host plays a clue in a local hotseat game', async ({ page }) => {
    await hostFirstBoard(page)

    await page.getByLabel('Name of seat 1').fill('Ada')
    await page.getByRole('button', { name: 'Start game' }).click()

    // The board grid is up and every score starts at zero.
    const scores = page.getByRole('list', { name: 'Scores' })
    await expect(scores.getByText('Ada')).toBeVisible()
    await expect(scores.getByText('0').first()).toBeVisible()

    const firstClue = page.getByRole('button', { name: /for 100$/ }).first()
    await firstClue.click()

    // Buzz for the first local seat and mark the spoken answer correct.
    await page.getByRole('button', { name: /^Ada/ }).click()
    await expect(page.getByText('Ada buzzed in.')).toBeVisible()
    await page.getByRole('button', { name: 'Correct' }).click()

    await expect(scores.getByText('100')).toBeVisible()
    await expect(firstClue).toBeDisabled()
})

test('a wrong answer subtracts the value and lets the other seat buzz', async ({ page }) => {
    await hostFirstBoard(page)

    await page.getByRole('button', { name: 'Start game' }).click()
    await page
        .getByRole('button', { name: /for 200$/ })
        .first()
        .click()

    await page.getByRole('button', { name: /^Player 1/ }).click()
    await page.getByRole('button', { name: 'Wrong' }).click()

    // Player 1 is locked out of this clue; Player 2 may still buzz.
    await expect(page.getByRole('button', { name: /^Player 1/ })).toBeDisabled()
    await page.getByRole('button', { name: /^Player 2/ }).click()
    await page.getByRole('button', { name: 'Correct' }).click()

    // The dialog hides the page from assistive tech while it is open, so the
    // scores are only asserted once the clue has been closed.
    const scores = page.getByRole('list', { name: 'Scores' })
    await expect(scores.getByText('-200')).toBeVisible()
    await expect(scores.getByText('200', { exact: true })).toBeVisible()
})
