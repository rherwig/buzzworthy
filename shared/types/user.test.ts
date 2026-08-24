import { describe, it, expect } from 'vitest'
import { createUserSchema } from './user'

describe('createUserSchema', () => {
    it('accepts a valid payload', () => {
        const result = createUserSchema.safeParse({ email: 'a@b.com', name: 'Ada' })
        expect(result.success).toBe(true)
    })

    it('rejects an invalid email', () => {
        const result = createUserSchema.safeParse({ email: 'not-an-email' })
        expect(result.success).toBe(false)
    })
})
