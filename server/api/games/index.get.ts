import type { GameSummary } from '~~/shared/types/game'

/**
 * List the seeded boards for the lobby's board picker.
 * Clue content is intentionally not included — see `/api/games/:id`.
 */
export default defineEventHandler(async (): Promise<GameSummary[]> => {
    const games = await prisma.game.findMany({
        select: {
            id: true,
            title: true,
            categories: {
                select: { _count: { select: { clues: true } } },
            },
        },
        orderBy: { createdAt: 'asc' },
    })

    return games.map((game) => ({
        id: game.id,
        title: game.title,
        categoryCount: game.categories.length,
        clueCount: game.categories.reduce((total, category) => total + category._count.clues, 0),
    }))
})
