import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ScoreBoard from './ScoreBoard.vue'
import type { Seat } from '~~/shared/game'

function seat(overrides: Partial<Seat> = {}): Seat {
    return {
        index: 0,
        kind: 'local',
        name: 'Ada',
        occupantId: null,
        score: 0,
        connected: true,
        ...overrides,
    }
}

const seats: readonly Seat[] = [
    seat(),
    seat({ index: 1, kind: 'open', name: 'Grace', occupantId: 'occupant-1', score: -200 }),
    seat({ index: 2, kind: 'closed', name: null }),
    seat({ index: 3, kind: 'open', name: null }),
]

describe('ScoreBoard', () => {
    it('lists only seats taking part in the game', () => {
        const wrapper = mount(ScoreBoard, { props: { seats } })
        const entries = wrapper.findAll('li')

        expect(entries).toHaveLength(2)
        expect(entries[0]?.text()).toContain('Ada')
        expect(entries[1]?.text()).toContain('Grace')
    })

    it('marks a negative score and tells local seats their buzz key', () => {
        const wrapper = mount(ScoreBoard, { props: { seats } })

        expect(wrapper.text()).toContain('-200')
        expect(wrapper.text()).toContain('Local · key 1')
        expect(wrapper.find('.text-red-500').text()).toBe('-200')
    })

    it('highlights the seat holding the buzz', () => {
        const wrapper = mount(ScoreBoard, { props: { seats, activeSeatIndex: 1 } })
        const entries = wrapper.findAll('li')

        expect(entries[0]?.classes()).toContain('border-border')
        expect(entries[1]?.classes()).toContain('ring-primary')
    })

    it('drops the seat detail line in the compact form used inside a clue dialog', () => {
        const wrapper = mount(ScoreBoard, { props: { seats, compact: true } })

        expect(wrapper.text()).toContain('Ada')
        expect(wrapper.text()).not.toContain('Local · key 1')
        expect(wrapper.attributes('aria-label')).toBe('Scores')
    })
})
