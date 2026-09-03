import { describe, it, expect } from 'vitest'
import { mapGame, mapGameSummaries, type GameRow } from './games'

const row: GameRow = {
    id: 'game-1',
    title: 'Starter Board',
    categories: [
        {
            id: 'cat-2',
            title: 'Programming',
            position: 1,
            clues: [
                {
                    id: 'clue-b',
                    position: 1,
                    value: 200,
                    prompt: 'Second row.',
                    solution: 'What is second?',
                    isDailyDouble: false,
                },
                {
                    id: 'clue-a',
                    position: 0,
                    value: 100,
                    prompt: 'First row.',
                    solution: 'What is first?',
                    isDailyDouble: true,
                },
            ],
        },
        {
            id: 'cat-1',
            title: 'World Capitals',
            position: 0,
            clues: [
                {
                    id: 'clue-c',
                    position: 0,
                    value: 100,
                    prompt: 'The capital of France.',
                    solution: 'What is Paris?',
                    isDailyDouble: false,
                },
            ],
        },
    ],
}

describe('mapGame', () => {
    it('returns categories in column order', () => {
        expect(mapGame(row).categories.map((category) => category.position)).toEqual([0, 1])
    })

    it('returns clues in row order within a category', () => {
        const [, category] = mapGame(row).categories

        expect(category?.clues.map((clue) => clue.id)).toEqual(['clue-a', 'clue-b'])
    })

    it('does not mutate the source row', () => {
        mapGame(row)

        expect(row.categories.map((category) => category.position)).toEqual([1, 0])
    })

    it('keeps solutions — this is the host view', () => {
        const [category] = mapGame(row).categories

        expect(category?.clues[0]?.solution).toBe('What is Paris?')
    })
})

describe('mapGameSummaries', () => {
    it('counts categories and their clues', () => {
        const summaries = mapGameSummaries([
            {
                id: 'game-1',
                title: 'Starter Board',
                categories: [{ _count: { clues: 5 } }, { _count: { clues: 5 } }],
            },
            { id: 'game-2', title: 'Empty Board', categories: [] },
        ])

        expect(summaries).toEqual([
            { id: 'game-1', title: 'Starter Board', categoryCount: 2, clueCount: 10 },
            { id: 'game-2', title: 'Empty Board', categoryCount: 0, clueCount: 0 },
        ])
    })
})
