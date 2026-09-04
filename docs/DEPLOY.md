# Deploying Buzzworthy

> Target: **Fly.io**, one small machine, **SQLite on a persistent volume**. Chosen for low
> cost and few moving parts; see [`STACK.md`](./STACK.md) for the decision record.

## 1. What the app needs from a host

These follow from the design in [`JEOPARDY.md`](./JEOPARDY.md) and rule out most "deploy a
Nuxt app" defaults:

| Requirement                | Why                                                                  |
| -------------------------- | -------------------------------------------------------------------- |
| A long-running Node server | Players hold **WebSocket** connections (`server/routes/_ws/room.ts`) |
| Exactly **one** instance   | Rooms live in this process's memory (`server/utils/rooms.ts`)        |
| Sticky, unshared state     | A second instance would not know the room a player is trying to join |
| A writable disk            | SQLite holds the board content                                       |

**Serverless is not an option.** Vercel, Netlify and Cloudflare Workers give a new,
short-lived execution context per request: no persistent WebSocket server and no shared
memory between requests. Making it work there means moving rooms into Redis/Durable Objects
first — real work, and unnecessary for a game you play with friends.

Only board content is persisted; a live game is never written to disk. Losing the volume
therefore costs one reseed, which is why SQLite on a single disk is an honest choice here.

## 2. One-time setup

Install [`flyctl`](https://fly.io/docs/flyctl/install/), then:

```powershell
fly auth login

# Create the app without deploying yet. Pick your own name and edit fly.toml to match;
# the app name becomes the subdomain, e.g. https://<name>.fly.dev
fly apps create buzzworthy

# The disk that holds the SQLite file. 1 GB is the smallest size and far more than enough.
fly volumes create buzzworthy_data --region fra --size 1
```

Keep the volume's region equal to `primary_region` in `fly.toml`, otherwise the machine
cannot mount it.

## 3. First deploy (with the boards)

The database starts empty, so the first boot must seed it. `SEED_ON_BOOT=1` makes the
entrypoint load the bundled boards after applying migrations:

```powershell
fly deploy -e SEED_ON_BOOT=1

# Only one machine, ever.
fly scale count 1

fly open        # https://<app>.fly.dev
fly logs
```

Then deploy again without the override, so a later restart does not replace the content —
`fly.toml` ships `SEED_ON_BOOT = '0'`:

```powershell
fly deploy
```

Or leave the flag alone entirely and seed by hand once:

```powershell
fly ssh console --command "sh -c 'ALLOW_DESTRUCTIVE_SEED=1 npx tsx prisma/seed.ts'"
```

`ALLOW_DESTRUCTIVE_SEED` exists because the seed **deletes all boards** before writing and
refuses to run under `NODE_ENV=production` without it (`prisma/seed.ts`).

Two traps this setup already accounts for, both found by _running_ the artifact rather than
reading it:

> **`DATABASE_URL` must be an absolute path in production.** A relative `file:./prisma/dev.db`
> works in development because Prisma resolves it against the schema's directory — which the
> built Nitro bundle does not contain, so the server starts and then fails every query with
> "Unable to open the database file". `Dockerfile` and `fly.toml` therefore both use
> `file:/data/buzzworthy.db`.

> **The runtime image needs `shared/` and `zod`.** `prisma/boards.ts` imports `CLUE_VALUES`
> from `shared/types/game.ts` (the single source of the clue-value grid), so seeding crashes
> without them — even though the bundled server itself needs neither.

## 4. Everyday operations

```powershell
fly deploy                  # ship a new version (migrations run on boot)
fly logs                    # tail
fly ssh console             # shell in the container, /data holds the SQLite file
fly status                  # machine state, region, volume
fly ssh sftp get /data/buzzworthy.db   # back up the boards
```

Migrations are applied by `docker-entrypoint.sh` with `prisma migrate deploy`, which only
plays committed migrations and never resets data.

## 5. Cost and the scale-to-zero trade-off

`fly.toml` sets `auto_stop_machines = 'stop'` with `min_machines_running = 0`: the machine
stops when nothing is connected and starts again on the next request. A `shared-cpu-1x`
machine with 512 MB plus a 1 GB volume costs cents per month when it is mostly asleep.

The trade-off: a stopped machine loses its in-memory rooms, and the first request after a
sleep pays a cold start of a few seconds. Because an open WebSocket counts as an active
connection, a machine is not stopped while a game is being played — but nobody should
expect a room to survive a night. That is fine: rooms already expire after four hours of
inactivity (`ROOM_TTL_MS`).

If you would rather never see a cold start, at the price of a machine running 24/7:

```toml
auto_stop_machines = 'off'
auto_start_machines = false
min_machines_running = 1
```

## 6. Notes

- **No access control.** Anyone with the URL can host a room. Deliberate for now; a shared
  password on room creation is the natural first gate if the URL ever spreads.
- **HTTPS is required** for the WebSocket to be `wss://`; `force_https = true` handles it,
  and Fly's certificate for `*.fly.dev` needs no setup.
- **Custom domain**, if you want one later: `fly certs add play.example.com` plus a CNAME.
- **Postgres instead of SQLite:** switch `datasource db { provider }` in
  `prisma/schema.prisma`, point `DATABASE_URL` at the server and regenerate migrations. The
  schema is deliberately portable, so nothing else changes — but note this does _not_ by
  itself make multiple instances possible; the room registry would have to move out of
  process too.

## 7. Building the image locally

The `Dockerfile` is platform-agnostic, so the same image runs on any container host:

```powershell
docker build -t buzzworthy .
docker run --rm -p 3200:3000 -v buzzworthy_data:/data -e SEED_ON_BOOT=1 buzzworthy
```

The full Playwright suite can be pointed at the running container — the best available proof
that a build is deployable, since it drives the WebSocket room in a real browser:

```powershell
$env:E2E_BASE_URL = 'http://127.0.0.1:3200'
pnpm test:e2e
```

The image is two-stage: the builder installs the full dependency tree and runs `nuxt build`;
the runtime carries the self-contained Nitro output plus only the Prisma CLI and `tsx`, which
the entrypoint needs for migrations and seeding.

To smoke-test the built server without Docker, give it an **absolute** database path:

```powershell
pnpm build
$env:NODE_ENV = 'production'
$env:DATABASE_URL = 'file:C:/temp/buzzworthy.db'
node .output/server/index.mjs
```
