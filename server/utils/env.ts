import { z } from 'zod'

/**
 * Validate server-side environment variables at the boundary (Zod).
 * Import `env` anywhere on the server to get a fully-typed, validated config.
 */
const envSchema = z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export type Env = z.infer<typeof envSchema>

let cached: Env | null = null

export function useEnv(): Env {
    if (cached) {
        return cached
    }

    const parsed = envSchema.safeParse(process.env)

    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
            .join('\n')
        throw new Error(`Invalid environment variables:\n${issues}`)
    }

    cached = parsed.data
    return cached
}
