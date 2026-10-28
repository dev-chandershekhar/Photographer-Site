import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import sharp from 'sharp'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateFrontend'

/** Tiny blurred WebP as a base64 data URI, used as the `next/image` blur placeholder. */
const generateBlurDataURL: CollectionBeforeChangeHook = async ({ data, req }) => {
  const file = req.file
  if (!file?.data || !file.mimetype?.startsWith('image/')) return data
  try {
    const buffer = await sharp(file.data)
      .rotate()
      .resize(16, 16, { fit: 'inside' })
      .blur(1)
      .webp({ quality: 40 })
      .toBuffer()
    return { ...data, blurDataURL: `data:image/webp;base64,${buffer.toString('base64')}` }
  } catch (error) {
    req.payload.logger.warn(`Could not generate blur placeholder: ${(error as Error).message}`)
    return data
  }
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'createdAt'],
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeChange: [generateBlurDataURL],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the photo for screen readers and search engines.' },
    },
    { name: 'caption', type: 'text' },
    {
      name: 'blurDataURL',
      type: 'text',
      admin: { readOnly: true, hidden: true },
    },
  ],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    focalPoint: true,
    adminThumbnail: 'thumb',
    // Original is capped at 2560px on the longest side and stored as WebP.
    resizeOptions: {
      width: 2560,
      height: 2560,
      fit: 'inside',
      withoutEnlargement: true,
    },
    formatOptions: { format: 'webp', options: { quality: 82 } },
    // Resized variants don't inherit the top-level format, so each one asks for WebP.
    imageSizes: [
      {
        name: 'thumb',
        width: 400,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 75 } },
      },
      {
        name: 'grid',
        width: 1024,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'full',
        width: 2560,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
    ],
  },
}
