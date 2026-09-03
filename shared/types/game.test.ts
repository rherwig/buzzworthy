import { describe, it, expect } from 'vitest'
import {
    CLUE_VALUES,
    clueSchema,
    clueValueSchema,
    gameSchema,
    publicGameSchema,
    toPublicGame,
    type Game,
} from './game'

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
                    position: 0,
                    value: 100,
                    prompt: 'The capital of France.',
                    solution: 'What is Paris?',
                    isDailyDouble: false,
                },
                {
                    id: 'clue-2',
                    position: 1,
                    value: 200,
                    prompt: 'The capital of Japan.',
                    solution: 'What is Tokyo?',
                    isDailyDouble: true,
                },
            ],
        },
    ],
}

describe('clueValueSchema', () => {
    it('accepts every value from CLUE_VALUES', () => {
        for (const value of CLUE_VALUES) {
            expect(clueValueSchema.safeParse(value).success).toBe(true)
        }
    })

    it('rejects values outside the board layout', () => {
        for (const value of [0, -100, 137, 600]) {
            expect(clueValueSchema.safeParse(value).success).toBe(false)
        }
    })
})

describe('gameSchema', () => {
    it('accepts a well-formed board', () => {
        expect(gameSchema.safeParse(board).success).toBe(true)
    })

    it('rejects a board without categories', () => {
        expect(gameSchema.safeParse({ ...board, categories: [] }).success).toBe(false)
    })

    it('rejects a clue with a value that is not a board value', () => {
        const result = clueSchema.safeParse({
            id: 'clue-1',
            position: 0,
            value: 137,
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

    it('keeps prompts, positions, values and Daily Double flags', () => {
        const [category] = toPublicGame(board).categories

        expect(category?.clues).toEqual([
            {
                id: 'clue-1',
                position: 0,
                value: 100,
                prompt: 'The capital of France.',
                isDailyDouble: false,
            },
            {
                id: 'clue-2',
                position: 1,
                value: 200,
                prompt: 'The capital of Japan.',
                isDailyDouble: true,
            },
        ])
    })
})
