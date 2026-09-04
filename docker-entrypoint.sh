#!/bin/sh
# Container startup: bring the database up to date, then hand over to the server.
#
# `migrate deploy` only applies committed migrations and never resets data, so it is
# safe on every boot. Seeding is opt-in via SEED_ON_BOOT because it replaces all board
# content (live games are never persisted, so nothing else can be lost).
set -e

echo "==> prisma migrate deploy"
npx prisma migrate deploy

if [ "${SEED_ON_BOOT}" = "1" ]; then
    echo "==> seeding boards (SEED_ON_BOOT=1)"
    ALLOW_DESTRUCTIVE_SEED=1 npx tsx prisma/seed.ts
fi

exec "$@"
