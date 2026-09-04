import { describe, it, expect, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import BuzzerPanel from './BuzzerPanel.vue'
import type { Seat, StateClue } from '~~/shared/game'

/**
 * The panel renders inside `UiModal`, which portals its content out of the component
 * tree — assertions therefore read `document.body` and only after the mount flushed.
 */

const clue: StateClue = {
    id: 'clue-1',
    position: 1,
    value: 200,
    prompt: 'This bird cannot fly',
    isDailyDouble: false,
}

function seat(overrides: Partial<Seat> = {}): Seat {
    return {
        index: 1,
        kind: 'open',
        name: 'Grace',
        occupantId: 'occupant-1',
        score: 0,
        connected: true,
        ...overrides,
    }
}

async function open(props: Partial<InstanceType<typeof BuzzerPanel>['$props']> = {}) {
    const wrapper = mount(BuzzerPanel, {
        props: { clue, seat: seat(), activeSeat: null, ...props },
        attachTo: document.body,
    })
    await flushPromises()

    return wrapper
}

function buzzer(): HTMLButtonElement | null {
    return document.querySelector<HTMLButtonElement>('[data-testid="buzzer"]')
}

async function pressSpace() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    await flushPromises()
}

afterEach(() => {
    document.body.innerHTML = ''
})

describe('BuzzerPanel', () => {
    it('shows the prompt and a single BUZZ button, not the player name', async () => {
        await open()

        expect(document.body.textContent).toContain('This bird cannot fly')
        expect(buzzer()?.textContent?.trim()).toBe('BUZZ')
        expect(buzzer()?.disabled).toBe(false)
    })

    it('never reveals a solution, because a player clue does not carry one', async () => {
        await open()

        expect(document.body.textContent).not.toContain('Solution')
    })

    it('emits buzz with its own seat index and acknowledges the press immediately', async () => {
        const wrapper = await open({ seat: seat({ index: 3 }) })

        buzzer()?.click()
        await flushPromises()

        expect(wrapper.emitted('buzz')).toStrictEqual([[3]])
        expect(buzzer()?.textContent?.trim()).toBe('Buzzed…')
        expect(buzzer()?.disabled).toBe(true)
    })

    it('buzzes on Space as well, and only once per press', async () => {
        const wrapper = await open()

        await pressSpace()
        await pressSpace()

        expect(wrapper.emitted('buzz')).toStrictEqual([[1]])
    })

    it('reports that this seat has the buzz', async () => {
        await open({ activeSeat: seat() })

        expect(buzzer()?.textContent?.trim()).toBe("You're in!")
    })

    it('names the seat that got in first', async () => {
        await open({ activeSeat: seat({ index: 0, kind: 'local', name: 'Ada' }) })

        expect(buzzer()?.textContent?.trim()).toBe('Ada buzzed')
        expect(buzzer()?.disabled).toBe(true)
    })

    it('locks out a seat that already answered wrong', async () => {
        const wrapper = await open({ locked: true })

        expect(buzzer()?.textContent?.trim()).toBe('Locked out')

        buzzer()?.click()
        await pressSpace()

        expect(wrapper.emitted('buzz')).toBeUndefined()
    })

    it('locks the buzzer while a Daily Double wager is being played', async () => {
        await open({ wager: 400 })

        expect(document.body.textContent).toContain('400')
        expect(buzzer()?.disabled).toBe(true)
    })

    it('offers no buzzer to a spectator without a seat', async () => {
        await open({ seat: null })

        expect(buzzer()).toBeNull()
        expect(document.body.textContent).toContain('You are watching this game.')
    })
})
