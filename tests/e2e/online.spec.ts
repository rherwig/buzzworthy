import { test, expect, type Browser, type Page } from '@playwright/test'

/**
 * Online seats (docs/JEOPARDY.md M3): a host and a remote player in two separate
 * browser contexts play a clue together over the room's WebSocket channel.
 * Requires a seeded database (`pnpm db:seed`).
 */

/** Open an online room for the first seeded board and return its code. */
async function hostOnlineRoom(page: Page): Promise<string> {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Jeopardy' })).toBeVisible()

    // Retried: a click landing before hydration is silently lost.
    await expect(async () => {
        await page.getByRole('button', { name: 'Host online' }).first().click()
        await expect(page.getByRole('heading', { name: 'Lobby' })).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 15_000 })

    const code = await page.getByTestId('room-code').innerText()

    expect(code).toMatch(/^[A-Z0-9]{5}$/)

    return code
}

/** A remote player claims an open seat and waits for the host to start. */
async function joinAsPlayer(browser: Browser, code: string, seat: number, name: string) {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto(`/join/${code}`)
    await expect(page.getByRole('heading', { name: `Join room ${code}` })).toBeVisible()

    await page.getByLabel('Your name').fill(name)
    await expect(async () => {
        await page.getByRole('button', { name: `Seat ${seat}` }).click()
        await expect(page.getByText(`You are in seat ${seat}`)).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 15_000 })

    return { context, page }
}

test('a remote player claims a seat, buzzes and is scored by the host', async ({
    page,
    browser,
}) => {
    const code = await hostOnlineRoom(page)

    // Seat 1 stays local (host's screen), seat 2 is opened up for an online player.
    await page.getByLabel('Name of seat 1').fill('Ada')
    await page.getByRole('button', { name: 'Open' }).nth(1).click()

    const player = await joinAsPlayer(browser, code, 2, 'Grace')

    // The host sees the claimed seat by name.
    await expect(page.getByLabel('Name of seat 2')).toHaveValue('Grace')

    await page.getByRole('button', { name: 'Start game' }).click()
    await expect(page).toHaveURL(new RegExp(`/play/${code}$`))
    await expect(player.page).toHaveURL(new RegExp(`/play/${code}$`))

    // Only the host picks clues; the player's board is read-only.
    const clue = page.getByRole('button', { name: /for 100$/ }).first()
    await clue.click()

    // The clue reaches the player's own device (Q1g) — as one big buzzer for its own
    // seat, never as the host's per-seat list, and never with the solution.
    const buzzer = player.page.getByTestId('buzzer')
    await expect(buzzer).toBeEnabled()
    await expect(buzzer).toHaveText('BUZZ')
    await expect(player.page.getByTestId('buzz-seat-0')).toBeHidden()
    await expect(player.page.getByText('Solution:')).toBeHidden()

    await buzzer.click()

    // Immediate local feedback, then the server's confirmation.
    await expect(buzzer).toHaveText("You're in!")
    await expect(page.getByText('Grace buzzed in.')).toBeVisible()
    await page.getByRole('button', { name: 'Correct' }).click()

    // Both screens agree on the score, because both render the server's state.
    await expect(page.getByRole('list', { name: 'Scores' }).getByText('100')).toBeVisible()
    await expect(player.page.getByRole('list', { name: 'Scores' }).getByText('100')).toBeVisible()

    await player.context.close()
})

test('the room pauses when the host leaves and resumes when it returns', async ({
    page,
    browser,
}) => {
    const code = await hostOnlineRoom(page)

    await page.getByLabel('Name of seat 1').fill('Ada')
    await page.getByRole('button', { name: 'Open' }).nth(1).click()

    const player = await joinAsPlayer(browser, code, 2, 'Grace')

    await page.getByRole('button', { name: 'Start game' }).click()
    await expect(player.page).toHaveURL(new RegExp(`/play/${code}$`))

    // Host disappears: the player is told to wait (Q1e).
    await page.goto('about:blank')
    await expect(player.page.getByText('Waiting for the host…')).toBeVisible()

    // The host token in this browser reclaims the room and unfreezes it in place.
    await page.goto(`/play/${code}`)
    await expect(player.page.getByText('Waiting for the host…')).toBeHidden()
    await expect(page.getByRole('list', { name: 'Scores' }).getByText('Grace')).toBeVisible()

    await player.context.close()
})
