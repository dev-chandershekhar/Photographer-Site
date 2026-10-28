import type { GlobalConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { never } from '../access/never'
import { revalidateGlobalAfterChange } from '../hooks/revalidateFrontend'

/**
 * Public read is allowed for the display fields only. Token fields are admin-only
 * (field-level `read`), so anonymous API requests never receive them.
 *
 * Server code reading this global with the Local API bypasses access control by
 * default, so always pass `select` (display fields only) or `overrideAccess: false`
 * when fetching it for the public page.
 */
const adminOnly = { read: authenticated, update: authenticated }

export const SocialSettings: GlobalConfig = {
  slug: 'social-settings',
  label: 'Social Feed',
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Display',
          fields: [
            { name: 'heading', type: 'text', defaultValue: 'Follow along' },
            { name: 'subheading', type: 'text' },
            { name: 'instagramEnabled', type: 'checkbox', defaultValue: false },
            { name: 'facebookEnabled', type: 'checkbox', defaultValue: false },
            { name: 'postsToShow', type: 'number', defaultValue: 8, min: 1, max: 24 },
            {
              name: 'layout',
              type: 'select',
              defaultValue: 'tabs',
              options: [
                { label: 'Tabs (one feed per platform)', value: 'tabs' },
                { label: 'Combined feed', value: 'combined' },
              ],
            },
          ],
        },
        {
          label: 'Connections',
          description: 'Private. These values are never shown on the website or in the public API.',
          fields: [
            { name: 'instagramToken', type: 'text', access: adminOnly },
            { name: 'instagramTokenExpiresAt', type: 'date', access: adminOnly },
            { name: 'facebookPageId', type: 'text', access: adminOnly },
            { name: 'facebookPageToken', type: 'text', access: adminOnly },
          ],
        },
        {
          label: 'Sync status',
          fields: [
            {
              name: 'syncNow',
              type: 'ui',
              admin: { components: { Field: '/components/admin/SyncNowButton#SyncNowButton' } },
            },
            {
              name: 'lastSyncAt',
              type: 'date',
              access: { read: authenticated, update: never },
              admin: { readOnly: true },
            },
            {
              name: 'lastSyncStatus',
              type: 'select',
              defaultValue: 'never',
              options: [
                { label: 'Never run', value: 'never' },
                { label: 'Success', value: 'success' },
                { label: 'Failed', value: 'failed' },
              ],
              access: { read: authenticated, update: never },
              admin: { readOnly: true },
            },
          ],
        },
      ],
    },
  ],
}
