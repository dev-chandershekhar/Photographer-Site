import type { PayloadRequest } from 'payload'

/** True for any logged-in admin. Works for collection, global and field access. */
export const authenticated = ({ req: { user } }: { req: PayloadRequest }): boolean => Boolean(user)
