import { z } from 'zod'

/**
 * Shared board contracts between client and Nitro server.
 * Zod schemas are the single source of truth; types are derived from them.
 *
 * Only board *content* lives here. Live game state (seats, scores, phase) is
 * owned by the game reducer in `shared/game/` — see docs/JEOPARDY.md.
 */

/**
 * Point values a clue may take, cheapest first.
 * The single source of truth for the board layout: the array index is the row
 * position and the entry is that row's score. Seeds and validation derive from it.
 */
export const CLUE_VALUES = [100, 200, 300, 400, 500] as const

export type ClueValue = (typeof CLUE_VALUES)[number]

/** Number of rows every category must provide. */
export const CLUES_PER_CATEGORY = CLUE_VALUES.length

const isClueValue = (value: number): value is ClueValue =>
    (CLUE_VALUES as readonly number[]).includes(value)

/** A clue's score — constrained to the values defined by `CLUE_VALUES`. */
export const clueValueSchema = z
    .number()
    .int()
    .refine(isClueValue, {
        message: `Clue value must be one of: ${CLUE_VALUES.join(', ')}`,
    })

/** A clue as players see it: the solution is deliberately absent. */
export const publicClueSchema = z.object({
    id: z.string().min(1),
    position: z.number().int().nonnegative(),
    value: clueValueSchema,
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

export const gameSummaryListSchema = z.array(gameSummarySchema)

export const publicCategorySchema = categorySchema.extend({
    clues: z.array(publicClueSchema).min(1),
})

export type PublicCategory = z.infer<typeof publicCategorySchema>

/** A board as sent to player clients: identical, minus the solutions. */
export const publicGameSchema = gameSchema.extend({
    categories: z.array(publicCategorySchema).min(1),
})

export type PublicGame = z.infer<typeof publicGameSchema>

/**
 * Strip solutions from a board before it reaches a player client.
 *
 * Parsing against `publicGameSchema` does the redaction: Zod objects drop keys
 * they don't declare, so a clue can never leak a field the player schema omits —
 * including fields added to `Clue` in the future.
 */
export function toPublicGame(game: Game | PublicGame): PublicGame {
    return publicGameSchema.parse(game)
}
