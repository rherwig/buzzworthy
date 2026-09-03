import { gameSchema, type Game } from '~~/shared/types/game'

/**
 * Fetch a full board, categories and clues in board order.
 *
 * This is the host/server view and includes solutions; player clients receive the
 * redacted board via `toPublicGame` once the realtime room lands (docs/JEOPARDY.md §7).
 */
export default defineEventHandler(async (event): Promise<Game> => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing game id' })
    }

    const game = await prisma.game.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            categories: {
                select: {
                    id: true,
                    title: true,
                    position: true,
                    clues: {
                        select: {
                            id: true,
                            value: true,
                            prompt: true,
                            solution: true,
                            isDailyDouble: true,
                        },
                        orderBy: { value: 'asc' },
                    },
                },
                orderBy: { position: 'asc' },
            },
        },
    })

    if (!game) {
        throw createError({ statusCode: 404, statusMessage: 'Game not found' })
    }

    return gameSchema.parse(game)
})
