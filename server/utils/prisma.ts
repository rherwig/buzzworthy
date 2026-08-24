import { PrismaClient } from '@prisma/client'

/**
 * Single, reused PrismaClient instance.
 * A global cache prevents exhausting DB connections during dev HMR.
 */
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: useEnv().NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    })

if (useEnv().NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}
