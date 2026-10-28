import type { CollectionConfig, Field } from 'payload'

import { authenticated } from '../access/authenticated'
import { never } from '../access/never'

/** Submitted by the contact form; admins can only change `status`. */
const locked = { update: never }

const fields: Field[] = [
  { name: 'name', type: 'text', required: true, access: locked },
  { name: 'email', type: 'email', required: true, access: locked },
  { name: 'phone', type: 'text', access: locked },
  { name: 'eventDate', type: 'date', access: locked },
  { name: 'sessionType', type: 'text', access: locked },
  { name: 'message', type: 'textarea', required: true, access: locked },
  {
    name: 'status',
    type: 'select',
    defaultValue: 'new',
    required: true,
    index: true,
    options: [
      { label: 'New', value: 'new' },
      { label: 'Replied', value: 'replied' },
      { label: 'Booked', value: 'booked' },
      { label: 'Archived', value: 'archived' },
    ],
    admin: { position: 'sidebar' },
  },
  {
    name: 'ip',
    type: 'text',
    access: { read: authenticated, update: never },
    admin: { position: 'sidebar', readOnly: true },
  },
]

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'sessionType', 'eventDate', 'status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  access: {
    // No public read, ever. Created only by the contact form server action via the
    // Local API with `overrideAccess: true`.
    read: authenticated,
    create: never,
    update: authenticated,
    delete: authenticated,
  },
  fields,
}
