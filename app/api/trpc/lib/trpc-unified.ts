import { initTRPC } from '@trpc/server'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { ZodError } from 'zod'
import superjson from 'superjson'
import {
  errorMiddleware,
  performanceMiddleware,
  validationMiddleware,
} from './middleware'

// Define the context type
export type TRPCContext = {
  req: Request
  user?: {
    id: string
    email: string
    role: string
  } | null
}

/**
 * Creates context for incoming requests
 */
export const createTRPCContext = async (
  opts: FetchCreateContextFnOptions,
): Promise<TRPCContext> => {
  const { req } = opts

  // Here you would typically get the session/user from a session provider
  // For now, we'll return a basic context with just the request
  return {
    req,
    user: null, // Populate this with authenticated user data if available
  }
}

/**
 * Initialize TRPC
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * Create a router
 */
export const createTRPCRouter = t.router

/**
 * Create a public procedure
 * These procedures can be accessed by anyone
 */
export const publicProcedure = t.procedure
  .use(errorMiddleware)
  .use(performanceMiddleware)
  .use(validationMiddleware)

/**
 * Create a protected procedure
 * These procedures are protected behind authentication
 */
export const protectedProcedure = t.procedure
  .use(errorMiddleware)
  .use(performanceMiddleware)
  .use(validationMiddleware)
  .use(async ({ ctx, next }) => {
    // This is where you would check if the user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to access this resource')
    }

    return next({
      ctx: {
        ...ctx,
        // Pass authenticated user to the next middleware/resolver
        user: ctx.user,
      },
    })
  })

/**
 * Create an admin procedure
 * These procedures are protected behind admin authentication
 */
export const adminProcedure = t.procedure
  .use(errorMiddleware)
  .use(performanceMiddleware)
  .use(validationMiddleware)
  .use(async ({ ctx, next }) => {
    // Check if user is authenticated and is an admin
    if (!ctx.user) {
      throw new Error('You must be logged in to access this resource')
    }

    if (ctx.user.role !== 'admin') {
      throw new Error('You must be an admin to access this resource')
    }

    return next({
      ctx: {
        ...ctx,
        // Pass authenticated admin user to the next middleware/resolver
        user: ctx.user,
      },
    })
  })
