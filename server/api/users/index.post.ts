import { createUserSchema, type User } from '~~/shared/types/user'

/**
 * Create a user. Validates the request body at the boundary with Zod.
 */
export default defineEventHandler(async (event): Promise<User> => {
    const body = await readValidatedBody(event, (data) => createUserSchema.parse(data))

    const user = await prisma.user.create({
        data: { email: body.email, name: body.name ?? null },
        select: { id: true, email: true, name: true },
    })

    return user
})
