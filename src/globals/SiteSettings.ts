import type { GlobalConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { revalidateGlobalAfterChange } from '../hooks/revalidateFrontend'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    { name: 'siteTitle', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'title', type: 'text', admin: { description: 'Shown in search results and browser tabs.' } },
        { name: 'description', type: 'textarea', admin: { description: 'Around 150 characters.' } },
        { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Social sharing image' },
      ],
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        { name: 'instagram', type: 'text' },
        { name: 'facebook', type: 'text' },
        { name: 'youtube', type: 'text' },
        { name: 'pinterest', type: 'text' },
        { name: 'x', type: 'text', label: 'X (Twitter)' },
      ],
    },
    { name: 'contactEmail', type: 'email', required: true },
    { name: 'location', type: 'text' },
    { name: 'serviceArea', type: 'text' },
  ],
}
