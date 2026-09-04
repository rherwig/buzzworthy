# Session handoff — Buzzworthy

> Saved: 2026-09-04 · Branch: `game/jeopardy` · Last commit: `38b4f74` · Working tree clean

Pick-up notes for the next session. The living product/technical plan is
[`docs/JEOPARDY.md`](../../docs/JEOPARDY.md) — read it first; this file only records
_where we stopped_ and _what is still open_.

## Where we are

All planned milestones are done and committed:

| Milestone                                         | Commit    |
| ------------------------------------------------- | --------- |
| Plan & confirmed decisions                        | `4cf82be` |
| M0 — board data, seed, read API                   | `54f04d2` |
| M0 code-review fixes                              | `4685c4c` |
| M1 — core hotseat loop                            | `47c300a` |
| M2 — Daily Double + results                       | `706c681` |
| M3 — online seats (WebSockets)                    | `179ef93` |
| M3.5 — player buzzer panel                        | `ad8a255` |
| M4 — buzz window, a11y, tests                     | `696d2a3` |
| M5/M6 — Buzzworthy branding, single `Host` action | `cfe9696` |
| M7 — Docker + Fly.io + DEPLOY.md                  | `38b4f74` |

Gates at the time of saving: `pnpm lint`, `pnpm typecheck`, `pnpm format:check`,
`pnpm test` (140 passing) and `pnpm test:e2e` (9/9, also 9/9 against the container).

## Decisions worth remembering

- Local hotseat **and** online in one game; the host sets each seat to `Local` / `Open` /
  `Closed` (Warcraft III-style lobby). One `Host` button — every game is a room.
- **Server-authoritative**: the pure reducer in `shared/game/` runs in Nitro; Pinia mirrors it.
- Buzzing: online players buzz on their own device, the host presses `1`–`6` for local seats;
  latency-compensated timestamps with a 250 ms collection window.
- Host disconnect **pauses** the room; the host token reclaims it. Answers are **spoken**,
  host adjudicates. **Final Jeopardy is cut from the product**, not deferred.
- Anonymous players: chosen display name + cookie-backed reconnect. No accounts.
- UI primitives live in top-level `ui/`, not `shared/ui` — Nuxt feeds `shared/` to the Nitro
  build, which cannot parse `.vue`.
- Deployment: one Fly.io machine, SQLite on a `/data` volume. Must stay `fly scale count 1`.

## Open items for next session

1. **Deploy for real.** Nothing has been deployed yet. Pick a free Fly app name (`fly.toml`
   says `buzzworthy`, likely taken), then `fly deploy -e SEED_ON_BOOT=1` and set it back to `0`.
   Walkthrough: [`docs/DEPLOY.md`](../../docs/DEPLOY.md).
2. **No access gating** — anyone with the URL can create rooms. A shared password on room
   creation is the natural first gate (the user said "no gating required just yet").
3. **Not planned** (agreed): board authoring UI, result persistence, spectators & chat,
   per-clue countdown/timer.
4. Rooms are in one process's memory behind the `RoomStore` seam; a refresh mid-game is
   survivable via the room code, but a machine restart is not.
5. `.junie/plans/jeopardy-quiz-app.md` is the superseded original plan, annotated as such.
