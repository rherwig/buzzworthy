import { test, expect } from '@playwright/test'

/**
 * Contract checks for the board endpoints. Requires a seeded database
 * (`pnpm db:seed`), which is also what the dev server runs against.
 */

test('GET /api/games lists the seeded boards', async ({ request }) => {
    const response = await request.get('/api/games')

    expect(response.ok()).toBe(true)

    const summaries = await response.json()

    expect(Array.isArray(summaries)).toBe(true)
    expect(summaries.length).toBeGreaterThan(0)
    expect(summaries[0]).toMatchObject({
        categoryCount: 5,
        clueCount: 25,
    })
})

test('GET /api/games/:id returns the board in board order', async ({ request }) => {
    const summaries = await (await request.get('/api/games')).json()
    const response = await request.get(`/api/games/${summaries[0].id}`)

    expect(response.ok()).toBe(true)

    const game = await response.json()

    expect(game.categories.map((category: { position: number }) => category.position)).toEqual([
        0, 1, 2, 3, 4,
    ])

    for (const category of game.categories) {
        expect(category.clues.map((clue: { position: number }) => clue.position)).toEqual([
            0, 1, 2, 3, 4,
        ])
        expect(category.clues.map((clue: { value: number }) => clue.value)).toEqual([
            100, 200, 300, 400, 500,
        ])
    }
})

test('GET /api/games/:id returns 404 for an unknown board', async ({ request }) => {
    const response = await request.get('/api/games/does-not-exist')

    expect(response.status()).toBe(404)
})
