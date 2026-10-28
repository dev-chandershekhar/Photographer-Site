import type { Access } from 'payload'

/** Public visitors see only `published: true` documents; admins see everything. */
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true
  return { published: { equals: true } }
}
