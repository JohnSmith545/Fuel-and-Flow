import { initTRPC, TRPCError } from '@trpc/server'

// Define the Context type (simulated for now, would come from Firebase Admin in prod)
export interface Context {
  user: {
    uid: string;
    email?: string;
  } | null;
}

const t = initTRPC.context<Context>().create()

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  })
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
export const createCallerFactory = t.createCallerFactory
