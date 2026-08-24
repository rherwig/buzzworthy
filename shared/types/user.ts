import { z } from 'zod'

/**
 * Shared contract between client and Nitro server.
 * Zod schema is the single source of truth; the type is derived from it.
 */
export const userSchema = z.object({
    id: z.number().int().positive(),
    email: z.string().email(),
    name: z.string().nullable(),
})

export type User = z.infer<typeof userSchema>

export const createUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1).optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
