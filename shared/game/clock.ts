/**
 * Latency compensation for buzzing (docs/JEOPARDY.md §7).
 *
 * A player's device stamps the buzz with its *own* clock, which may be minutes off
 * server time. The server keeps a rolling offset estimate per connection from
 * ping/pong round trips and translates every incoming buzz into server time before
 * handing it to the reducer, so a remote seat is judged on when it pressed the
 * button rather than on when the packet happened to arrive.
 *
 * Pure functions on purpose: the transport layer owns the sockets, this module owns
 * the arithmetic, and the reducer only ever sees corrected timestamps.
 */

/**
 * How far in the past a corrected buzz may land, relative to the moment the server
 * received it. Bounds both honest clock drift and a hostile client claiming to have
 * buzzed long before the clue was even opened.
 */
export const MAX_BUZZ_BACKDATE_MS = 1_000

/** Weight of a fresh sample in the rolling offset estimate (exponential average). */
export const OFFSET_SMOOTHING = 0.5

/** One completed ping/pong round trip, all timestamps in milliseconds. */
export interface ClockSample {
    /** Server time when the ping was sent. */
    readonly serverSent: number
    /** Client time when the ping was answered. */
    readonly clientTime: number
    /** Server time when the pong came back. */
    readonly serverReceived: number
}

/**
 * `clientClock - serverClock` for a single round trip.
 *
 * The client answered somewhere between `serverSent` and `serverReceived`; assuming a
 * symmetric path, the midpoint is the best estimate of the matching server time.
 */
export function sampleOffset(sample: ClockSample): number {
    return sample.clientTime - (sample.serverSent + sample.serverReceived) / 2
}

/**
 * Fold a new sample into the running estimate. The first sample is taken as-is;
 * later ones are smoothed so a single jittery round trip cannot swing the offset.
 */
export function updateOffset(previous: number | null, sample: ClockSample): number {
    const next = sampleOffset(sample)

    return previous === null ? next : previous + (next - previous) * OFFSET_SMOOTHING
}

/**
 * Translate a client-stamped buzz into server time.
 *
 * The result is clamped to `[serverNow - MAX_BUZZ_BACKDATE_MS, serverNow]`: a buzz can
 * never be dated into the future (which would only ever lose) nor arbitrarily far into
 * the past (which would always win).
 */
export function correctBuzzTime(clientAt: number, offset: number, serverNow: number): number {
    const corrected = clientAt - offset

    return Math.min(serverNow, Math.max(serverNow - MAX_BUZZ_BACKDATE_MS, corrected))
}
