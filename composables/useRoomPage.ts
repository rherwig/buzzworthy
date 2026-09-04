import { roomRoute, type RoomPage } from '~~/shared/game'

/**
 * Glue for the screens that serve both a hotseat game and an online room.
 *
 * `/play` is a local game held in this browser; `/play/ACDEF` is the same screen bound
 * to a server-authoritative room. This composable reads the optional `code` route
 * param, opens the connection when there is one, and hands back links that keep the
 * code — so the pages themselves contain no transport knowledge at all.
 */
export function useRoomPage(): {
    /** Room code, or `null` for a local hotseat game. */
    code: string | null
    online: boolean
    /** `true` when there is nothing to wait for: local play, or an open socket. */
    ready: Readonly<Ref<boolean>>
    link(page: RoomPage): string
} {
    const route = useRoute()
    const param = route.params.code
    const code = typeof param === 'string' && param.length > 0 ? param.toUpperCase() : null
    const connection = code === null ? null : useRoom(code)

    return {
        code,
        online: code !== null,
        ready: connection?.connected ?? ref(true),
        link: (page) => roomRoute(page, code),
    }
}
