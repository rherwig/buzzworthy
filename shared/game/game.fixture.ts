import { CLUE_VALUES, type Game } from '../types/game'

/**
 * Test-only board builder (not imported by application code).
 * Keeps the reducer tests small: `makeBoard(2, 2)` is a 2×2 board with predictable ids.
 *
 * `dailyDoubleClueId` marks one clue as a Daily Double, e.g. `'clue-0-1'`.
 */
export function makeBoard(
    categoryCount = 2,
    cluesPerCategory = 2,
    dailyDoubleClueId: string | null = null,
): Game {
    return {
        id: 'board-1',
        title: 'Test Board',
        categories: Array.from({ length: categoryCount }, (_unused, column) => ({
            id: `category-${column}`,
            title: `Category ${column + 1}`,
            position: column,
            clues: Array.from({ length: cluesPerCategory }, (_unusedClue, row) => ({
                id: `clue-${column}-${row}`,
                position: row,
                value: CLUE_VALUES[row] ?? 100,
                prompt: `Prompt ${column}-${row}`,
                solution: `Solution ${column}-${row}`,
                isDailyDouble: `clue-${column}-${row}` === dailyDoubleClueId,
            })),
        })),
    }
}
