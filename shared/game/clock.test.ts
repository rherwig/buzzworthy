import { describe, expect, it } from 'vitest'
import { MAX_BUZZ_BACKDATE_MS, correctBuzzTime, sampleOffset, updateOffset } from './clock'

describe('sampleOffset', () => {
    it('estimates the offset as the difference between client time and server midpoint', () => {
        const sample = { serverSent: 100, clientTime: 1000, serverReceived: 200 }
        expect(sampleOffset(sample)).toBe(850)
    })
})

describe('updateOffset', () => {
    it('takes the first sample as-is', () => {
        const sample = { serverSent: 100, clientTime: 1000, serverReceived: 200 }
        expect(updateOffset(null, sample)).toBe(850)
    })

    it('smooths later samples using OFFSET_SMOOTHING', () => {
        const sample1 = { serverSent: 100, clientTime: 1000, serverReceived: 200 }
        const sample2 = { serverSent: 300, clientTime: 1250, serverReceived: 400 }

        const offset1 = updateOffset(null, sample1)
        expect(updateOffset(offset1, sample2)).toBe(875)
    })
})

describe('correctBuzzTime', () => {
    const serverNow = 5000
    const offset = 1000

    it('translates client time to server time', () => {
        expect(correctBuzzTime(5500, offset, serverNow)).toBe(4500)
    })

    it('clamps to serverNow (cannot buzz in the future)', () => {
        expect(correctBuzzTime(7000, offset, serverNow)).toBe(5000)
    })

    it('clamps to MAX_BUZZ_BACKDATE_MS (cannot buzz too far in the past)', () => {
        const minAllowed = serverNow - MAX_BUZZ_BACKDATE_MS
        expect(correctBuzzTime(serverNow - 2000, 0, serverNow)).toBe(minAllowed)
    })

    it('ensures correct press order even with different clock offsets', () => {
        const serverNow = 10000

        const correctedA = correctBuzzTime(9200, 200, serverNow)
        const correctedB = correctBuzzTime(8900, -200, serverNow)

        expect(correctedA).toBeLessThan(correctedB)
        expect(correctedA).toBe(9000)
        expect(correctedB).toBe(9100)
    })
})
