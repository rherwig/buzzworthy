import { test, expect, type Page } from '@playwright/test'

/**
 * The hotseat happy paths: pick a board, set up local seats, play clues (including
 * the Daily Double wager) and finish on the results screen.
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
        await page.getByRole('button', { name: 'Host', exact: true }).first().click()
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

test('a daily double is played by one seat for its wager', async ({ page }) => {
    await hostFirstBoard(page)

    await page.getByRole('button', { name: 'Start game' }).click()

    // The Daily Double of the seeded starter board (docs: prisma/boards.ts).
    await page.getByRole('button', { name: 'World Capitals for 400' }).click()
    await expect(page.getByText('Who found it?')).toBeVisible()

    await page.getByRole('button', { name: /^Player 2/ }).click()
    await page.getByLabel('Wager').fill('250')
    await page.getByRole('button', { name: 'Place wager' }).click()

    // No buzzers: the clue is handed straight to the wagering seat.
    await expect(page.getByText('Player 2 wagered 250.')).toBeVisible()
    await page.getByRole('button', { name: 'Correct' }).click()

    const scores = page.getByRole('list', { name: 'Scores' })
    await expect(scores.getByText('250')).toBeVisible()
})

test('ending the game shows the final standings', async ({ page }) => {
    await hostFirstBoard(page)

    await page.getByRole('button', { name: 'Start game' }).click()
    await page
        .getByRole('button', { name: /for 100$/ })
        .first()
        .click()
    await page.getByRole('button', { name: /^Player 1/ }).click()
    await page.getByRole('button', { name: 'Correct' }).click()

    await page.getByRole('button', { name: 'End game' }).click()

    await expect(page).toHaveURL(/\/results$/)
    await expect(page.getByText('Winner: Player 1')).toBeVisible()

    const standings = page.getByRole('list', { name: 'Final standings' })
    await expect(standings.getByText('1.')).toBeVisible()
    await expect(standings.getByText('100')).toBeVisible()
})
