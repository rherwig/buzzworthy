import type { User } from '~~/shared/types/user'

/**
 * List users. Demonstrates using the shared Prisma client from a Nitro route.
 */
export default defineEventHandler(async (): Promise<User[]> => {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
        orderBy: { createdAt: 'desc' },
    })

    return users
})
