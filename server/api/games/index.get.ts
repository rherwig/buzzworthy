import type { GameSummary } from '~~/shared/types/game'

/**
 * List the seeded boards for the lobby's board picker.
 * Clue content is intentionally not included — see `/api/games/:id`.
 */
export default defineEventHandler(async (): Promise<GameSummary[]> => {
    try {
        return await listGameSummaries(prisma)
    } catch (error) {
        throw toInternalError(error)
    }
})
