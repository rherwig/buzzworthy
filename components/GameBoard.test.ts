import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import GameBoard from './GameBoard.vue'
import { makeBoard } from '~~/shared/game/game.fixture'

const categories = makeBoard(3, 2).categories

function firstClueId(): string {
    const clue = categories[0]?.clues[0]

    if (clue === undefined) {
        throw new Error('the fixture board must have at least one clue')
    }

    return clue.id
}

describe('GameBoard', () => {
    it('renders one button per clue and asks the parent to open the picked one', async () => {
        const wrapper = mount(GameBoard, { props: { categories, revealedClueIds: [] } })
        const buttons = wrapper.findAll('button')

        expect(buttons).toHaveLength(categories.flatMap((category) => category.clues).length)

        await buttons[0]?.trigger('click')

        expect(wrapper.emitted('select')).toStrictEqual([[firstClueId()]])
    })

    it('orders the columns by their board position, not by input order', () => {
        const reversed = [...categories].reverse()
        const wrapper = mount(GameBoard, { props: { categories: reversed, revealedClueIds: [] } })
        const titles = wrapper.findAll('.uppercase').map((node) => node.text())

        expect(titles).toStrictEqual(categories.map((category) => category.title))
    })

    it('empties a played clue, says so to assistive tech and refuses further clicks', async () => {
        const clueId = firstClueId()
        const wrapper = mount(GameBoard, { props: { categories, revealedClueIds: [clueId] } })
        const played = wrapper.findAll('button')[0]

        expect(played?.text()).toBe('')
        expect(played?.attributes('aria-label')).toContain('already played')
        expect(played?.attributes('disabled')).toBeDefined()

        await played?.trigger('click')

        expect(wrapper.emitted('select')).toBeUndefined()
    })

    it('locks the whole grid while a clue is open', () => {
        const wrapper = mount(GameBoard, {
            props: { categories, revealedClueIds: [], disabled: true },
        })

        expect(wrapper.findAll('button[disabled]')).toHaveLength(wrapper.findAll('button').length)
    })
})
