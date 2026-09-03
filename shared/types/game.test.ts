import { describe, it, expect } from 'vitest'
import { clueSchema, gameSchema, publicGameSchema, toPublicGame, type Game } from './game'

const board: Game = {
    id: 'game-1',
    title: 'Starter Board',
    categories: [
        {
            id: 'cat-1',
            title: 'World Capitals',
            position: 0,
            clues: [
                {
                    id: 'clue-1',
                    value: 100,
                    prompt: 'The capital of France.',
                    solution: 'What is Paris?',
                    isDailyDouble: false,
                },
                {
                    id: 'clue-2',
                    value: 200,
                    prompt: 'The capital of Japan.',
                    solution: 'What is Tokyo?',
                    isDailyDouble: true,
                },
            ],
        },
    ],
}

describe('gameSchema', () => {
    it('accepts a well-formed board', () => {
        expect(gameSchema.safeParse(board).success).toBe(true)
    })

    it('rejects a board without categories', () => {
        expect(gameSchema.safeParse({ ...board, categories: [] }).success).toBe(false)
    })

    it('rejects a clue with a non-positive value', () => {
        const result = clueSchema.safeParse({
            id: 'clue-1',
            value: 0,
            prompt: 'The capital of France.',
            solution: 'What is Paris?',
            isDailyDouble: false,
        })

        expect(result.success).toBe(false)
    })
})

describe('toPublicGame', () => {
    it('strips solutions from every clue', () => {
        const publicBoard = toPublicGame(board)

        expect(publicGameSchema.safeParse(publicBoard).success).toBe(true)
        expect(JSON.stringify(publicBoard)).not.toContain('What is Paris?')
    })

    it('keeps prompts, values and Daily Double flags', () => {
        const [category] = toPublicGame(board).categories

        expect(category?.clues).toEqual([
            {
                id: 'clue-1',
                value: 100,
                prompt: 'The capital of France.',
                isDailyDouble: false,
            },
            {
                id: 'clue-2',
                value: 200,
                prompt: 'The capital of Japan.',
                isDailyDouble: true,
            },
        ])
    })
})
