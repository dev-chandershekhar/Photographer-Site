import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { publishedOrAuthenticated } from '../access/publishedOrAuthenticated'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateFrontend'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'clientName',
    defaultColumns: ['clientName', 'rating', 'published', 'order'],
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
    { name: 'clientName', type: 'text', required: true },
    { name: 'quote', type: 'textarea', required: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'rating', type: 'number', min: 1, max: 5, defaultValue: 5, required: true },
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
