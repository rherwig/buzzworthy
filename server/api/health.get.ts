/**
 * Simple health-check endpoint.
 * Confirms the Nitro server is up and env validation passed.
 */
export default defineEventHandler(() => {
    const env = useEnv()

    return {
        status: 'ok',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
    }
})
