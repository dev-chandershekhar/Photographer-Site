import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { publishedOrAuthenticated } from '../access/publishedOrAuthenticated'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateFrontend'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'priceFrom', 'currency', 'published', 'order'],
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
    { name: 'description', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        { name: 'priceFrom', type: 'number', min: 0, admin: { description: 'Starting price.' } },
        {
          name: 'currency',
          type: 'select',
          defaultValue: 'USD',
          options: ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'],
        },
      ],
    },
    {
      name: 'features',
      type: 'array',
      labels: { singular: 'Feature', plural: 'Features' },
      fields: [{ name: 'text', type: 'text', required: true }],
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
