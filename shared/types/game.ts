import { z } from 'zod'

/**
 * Shared board contracts between client and Nitro server.
 * Zod schemas are the single source of truth; types are derived from them.
 *
 * Only board *content* lives here. Live game state (seats, scores, phase) is
 * owned by the game reducer in `shared/game/` — see docs/JEOPARDY.md.
 */

/** Point values a clue may take, cheapest first (row order within a category). */
export const CLUE_VALUES = [100, 200, 300, 400, 500] as const

/** A clue as players see it: the solution is deliberately absent. */
export const publicClueSchema = z.object({
    id: z.string().min(1),
    value: z.number().int().positive(),
    prompt: z.string().min(1),
    isDailyDouble: z.boolean(),
})

export type PublicClue = z.infer<typeof publicClueSchema>

/** A clue as the host/server sees it, including the expected response. */
export const clueSchema = publicClueSchema.extend({
    solution: z.string().min(1),
})

export type Clue = z.infer<typeof clueSchema>

export const categorySchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    position: z.number().int().nonnegative(),
    clues: z.array(clueSchema).min(1),
})

export type Category = z.infer<typeof categorySchema>

/** A full board, as returned by `GET /api/games/:id`. */
export const gameSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    categories: z.array(categorySchema).min(1),
})

export type Game = z.infer<typeof gameSchema>

/** Lightweight entry for the board picker, as returned by `GET /api/games`. */
export const gameSummarySchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    categoryCount: z.number().int().nonnegative(),
    clueCount: z.number().int().nonnegative(),
})

export type GameSummary = z.infer<typeof gameSummarySchema>

export const publicCategorySchema = categorySchema.extend({
    clues: z.array(publicClueSchema).min(1),
})

export type PublicCategory = z.infer<typeof publicCategorySchema>

/** A board as sent to player clients: identical, minus the solutions. */
export const publicGameSchema = gameSchema.extend({
    categories: z.array(publicCategorySchema).min(1),
})

export type PublicGame = z.infer<typeof publicGameSchema>

/** Strip solutions from a board before it reaches a player client. */
export function toPublicGame(game: Game): PublicGame {
    return {
        id: game.id,
        title: game.title,
        categories: game.categories.map((category) => ({
            id: category.id,
            title: category.title,
            position: category.position,
            clues: category.clues.map(({ solution: _solution, ...clue }) => clue),
        })),
    }
}
