import { z } from 'zod'
import type { Game } from '~~/shared/types/game'

const routeParamsSchema = z.object({
    id: z.string().min(1),
})

/**
 * Fetch a full board, categories and clues in board order.
 *
 * This is the host/server view and includes solutions; player clients receive the
 * redacted board via `toPublicGame` once the realtime room lands (docs/JEOPARDY.md §7).
 */
export default defineEventHandler(async (event): Promise<Game> => {
    const { id } = await getValidatedRouterParams(event, routeParamsSchema.parse)

    const game = await findGameById(prisma, id).catch((error: unknown) => {
        throw toInternalError(error)
    })

    if (!game) {
        throw createError({ statusCode: 404, statusMessage: 'Game not found' })
    }

    return game
})
