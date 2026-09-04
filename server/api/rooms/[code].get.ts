import { z } from 'zod'
import { roomCodeSchema, type RoomSummary } from '~~/shared/game'

const routeParamsSchema = z.object({ code: roomCodeSchema })

/**
 * What a player needs before joining: does this room exist, which board is it, and
 * which seats are still free. Deliberately public — the code *is* the invitation —
 * but it never exposes the board content, scores or the host token.
 */
export default defineEventHandler(async (event): Promise<RoomSummary> => {
    const { code } = await getValidatedRouterParams(event, routeParamsSchema.parse)
    const room = roomStore.get(code)

    if (room === null) {
        throw createError({ statusCode: 404, statusMessage: 'Room not found' })
    }

    return {
        code: room.code,
        title: room.state.board.title,
        phase: room.state.phase,
        openSeatIndexes: room.state.seats
            .filter((seat) => seat.kind === 'open' && seat.occupantId === null)
            .map((seat) => seat.index),
    }
})
