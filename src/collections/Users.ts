import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/**
 * Admin users only. There is no public sign-up: every operation requires an
 * authenticated admin. Payload's built-in "create first user" screen in /admin
 * (or `pnpm create-admin`) bootstraps the first account.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  access: {
    admin: authenticated,
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}
