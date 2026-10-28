import type { GlobalConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { revalidateGlobalAfterChange } from '../hooks/revalidateFrontend'

export const About: GlobalConfig = {
  slug: 'about',
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'bio', type: 'richText' },
    { name: 'portrait', type: 'upload', relationTo: 'media' },
    {
      name: 'stats',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
      ],
    },
  ],
}
