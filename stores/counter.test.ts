import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from './counter'

describe('counter store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('starts at zero', () => {
        const store = useCounterStore()
        expect(store.count).toBe(0)
        expect(store.doubled).toBe(0)
    })

    it('increments and doubles', () => {
        const store = useCounterStore()
        store.increment()
        store.increment()
        expect(store.count).toBe(2)
        expect(store.doubled).toBe(4)
    })

    it('resets', () => {
        const store = useCounterStore()
        store.increment()
        store.reset()
        expect(store.count).toBe(0)
    })
})
