# Jeopardy-style Quiz App — Product & Technical Plan

> Status: **Proposed** · Last updated: 2026-09-04
>
> This document is the source of truth for the Jeopardy-style quiz app built on top of
> this Nuxt 3 template. It records the product requirements, the open questions raised
> during planning, the assumptions taken to keep momentum, the technical design (mapped
> onto [`STACK.md`](./STACK.md)), the data model, and the delivery milestones.

## 1. Product vision

A web app that recreates the classic **Jeopardy!** experience: a grid of categories with
increasing point values, clickable clues, a wagering twist (Daily Double),
and running score tracking for multiple players/teams. The app supports **both local hotseat
and online play in the same game**: the host opens a lobby with a fixed number of seats and
decides per seat whether it is filled by a local player (sharing the host's screen) or by a
remote player joining over the network — much like an RTS lobby (Warcraft III). The first
milestone still ships the hotseat loop first, with online seats following immediately after
(fast-follow), so the core game loop is proven before realtime infrastructure lands.

## 2. Product inquiries (questions raised during planning)

These are the questions posed to the product owner. All are now **confirmed** except Q2, which
remains a proposed default adopted to keep momentum and is reversible.

| #   | Question                                            | Options considered                                                                 | Decision                                                                                                            |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Q1  | How do players interact in a session?               | Local hotseat · Online multiplayer · **Mixed (both)**                              | **Mixed** — RTS-style lobby: host configures each seat as `Local`, `Open` (joinable online) or `Closed` (confirmed) |
| Q1a | Who buzzes in, and how?                             | Host-only adjudication · Online buzz + host keys for locals · Everyone on a device | **Online players buzz on their own device; host buzzes on behalf of local players** (confirmed)                     |
| Q1b | Where does authoritative game state live?           | Host browser + relay · Server-authoritative                                        | **Server-authoritative** — Nitro owns state, clients render it (confirmed)                                          |
| Q1c | How do online players join?                         | Room code · Shareable link · Both                                                  | **Both** — short room code plus a shareable join link (confirmed)                                                   |
| Q1d | How is buzz fairness handled across the network?    | First arrival wins · Grace window · Latency compensation                           | **Latency compensation** — client stamps the buzz, server corrects it by the measured clock offset (confirmed)      |
| Q1e | What happens if the host disconnects mid-game?      | End the room · Promote a player · Pause and wait                                   | **Pause and wait** — room freezes, host reclaims via host token, room expires after a timeout (confirmed)           |
| Q1f | How does a player who buzzed give their answer?     | Spoken (host adjudicates) · Typed · Typed + auto-check                             | **Spoken** — the app assumes an out-of-band voice channel; host presses correct/wrong (confirmed)                   |
| Q1g | What does an online player see on their own device? | Buzzer only · Full board + buzzer                                                  | **Full board + buzzer** — remote players can play without seeing the host's screen (confirmed)                      |
| Q2  | Where does board content come from?                 | Admin-authored in DB · Seeded sample data · External trivia API                    | **Seeded sample data** — Prisma seed with a few full boards; authoring UI deferred                                  |
| Q3  | Which classic mechanics are in scope?               | Board+values · Score tracking · Daily Double · Final Jeopardy                      | **Board + scoring + Daily Double.** Final Jeopardy is **cut** (confirmed)                                           |
| Q4  | User accounts / result persistence?                 | No accounts · Persist game history · Full auth+profiles                            | **No accounts** — players pick a display name per seat; anonymous cookie-backed id for reconnect (confirmed)        |

> ⚠️ Q1/Q1a–Q1g, Q3 and Q4 are **confirmed**. Q2 is still an assumption.

## 3. Scope

### In scope (MVP)

- Category × point-value board with reveal-on-click clues.
- Multiple players/teams (2–6) occupying **seats** configured by the host.
- **RTS-style lobby:** fixed seat slots, each set to `Local` (named by the host, plays on the
  shared screen), `Open` (any online player with the code/link may claim it) or `Closed`.
  Host can rename, kick, re-open or lock seats until the game starts.
- **Online seats:** join via room code _and_ shareable link; the remote device renders the
  **full board, scores and a buzz button**, so a player needs no view of the host's screen.
  Host buzzes on behalf of local seats (keyboard keys mapped per local seat).
- **Latency-compensated buzzing:** buzz order is resolved on corrected timestamps, not on
  arrival order, so remote seats are not penalised for their ping.
- **Answers are spoken** on a voice channel the players arrange themselves; the host adjudicates
  correct/wrong. The app never asks a player to type an answer.
- **Server-authoritative state:** Nitro owns the game; clients are views.
- Score tracking: add on correct, subtract on wrong, host-controlled adjudication.
- **Daily Double**: hidden clue played by one seat for a pre-reveal wager, bounded by that
  seat's score but never below the clue's face value.
- **Host disconnect handling:** the room pauses and waits for the host to come back.
- Seeded sample boards (Prisma seed) so the game is playable with zero setup.
- End-of-game summary with final standings.

### Out of scope (MVP, revisit later)

- **Final Jeopardy** — cut from the product entirely (see Q3), not merely deferred.
- Board authoring/admin UI (content is seeded for now).
- In-app answer entry / automatic answer checking; voice or text chat.
- Spectators, custom buzz sounds.
- Accounts, user profiles, persistent leaderboards (seat claim is per-session only).
- Timers per clue, audio/voice, media clues (images/video/audio in clues).

## 4. Tech stack (mapped onto the template)

No new core technologies are introduced; everything reuses [`STACK.md`](./STACK.md).

| Concern              | Choice                                          | Notes                                                                                                                                          |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework / routing  | **Nuxt 3** (`pages/`)                           | `/` board picker + code entry, `/join/:code` seat claim, and `/lobby`, `/play`, `/results` — each with an optional `/:code` for an online room |
| Language             | **TypeScript strict**                           | shared types between client & Nitro server                                                                                                     |
| API                  | **Nitro server routes** (`server/api/…`)        | fetch boards, lobby/room lifecycle                                                                                                             |
| Realtime             | **Nitro WebSockets** (`defineWebSocketHandler`) | room pub/sub: seat changes, buzz-in, clue state                                                                                                |
| ORM / DB             | **Prisma** + SQLite (dev) / Postgres (prod)     | board content models; keep schema portable                                                                                                     |
| Validation           | **Zod**                                         | validate API responses, game setup input & every WS message                                                                                    |
| State                | **Pinia** store (`stores/game.ts`)              | client mirror of server state + optimistic UI                                                                                                  |
| Styling              | **Tailwind + CVA**                              | board grid, clue modal, scoreboard                                                                                                             |
| UI primitives        | **`shared/ui`** (Headless UI)                   | reuse `UiButton`, add `UiModal`/dialog for clues                                                                                               |
| Component workshop   | **Storybook**                                   | stories for board tile, scoreboard, clue modal                                                                                                 |
| Unit/component tests | **Vitest**                                      | reducer logic, scoring, wager bounds, seat/buzz rules                                                                                          |
| E2E                  | **Playwright**                                  | full loop, incl. multi-context test: host + online seat                                                                                        |
| Clock sync           | **WS ping/pong**                                | per-client offset estimate feeding latency-compensated buzz                                                                                    |

## 5. Proposed data model (Prisma)

Content is authored/seeded; live game state lives in the server room (not persisted in MVP).
A purely local hotseat game keeps that same state in the browser.
The placeholder `User` model (and its demo routes) has been replaced by the models below.
Each board is seeded as 5 categories × 5 clues (100–500); `pnpm db:seed` loads two sample boards.
Row **position** and point **value** are separate columns so a board may repeat a value without
breaking the layout; the allowed values come from `CLUE_VALUES` in `shared/types/game.ts`, which
the seed and the Zod schemas both derive from.

```prisma
model Game {
    id         String     @id @default(cuid())
    title      String
    categories Category[]
    createdAt  DateTime   @default(now())
    updatedAt  DateTime   @updatedAt // timestamps on the aggregate root only
}

model Category {
    id       String @id @default(cuid())
    title    String
    position Int    // column order on the board
    game     Game   @relation(fields: [gameId], references: [id], onDelete: Cascade)
    gameId   String
    clues    Clue[]
}

model Clue {
    id            String   @id @default(cuid())
    position      Int      // row order within the category (0-based)
    value         Int      // point value awarded
    prompt        String   // the "answer" shown to players
    solution      String   // the expected "question" response
    isDailyDouble Boolean  @default(false)
    category      Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
    categoryId    String
}
```

> M5+ (persist history) would add `GamePlay` / `PlayerResult` models. Deferred for now.
> There is no `FinalClue` model: Final Jeopardy was cut (Q3).

## 6. Game state & core logic

The reducer is a **pure, framework-agnostic module** in `shared/game/` so the same code runs
in Nitro (authority) and, for a purely local hotseat game, in the browser. Domain logic stays
out of components (per template conventions).

- **State:** `board` (categories→clues + revealed flags),
  `seats[] {index, kind: 'local' | 'open' | 'closed', name?, occupantId?, score, connected}`,
  `activeSeatIndex`, `phase` (`lobby | paused | board | dailyDouble | clue | buzzed | done`),
  `currentClueId`, `buzzOrder[]`, `wagerSeatIndex`, `wager`.
- **Lobby actions (host only):** `setSeatKind(index, kind)`, `renameSeat(index, name)`,
  `claimSeat(index, occupantId)` (online player), `kickSeat(index)`, `startGame()`.
- **Game actions (pure, unit-testable):** `openClue(id)`, `buzz(seatIndex, atCorrected)`,
  `adjudicate(correct)`, `chooseWagerSeat(index)` + `setWager(amount)`, `closeClue()`,
  `pause()` / `resume()` (host presence), `endGame()`.
- **Daily Double:** `openClue` on a Daily Double enters the `dailyDouble` phase instead of
  opening the buzzers. The host names the seat that uncovered it and enters a wager within
  `wagerBounds` — `[5, max(seat score, clue value)]`, so a seat on zero or a negative score can
  still play. The prompt is only revealed once the wager is accepted; the clue then belongs to
  that seat alone (no buzzing) and is scored at the wager, right or wrong.
- `buzz` takes an **already-corrected** timestamp; latency compensation lives in the transport
  layer, keeping the reducer pure and deterministic in tests. The first buzz opens a
  `BUZZ_WINDOW_MS` collection window (`buzzWindowEnd`); buzzes stamped after it are ignored, so
  the order settles without a timer. A wrong answer then hands the clue to the **next seat that
  already buzzed** inside that window — it spent its one buzz and must not have to buzz again —
  and only reopens the buzzers when the collected order is exhausted.
- **Invariants to test:** game cannot start with fewer than 2 occupied seats or an unnamed
  local seat; an `open` seat can be claimed by exactly one occupant; buzz is ignored unless
  `phase === 'clue'` and locks after the first accepted buzz; the winning buzz is the smallest
  corrected timestamp, not the first to arrive; no action is accepted while `phase === 'paused'`;
  a clue can only be scored once; a wager stays inside its bounds and is scored instead of the
  clue value; nobody may buzz on a Daily Double; the game ends when all clues are revealed.

## 7. Online play (architecture)

- **Rooms:** `POST /api/rooms` creates a room → short code (ambiguity-free alphabet) plus a
  join link `/lobby/:code`. Room state is held server-side (in-memory Map for MVP, behind a
  single seam so it can move to Redis/DB later); rooms expire after inactivity.
- **Transport:** one Nitro `defineWebSocketHandler` per room channel. Every inbound message is
  parsed with Zod (`ClientMessage`) and every broadcast typed as `ServerMessage`; both types
  are shared between client and server.
- **Roles:** the creator holds a host token (role `host`) and is the only sender allowed to run
  lobby/adjudication actions. Online players hold an anonymous occupant id (cookie/localStorage)
  so a refresh or dropped connection **reconnects into the same seat**.
- **Buzzing (latency-compensated):** the server keeps a rolling clock-offset estimate per
  connection from periodic ping/pong. A client sends `buzz` with its **local** timestamp; the
  server converts it to server time using that offset, collects buzzes for `BUZZ_WINDOW_MS`
  (250 ms) of **corrected** time after the first one, and awards the clue to the smallest
  corrected timestamp. That window lives in the reducer rather than in a transport timer, so it
  depends only on the timestamps and stays deterministic in tests: inside it a slow but earlier
  buzz still takes the clue, after it a buzz is ignored. Corrections are clamped
  to a sane bound so a hostile client cannot claim to have buzzed in the past. Local seats are
  buzzed by the host client via per-seat keys (e.g. `1`–`6`) with a zero offset, over the same
  message type.
- **Player view:** an online client receives the full board and scoreboard, not just a buzzer, so
  the remote screen is self-sufficient. Clue solutions are **never** sent to player clients —
  only to the host. Once a clue opens, the player device shows `BuzzerPanel` — the prompt plus a
  single full-width **BUZZ** control — while the host keeps `ClueDialog` (per-seat buzzers and
  adjudication); the two roles deliberately do not share one template. The buzzer has explicit
  states (`ready` → `pressed` → `you're in!` / `<name> buzzed` / `locked out`), acknowledges the
  press **locally and immediately** so latency never makes it feel lost, also triggers on
  <kbd>Space</kbd>/<kbd>Enter</kbd>, and vibrates the device where supported.
- **Answering:** answers are spoken over a voice channel the players arrange themselves; after a
  buzz the host simply marks correct or wrong. No answer text travels over the wire.
- **Host presence:** if the host socket drops, the room moves to `paused` and every client shows
  "waiting for host". The host token allows reclaiming the role on reconnect; the room is
  discarded after the inactivity timeout.
- **Mixed seats:** the reducer does not care whether a seat is local or online — only the
  _input path_ differs. That keeps hotseat-only games working with no server round trips.

## 8. Milestones

1. **M0 — Data & seed — ✅ done:** Prisma models (§5), migration, seed script with 1–2 full
   boards (incl. Daily Doubles). Zod schemas for board data (`shared/types/game.ts`, including
   the redacted player view). `GET /api/games` + `/api/games/:id`, backed by the
   `server/utils/games.ts` board repository (queries + order-guaranteeing row mapping in one place,
   reused by the WS room in M3).
2. **M1 — Core loop (hotseat) — ✅ done:** pure reducer in `shared/game/` (`state.ts` transitions,
   `selectors.ts` queries, `types.ts`) with unit tests; `stores/game.ts` as a thin Pinia holder that
   delegates every transition to the reducer; `/` board picker, `/lobby` seat setup (seat count,
   names, `Local`/`Open`/`Closed`), `/play` board grid + clue dialog (`UiModal`), host adjudication,
   live scoreboard, number-key buzzing for local seats and final standings; Playwright hotseat spec.
   Known limits carried into later milestones: the game lives in memory only (a refresh returns to
   the board picker) and `Open` seats cannot be claimed until M3.
3. **M2 — Twists — ✅ done:** Daily Double wager flow (`dailyDouble` phase, `chooseWagerSeat` /
   `setWager` / `wagerBounds` in the reducer, `DailyDoubleDialog`) and a `/results` screen
   (`StandingsList`, winner/tie line) the game hands over to when the board is exhausted or the
   host ends it early; Playwright specs for both. The live game is still memory-only, so a refresh
   on `/results` returns to the board picker — persistence stays out of scope (Q4).
4. **M3 — Online seats (fast-follow, §7) — ✅ done:** `POST /api/rooms` (code + host token +
   join link) and `GET /api/rooms/:code`; the room registry `server/utils/rooms.ts` (`RoomStore`
   seam, in-memory implementation, TTL pruning); the `server/routes/_ws/room.ts` channel with
   Zod-validated `ClientMessage`/`ServerMessage` (`shared/game/messages.ts`), host-only action
   guard, per-socket clock offsets (`shared/game/clock.ts`) and per-recipient projection
   (`shared/game/room.ts` — solutions and other players' occupant ids never leave the server).
   On the client, `composables/useRoom.ts` owns the socket and `stores/game.ts` became a facade
   that either runs the reducer locally (hotseat) or sends the equivalent message, so one set of
   pages serves hotseat host, online host and remote player. Playwright multi-context specs cover
   a remote seat claim + buzz + scoring and the host-disconnect pause/resume.
   Known limit: rooms live in the memory of a single server instance.
5. **M4 — Polish & tests — ✅ done:** the player-device buzzer (`components/BuzzerPanel.vue`)
   replaced the host clue dialog filtered down to one seat; the buzz **collection window**
   (`BUZZ_WINDOW_MS` / `buzzWindowEnd` in the reducer) closed the last M3 fairness gap; the
   scoreboard now travels **into** the open-clue dialog in a `compact` form, because a modal hides
   the page behind it from assistive tech; a11y & responsive pass (side-scrolling board grid with
   a readable minimum width, "already played" in played-clue labels, `aria-live` on the buzz
   announcement, focus-visible rings, height-capped scrollable dialogs); Vitest coverage for
   `ScoreBoard`, `GameBoard`, the buzz window and the §6 invariant list.
   Deliberately not built: a per-clue countdown/timer — the host calls time by voice.
6. **M5+ (deferred):** board authoring UI (Q2), result persistence (Q4), spectators & chat.

## 9. Definition of done (MVP)

- A host can open a lobby, set each of 2–6 seats to `Local`, `Open` or `Closed`, and start once
  the seat setup is valid.
- An online player can join by room code **or** link, pick a display name, claim an open seat,
  see the full board, buzz from their own device, and survive a page refresh without losing
  their seat.
- A game with a mix of local and online seats plays a full board end-to-end.
- Two seats buzzing at the same corrected instant resolve deterministically, and a simulated
  200 ms delay on a remote seat does not by itself cost it the buzz (unit-tested); buzzes stop
  being collected `BUZZ_WINDOW_MS` after the first one.
- Closing the host tab pauses the room; reopening it with the host token resumes it in place.
- Daily Double wagers work and respect score bounds.
- Scores are correct throughout; results screen shows final standings.
- `pnpm lint`, `pnpm typecheck`, Vitest, and the Playwright happy-path all pass.
- No new dependencies outside [`STACK.md`](./STACK.md); `STACK.md` updated if that changes.
