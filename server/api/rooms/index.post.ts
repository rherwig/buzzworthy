import { createRoomInputSchema, joinPath, type CreateRoomResult } from '~~/shared/game'

/**
 * Open an online room for a board (docs/JEOPARDY.md §7).
 *
 * The response carries the host token: it is the only proof of host authority, and it
 * is what lets the host reclaim a paused room after a reload. Everything else about
 * the room is reachable with the code alone.
 */
export default defineEventHandler(async (event): Promise<CreateRoomResult> => {
    const { gameId, seatCount } = await readValidatedBody(event, createRoomInputSchema.parse)

    const board = await findGameById(prisma, gameId).catch((error: unknown) => {
        throw toInternalError(error)
    })

    if (!board) {
        throw createError({ statusCode: 404, statusMessage: 'Game not found' })
    }

    const room = roomStore.create(board, seatCount)

    return { code: room.code, hostToken: room.hostToken, joinPath: joinPath(room.code) }
})
