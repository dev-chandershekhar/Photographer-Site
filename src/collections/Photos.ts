import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { publishedOrAuthenticated } from '../access/publishedOrAuthenticated'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateFrontend'

export const Photos: CollectionConfig = {
  slug: 'photos',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'featured', 'published', 'order'],
  },
  defaultSort: 'order',
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: { position: 'sidebar', description: 'Untick to hide from the website.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
  ],
}
