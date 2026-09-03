import { ZodError } from 'zod'

/**
 * Map a schema failure on data we own (a DB row, a mapped DTO) to an opaque 500.
 * Zod issues describe our internal shapes and must never reach a client; the
 * details are logged instead. Any other error is passed through untouched.
 */
export function toInternalError(error: unknown): unknown {
    if (error instanceof ZodError) {
        console.error('Internal payload failed validation:', error.issues)

        return createError({ statusCode: 500, statusMessage: 'Internal data error' })
    }

    return error
}
