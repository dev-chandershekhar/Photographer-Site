import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Inquiries } from './collections/Inquiries'
import { Media } from './collections/Media'
import { Photos } from './collections/Photos'
import { Services } from './collections/Services'
import { SocialPosts } from './collections/SocialPosts'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { About } from './globals/About'
import { Hero } from './globals/Hero'
import { SiteSettings } from './globals/SiteSettings'
import { SocialSettings } from './globals/SocialSettings'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * R2 is enabled when all R2 env vars are set. Without them (e.g. a fresh local
 * checkout) uploads fall back to local disk so `pnpm dev` still works.
 */
const r2Enabled = Boolean(
  process.env.R2_ENDPOINT &&
    process.env.R2_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_PUBLIC_URL,
)
const r2PublicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Categories,
    Photos,
    Services,
    Testimonials,
    Inquiries,
    SocialPosts,
  ],
  globals: [SiteSettings, Hero, About, SocialSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  // No `serverURL`: it makes local media URLs absolute (http://host/api/media/...), which
  // next/image rejects. Relative URLs match `images.localPatterns` in next.config.ts.
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Schema changes always go through migrations (see CLAUDE.md §3), in dev too.
    // Mixing dev "push" with migrations makes `payload migrate` prompt and stall.
    push: false,
    // Run pending migrations on boot in production (container start).
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [
    s3Storage({
      enabled: r2Enabled,
      // Keep the DB schema identical whether or not R2 is configured.
      alwaysInsertFields: true,
      collections: {
        media: {
          // Files are served straight from the R2 public domain (cacheable by
          // Cloudflare), not proxied through Payload.
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            [r2PublicUrl, prefix, filename].filter(Boolean).join('/'),
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        endpoint: process.env.R2_ENDPOINT || '',
        region: 'auto',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
