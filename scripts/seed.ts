/**
 * Seeds development content: categories, placeholder photos (generated gradients),
 * services, testimonials and the four globals. Does not touch Users or Inquiries.
 *
 *   pnpm seed                     # skips if photos already exist
 *   SEED_RESET=true pnpm seed     # wipes content collections first, then reseeds
 *
 * Revalidation is disabled for every write (`context.disableRevalidate`). Scripts run
 * outside Next.js, so refresh the live site by saving any document in /admin (or
 * restarting) after seeding a deployed environment.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import type { About, Category, Media } from '../src/payload-types'

const context = { disableRevalidate: true }

const payload = await getPayload({ config })

type Palette = [string, string]

const PALETTES: Palette[] = [
  ['#f6d365', '#fda085'],
  ['#667eea', '#764ba2'],
  ['#43cea2', '#185a9d'],
  ['#ee9ca7', '#ffdde1'],
  ['#2193b0', '#6dd5ed'],
  ['#cc2b5e', '#753a88'],
  ['#de6262', '#ffb88c'],
  ['#56ab2f', '#a8e063'],
  ['#232526', '#6b7b8c'],
  ['#ff9966', '#ff5e62'],
  ['#4568dc', '#b06ab3'],
  ['#0f2027', '#2c5364'],
]

const placeholder = async (width: number, height: number, [from, to]: Palette): Promise<Buffer> => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="${width * 0.72}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.12}" fill="#fff" opacity="0.25"/>
  </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer()
}

const createMedia = async (
  name: string,
  alt: string,
  width: number,
  height: number,
  palette: Palette,
): Promise<Media> => {
  const data = await placeholder(width, height, palette)
  return payload.create({
    collection: 'media',
    data: { alt },
    file: { data, mimetype: 'image/jpeg', name: `${name}.jpg`, size: data.length },
    overrideAccess: true,
    context,
  })
}

const wipe = async (p: Payload): Promise<void> => {
  for (const collection of ['photos', 'categories', 'services', 'testimonials', 'social-posts', 'media'] as const) {
    await p.delete({ collection, where: { id: { exists: true } }, overrideAccess: true, context })
  }
  console.log('Cleared existing content.')
}

const paragraph = (text: string) => ({
  type: 'paragraph',
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  textFormat: 0,
  children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
})

const richText = (...paragraphs: string[]): NonNullable<About['bio']> => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: paragraphs.map(paragraph),
  },
})

if (process.env.SEED_RESET === 'true') {
  await wipe(payload)
} else {
  const { totalDocs } = await payload.count({ collection: 'photos', overrideAccess: true })
  if (totalDocs > 0) {
    console.log('Photos already exist — nothing seeded. Use SEED_RESET=true to start over.')
    process.exit(0)
  }
}

// Categories
const categoryNames = ['Weddings', 'Portraits', 'Landscapes', 'Events']
const categories: Category[] = []
for (const [order, name] of categoryNames.entries()) {
  categories.push(
    await payload.create({
      collection: 'categories',
      data: { name, order },
      overrideAccess: true,
      context,
    }),
  )
}

// Photos: a mix of landscape, portrait and square to exercise the masonry grid later.
const shapes: [number, number][] = [
  [1600, 1067],
  [1067, 1600],
  [1400, 1400],
  [1600, 1067],
  [1067, 1600],
  [1600, 1000],
]
for (let i = 0; i < 12; i++) {
  const [w, h] = shapes[i % shapes.length]
  const category = categories[i % categories.length]
  const image = await createMedia(
    `sample-${i + 1}`,
    `Sample ${category.name.toLowerCase()} photo ${i + 1}`,
    w,
    h,
    PALETTES[i % PALETTES.length],
  )
  await payload.create({
    collection: 'photos',
    data: {
      title: `Sample ${category.name} ${Math.floor(i / categories.length) + 1}`,
      image: image.id,
      category: category.id,
      featured: i < 4,
      published: true,
      order: i,
    },
    overrideAccess: true,
    context,
  })
}

// Services
const services = [
  {
    title: 'Portrait Session',
    description: 'A relaxed one-hour session on location or in the studio, with a gallery of edited images.',
    priceFrom: 250,
    features: ['1 hour session', '15 edited images', 'Online gallery'],
  },
  {
    title: 'Wedding Coverage',
    description: 'Full-day storytelling coverage from getting ready through the first dance.',
    priceFrom: 2400,
    features: ['8 hours coverage', '400+ edited images', 'Engagement session included'],
  },
  {
    title: 'Events & Commercial',
    description: 'Corporate events, brand shoots and product photography with fast turnaround.',
    priceFrom: 600,
    features: ['Half or full day', 'Usage licence included', '48-hour preview'],
  },
]
for (const [order, s] of services.entries()) {
  await payload.create({
    collection: 'services',
    data: {
      ...s,
      currency: 'USD',
      features: s.features.map((text) => ({ text })),
      published: true,
      order,
    },
    overrideAccess: true,
    context,
  })
}

// Testimonials
const testimonials = [
  ['Jordan & Sam', 'They made us feel completely at ease, and the photos are better than we imagined.'],
  ['Priya R.', 'Professional, kind and incredibly quick. We got our gallery within a week.'],
  ['Marcus L.', 'The best headshots I have ever had. Highly recommended.'],
]
for (const [order, [clientName, quote]] of testimonials.entries()) {
  await payload.create({
    collection: 'testimonials',
    data: { clientName, quote, rating: 5, published: true, order },
    overrideAccess: true,
    context,
  })
}

// Globals
const ogImage = await createMedia('og-placeholder', 'Social sharing preview', 1200, 630, PALETTES[1])
const portrait = await createMedia('portrait-placeholder', 'Portrait of the photographer', 1000, 1250, PALETTES[3])
const heroImages = await Promise.all(
  [0, 4, 9].map((p, i) => createMedia(`hero-${i + 1}`, `Hero image ${i + 1}`, 2400, 1600, PALETTES[p])),
)

await payload.updateGlobal({
  slug: 'site-settings',
  data: {
    siteTitle: 'Sample Photographer',
    seo: {
      title: 'Sample Photographer — Weddings, Portraits & Events',
      description: 'Placeholder description. Replace it in the admin under Site Settings.',
      ogImage: ogImage.id,
    },
    socialLinks: {
      instagram: 'https://instagram.com/example',
      facebook: 'https://facebook.com/example',
    },
    contactEmail: 'hello@example.com',
    location: 'Your City',
    serviceArea: 'Available for travel',
  },
  overrideAccess: true,
  context,
})

await payload.updateGlobal({
  slug: 'hero',
  data: {
    heading: 'Moments, beautifully told',
    subheading: 'Photography for weddings, portraits and events',
    images: heroImages.map((m) => m.id),
    ctaText: 'Get in touch',
  },
  overrideAccess: true,
  context,
})

await payload.updateGlobal({
  slug: 'about',
  data: {
    heading: 'Hello, I’m your photographer',
    bio: richText(
      'This is placeholder text. Tell visitors who you are, how you work and what makes your photography different.',
      'Replace this and the portrait in the admin under About.',
    ),
    portrait: portrait.id,
    stats: [
      { label: 'Years shooting', value: '10+' },
      { label: 'Weddings', value: '120' },
      { label: 'Happy clients', value: '400+' },
    ],
  },
  overrideAccess: true,
  context,
})

await payload.updateGlobal({
  slug: 'social-settings',
  data: {
    heading: 'Follow along',
    subheading: 'Recent work and behind the scenes',
    instagramEnabled: false,
    facebookEnabled: false,
    postsToShow: 8,
    layout: 'tabs',
  },
  overrideAccess: true,
  context,
})

console.log('Seeded: 4 categories, 12 photos, 3 services, 3 testimonials, 4 globals.')
process.exit(0)
