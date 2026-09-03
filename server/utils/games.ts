import type { PrismaClient } from '@prisma/client'
import {
    gameSchema,
    gameSummaryListSchema,
    type Game,
    type GameSummary,
} from '~~/shared/types/game'

/**
 * Board persistence: the only place that knows how boards are stored.
 *
 * HTTP handlers and (from M3) the realtime room use these functions, so the
 * Prisma projections and the row-to-DTO mapping exist exactly once. The client
 * is passed in rather than imported so the queries can be pointed at any
 * PrismaClient — a test database included.
 */

type ClueRow = {
    id: string
    position: number
    value: number
    prompt: string
    solution: string
    isDailyDouble: boolean
}

type CategoryRow = {
    id: string
    title: string
    position: number
    clues: ClueRow[]
}

export type GameRow = {
    id: string
    title: string
    categories: CategoryRow[]
}

export type GameSummaryRow = {
    id: string
    title: string
    categories: { _count: { clues: number } }[]
}

const gameSelect = {
    id: true,
    title: true,
    categories: {
        select: {
            id: true,
            title: true,
            position: true,
            clues: {
                select: {
                    id: true,
                    position: true,
                    value: true,
                    prompt: true,
                    solution: true,
                    isDailyDouble: true,
                },
                orderBy: { position: 'asc' },
            },
        },
        orderBy: { position: 'asc' },
    },
} as const

const summarySelect = {
    id: true,
    title: true,
    categories: {
        select: { _count: { select: { clues: true } } },
    },
} as const

const byPosition = (a: { position: number }, b: { position: number }): number =>
    a.position - b.position

/**
 * Normalise a board row into board order: categories by column, clues by row.
 * Sorting here (not only in the query) makes the ordering guarantee part of the
 * mapper and therefore unit-testable without a database. Narrowing to the shared
 * `Game` type is left to `gameSchema`.
 */
export function mapGame(row: GameRow): GameRow {
    return {
        id: row.id,
        title: row.title,
        categories: [...row.categories].sort(byPosition).map((category) => ({
            id: category.id,
            title: category.title,
            position: category.position,
            clues: [...category.clues].sort(byPosition).map((clue) => ({
                id: clue.id,
                position: clue.position,
                value: clue.value,
                prompt: clue.prompt,
                solution: clue.solution,
                isDailyDouble: clue.isDailyDouble,
            })),
        })),
    }
}

/** Map board rows to picker summaries. */
export function mapGameSummaries(rows: GameSummaryRow[]): GameSummary[] {
    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        categoryCount: row.categories.length,
        clueCount: row.categories.reduce((total, category) => total + category._count.clues, 0),
    }))
}

/** All boards as picker summaries, oldest first. */
export async function listGameSummaries(client: PrismaClient): Promise<GameSummary[]> {
    const rows = await client.game.findMany({
        select: summarySelect,
        orderBy: { createdAt: 'asc' },
    })

    return gameSummaryListSchema.parse(mapGameSummaries(rows))
}

/** A full board including solutions, or `null` when the id is unknown. */
export async function findGameById(client: PrismaClient, id: string): Promise<Game | null> {
    const row = await client.game.findUnique({ where: { id }, select: gameSelect })

    return row === null ? null : gameSchema.parse(mapGame(row))
}
