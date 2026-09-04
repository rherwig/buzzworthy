import { PrismaClient } from '@prisma/client'
import { boards, clueValueForRow } from './boards'

/**
 * Seed the bundled Jeopardy boards.
 *
 * Destructive: **every** existing board is deleted first (cascading to categories
 * and clues) so repeated runs produce the same content. Refuses to run when
 * `NODE_ENV=production` to keep it away from shared databases — set
 * `ALLOW_DESTRUCTIVE_SEED=1` to override, which is how a deployed instance loads its
 * boards (only content is stored; live games are never persisted).
 *
 * This script owns its own PrismaClient on purpose: `server/utils/prisma.ts`
 * relies on Nitro auto-imports (`useEnv`) and cannot be imported from a plain
 * Node script — do not "DRY" the two together.
 */
const prisma = new PrismaClient()

async function main(): Promise<void> {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== '1') {
        throw new Error(
            'Refusing to seed: this script deletes all boards and NODE_ENV=production. ' +
                'Set ALLOW_DESTRUCTIVE_SEED=1 if that is intended.',
        )
    }

    // One transaction: a mid-run failure must not leave a half-seeded database.
    await prisma.$transaction([
        prisma.game.deleteMany(),
        ...boards.map((board) =>
            prisma.game.create({
                data: {
                    title: board.title,
                    categories: {
                        create: board.categories.map((category, position) => ({
                            title: category.title,
                            position,
                            clues: {
                                create: category.clues.map((clue, row) => ({
                                    position: row,
                                    value: clueValueForRow(row),
                                    prompt: clue.prompt,
                                    solution: clue.solution,
                                    isDailyDouble: clue.isDailyDouble ?? false,
                                })),
                            },
                        })),
                    },
                },
            }),
        ),
    ])

    console.info(`Seeded ${boards.length} boards.`)
}

main()
    .catch((error: unknown) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
