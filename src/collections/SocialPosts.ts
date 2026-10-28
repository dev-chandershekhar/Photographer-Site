import type { Access, CollectionConfig, Field } from 'payload'

import { authenticated } from '../access/authenticated'
import { never } from '../access/never'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateFrontend'

const publicNotHidden: Access = ({ req: { user } }) => {
  if (user) return true
  return { hidden: { equals: false } }
}

/** Written by the sync job; admins can only change `hidden` and `pinned`. */
const locked = { update: never }

const fields: Field[] = [
  {
    name: 'platform',
    type: 'select',
    required: true,
    index: true,
    options: [
      { label: 'Instagram', value: 'instagram' },
      { label: 'Facebook', value: 'facebook' },
    ],
    access: locked,
  },
  { name: 'externalId', type: 'text', required: true, unique: true, index: true, access: locked },
  { name: 'permalink', type: 'text', required: true, access: locked },
  { name: 'caption', type: 'textarea', access: locked },
  {
    name: 'mediaType',
    type: 'select',
    required: true,
    options: [
      { label: 'Image', value: 'image' },
      { label: 'Video', value: 'video' },
      { label: 'Carousel', value: 'carousel' },
      { label: 'Text', value: 'text' },
    ],
    access: locked,
  },
  { name: 'image', type: 'upload', relationTo: 'media', access: locked },
  { name: 'postedAt', type: 'date', required: true, index: true, access: locked },
  {
    name: 'hidden',
    type: 'checkbox',
    defaultValue: false,
    index: true,
    admin: { position: 'sidebar', description: 'Hide this post from the website.' },
  },
  {
    name: 'pinned',
    type: 'checkbox',
    defaultValue: false,
    admin: { position: 'sidebar', description: 'Show this post first.' },
  },
]

export const SocialPosts: CollectionConfig = {
  slug: 'social-posts',
  admin: {
    useAsTitle: 'externalId',
    defaultColumns: ['platform', 'caption', 'postedAt', 'hidden', 'pinned'],
  },
  defaultSort: '-postedAt',
  access: {
    read: publicNotHidden,
    create: never,
    update: authenticated,
    delete: never,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields,
}
