import { describe, it, expect } from 'vitest'
import { boards, clueValueForRow } from './boards'
import { CLUE_VALUES, CLUES_PER_CATEGORY, gameSchema } from '../shared/types/game'

/**
 * Smoke tests for the bundled board content. They assert the invariants the seed
 * relies on, so a broken board is caught here instead of against a live server.
 */

const CATEGORIES_PER_BOARD = 5

describe('clueValueForRow', () => {
    it('maps every row to its point value', () => {
        expect(CLUE_VALUES.map((_value, row) => clueValueForRow(row))).toEqual([...CLUE_VALUES])
    })

    it('throws for a row outside the board', () => {
        expect(() => clueValueForRow(CLUES_PER_CATEGORY)).toThrow()
    })
})

describe('bundled boards', () => {
    it('ships at least two boards with unique titles', () => {
        expect(boards.length).toBeGreaterThanOrEqual(2)
        expect(new Set(boards.map((board) => board.title)).size).toBe(boards.length)
    })

    it.each(boards.map((board) => [board.title, board] as const))(
        '%s has a full grid of clues',
        (_title, board) => {
            expect(board.categories).toHaveLength(CATEGORIES_PER_BOARD)

            for (const category of board.categories) {
                expect(category.clues).toHaveLength(CLUES_PER_CATEGORY)

                for (const clue of category.clues) {
                    expect(clue.prompt.length).toBeGreaterThan(0)
                    expect(clue.solution.length).toBeGreaterThan(0)
                }
            }
        },
    )

    it.each(boards.map((board) => [board.title, board] as const))(
        '%s has exactly one Daily Double',
        (_title, board) => {
            const dailyDoubles = board.categories.flatMap((category) =>
                category.clues.filter((clue) => clue.isDailyDouble === true),
            )

            expect(dailyDoubles).toHaveLength(1)
        },
    )

    it.each(boards.map((board) => [board.title, board] as const))(
        '%s satisfies the shared board contract once seeded',
        (_title, board) => {
            const candidate = {
                id: 'seed-id',
                title: board.title,
                categories: board.categories.map((category, position) => ({
                    id: `seed-category-${position}`,
                    title: category.title,
                    position,
                    clues: category.clues.map((clue, row) => ({
                        id: `seed-clue-${position}-${row}`,
                        position: row,
                        value: clueValueForRow(row),
                        prompt: clue.prompt,
                        solution: clue.solution,
                        isDailyDouble: clue.isDailyDouble ?? false,
                    })),
                })),
            }

            expect(gameSchema.safeParse(candidate).success).toBe(true)
        },
    )
})
