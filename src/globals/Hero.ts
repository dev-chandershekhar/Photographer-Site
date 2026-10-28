import type { GlobalConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { revalidateGlobalAfterChange } from '../hooks/revalidateFrontend'

export const Hero: GlobalConfig = {
  slug: 'hero',
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'text' },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'Slideshow images. The first one loads first, so make it your best.' },
    },
    { name: 'ctaText', type: 'text', label: 'Button text', defaultValue: 'Get in touch' },
  ],
}
