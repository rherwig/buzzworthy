import { CLUE_VALUES } from '../shared/types/game'

/**
 * Board content shipped with the template so the app is playable with zero setup.
 * Kept apart from `seed.ts` so it can be validated by tests without a database.
 */

export type ClueSeed = {
    prompt: string
    solution: string
    isDailyDouble?: boolean
}

export type CategorySeed = {
    title: string
    /** One clue per row, cheapest first: row `n` is worth `CLUE_VALUES[n]`. */
    clues: [ClueSeed, ClueSeed, ClueSeed, ClueSeed, ClueSeed]
}

export type BoardSeed = {
    title: string
    categories: CategorySeed[]
}

/** Point value of the row a clue sits in — derived from the shared contract. */
export const clueValueForRow = (row: number): number => {
    const value = CLUE_VALUES[row]

    if (value === undefined) {
        throw new Error(`No clue value defined for row ${row}`)
    }

    return value
}

export const boards: BoardSeed[] = [
    {
        title: 'Starter Board',
        categories: [
            {
                title: 'World Capitals',
                clues: [
                    { prompt: 'The capital of France.', solution: 'What is Paris?' },
                    { prompt: 'The capital of Japan.', solution: 'What is Tokyo?' },
                    { prompt: 'The capital of Canada.', solution: 'What is Ottawa?' },
                    {
                        prompt: 'The capital of Australia.',
                        solution: 'What is Canberra?',
                        isDailyDouble: true,
                    },
                    { prompt: 'The capital of Kazakhstan.', solution: 'What is Astana?' },
                ],
            },
            {
                title: 'Programming',
                clues: [
                    {
                        prompt: 'This language runs natively in every modern browser.',
                        solution: 'What is JavaScript?',
                    },
                    {
                        prompt: 'This superset of JavaScript adds static types.',
                        solution: 'What is TypeScript?',
                    },
                    {
                        prompt: 'Linus Torvalds created this distributed version control system.',
                        solution: 'What is Git?',
                    },
                    {
                        prompt: 'This data format stands for JavaScript Object Notation.',
                        solution: 'What is JSON?',
                    },
                    {
                        prompt: 'This sorting algorithm has an average complexity of O(n log n) and is named for its speed.',
                        solution: 'What is quicksort?',
                    },
                ],
            },
            {
                title: 'Space',
                clues: [
                    { prompt: 'The closest star to Earth.', solution: 'What is the Sun?' },
                    { prompt: 'The planet known as the Red Planet.', solution: 'What is Mars?' },
                    {
                        prompt: 'The first human to travel into space, in 1961.',
                        solution: 'Who is Yuri Gagarin?',
                    },
                    {
                        prompt: 'This telescope, launched in 1990, orbits about 540 km above Earth.',
                        solution: 'What is the Hubble Space Telescope?',
                    },
                    {
                        prompt: 'The largest moon in the solar system, orbiting Jupiter.',
                        solution: 'What is Ganymede?',
                    },
                ],
            },
            {
                title: 'Movies',
                clues: [
                    {
                        prompt: 'This 1975 Spielberg film made audiences afraid of the water.',
                        solution: 'What is Jaws?',
                    },
                    {
                        prompt: 'The droid duo of the original Star Wars: R2-D2 and this protocol droid.',
                        solution: 'What is C-3PO?',
                    },
                    {
                        prompt: 'This 1994 film features the line "Life is like a box of chocolates".',
                        solution: 'What is Forrest Gump?',
                    },
                    {
                        prompt: 'Director of Inception, Interstellar and Oppenheimer.',
                        solution: 'Who is Christopher Nolan?',
                    },
                    {
                        prompt: 'The first non-English language film to win Best Picture.',
                        solution: 'What is Parasite?',
                    },
                ],
            },
            {
                title: 'Potpourri',
                clues: [
                    { prompt: 'The number of sides on a hexagon.', solution: 'What is six?' },
                    { prompt: 'The chemical symbol for gold.', solution: 'What is Au?' },
                    {
                        prompt: 'The ocean between Europe and North America.',
                        solution: 'What is the Atlantic?',
                    },
                    {
                        prompt: 'This Italian city is built on a lagoon of more than 100 islands.',
                        solution: 'What is Venice?',
                    },
                    {
                        prompt: 'The only mammal capable of true sustained flight.',
                        solution: 'What is a bat?',
                    },
                ],
            },
        ],
    },
    {
        title: 'Tech & Trivia',
        categories: [
            {
                title: 'The Web',
                clues: [
                    {
                        prompt: 'The protocol behind encrypted web traffic.',
                        solution: 'What is HTTPS?',
                    },
                    {
                        prompt: 'This markup language structures every web page.',
                        solution: 'What is HTML?',
                    },
                    {
                        prompt: 'He invented the World Wide Web at CERN in 1989.',
                        solution: 'Who is Tim Berners-Lee?',
                    },
                    {
                        prompt: 'This status code means "Not Found".',
                        solution: 'What is 404?',
                        isDailyDouble: true,
                    },
                    {
                        prompt: 'This browser API allows full-duplex communication over a single connection.',
                        solution: 'What are WebSockets?',
                    },
                ],
            },
            {
                title: 'Databases',
                clues: [
                    {
                        prompt: 'The query language of relational databases.',
                        solution: 'What is SQL?',
                    },
                    {
                        prompt: 'This lightweight database stores everything in a single file.',
                        solution: 'What is SQLite?',
                    },
                    {
                        prompt: 'The "A" in the ACID guarantees.',
                        solution: 'What is atomicity?',
                    },
                    {
                        prompt: 'This structure speeds up lookups at the cost of write performance.',
                        solution: 'What is an index?',
                    },
                    {
                        prompt: 'This open-source object-relational database calls itself "the most advanced".',
                        solution: 'What is PostgreSQL?',
                    },
                ],
            },
            {
                title: 'History',
                clues: [
                    { prompt: 'The year the Berlin Wall fell.', solution: 'What is 1989?' },
                    {
                        prompt: 'This ship sank on its maiden voyage in 1912.',
                        solution: 'What is the Titanic?',
                    },
                    {
                        prompt: 'She was the first woman to win a Nobel Prize.',
                        solution: 'Who is Marie Curie?',
                    },
                    {
                        prompt: 'This wall, begun over 2,000 years ago, stretches thousands of kilometres across northern China.',
                        solution: 'What is the Great Wall of China?',
                    },
                    {
                        prompt: 'This 1215 charter limited the power of the English king.',
                        solution: 'What is the Magna Carta?',
                    },
                ],
            },
            {
                title: 'Music',
                clues: [
                    {
                        prompt: 'The number of strings on a standard guitar.',
                        solution: 'What is six?',
                    },
                    {
                        prompt: 'This Liverpool quartet released "Abbey Road".',
                        solution: 'Who are The Beatles?',
                    },
                    {
                        prompt: 'He composed the Ninth Symphony while profoundly deaf.',
                        solution: 'Who is Ludwig van Beethoven?',
                    },
                    {
                        prompt: 'This Italian term instructs a musician to play softly.',
                        solution: 'What is piano?',
                    },
                    {
                        prompt: 'This 1975 Queen track runs nearly six minutes with no chorus.',
                        solution: 'What is Bohemian Rhapsody?',
                    },
                ],
            },
            {
                title: 'Animals',
                clues: [
                    { prompt: 'The largest land animal.', solution: 'What is the elephant?' },
                    { prompt: 'The fastest land animal.', solution: 'What is the cheetah?' },
                    {
                        prompt: 'A group of these birds is called a murder.',
                        solution: 'What are crows?',
                    },
                    {
                        prompt: 'This mammal lays eggs and has a bill like a duck.',
                        solution: 'What is the platypus?',
                    },
                    {
                        prompt: 'This invertebrate has three hearts and blue blood.',
                        solution: 'What is an octopus?',
                    },
                ],
            },
        ],
    },
]
