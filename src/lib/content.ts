import { cache } from 'react'

import { buildPortfolio, type Portfolio } from '@/lib/portfolio'
import { getPayloadClient } from '@/lib/payload'
import { buildSocialFeed, type SocialFeed } from '@/lib/social'
import type { About, Hero, Service, SiteSetting, Testimonial } from '@/payload-types'

/**
 * Public site settings. Wrapped in React `cache` so the layout (nav) and the page
 * share one query per render. `overrideAccess: false` keeps public access rules in force.
 */
export const getSiteSettings = cache(async (): Promise<SiteSetting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1, overrideAccess: false })
})

export type HomeContent = {
  site: SiteSetting
  hero: Hero
  about: About
  portfolio: Portfolio
  services: Service[]
  testimonials: Testimonial[]
  social: SocialFeed | null
}

/**
 * Everything the one-page site needs, fetched in parallel through the Local API.
 * Never returns unpublished documents: the `where` is explicit *and* access control
 * is enforced (`overrideAccess: false`), because the Local API skips access by default.
 */
export const getHomeContent = async (): Promise<HomeContent> => {
  const payload = await getPayloadClient()

  const [site, hero, about, photos, services, testimonials, socialSettings, socialPosts] = await Promise.all([
    getSiteSettings(),
    payload.findGlobal({ slug: 'hero', depth: 1, overrideAccess: false }),
    payload.findGlobal({ slug: 'about', depth: 1, overrideAccess: false }),
    payload.find({
      collection: 'photos',
      where: { published: { equals: true } },
      sort: ['order', 'createdAt'],
      // Media + category are populated (depth 1). Generous cap; the grid lazy-loads images.
      limit: 200,
      depth: 1,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'services',
      where: { published: { equals: true } },
      sort: ['order', 'createdAt'],
      limit: 12,
      depth: 0,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'testimonials',
      where: { published: { equals: true } },
      sort: ['order', 'createdAt'],
      limit: 12,
      depth: 1,
      overrideAccess: false,
    }),
    // Token fields are admin-only, so `overrideAccess: false` also keeps them out of this result.
    payload.findGlobal({ slug: 'social-settings', depth: 0, overrideAccess: false }),
    payload.find({
      collection: 'social-posts',
      where: { hidden: { equals: false } },
      sort: ['-pinned', '-postedAt'],
      limit: 200,
      depth: 1,
      overrideAccess: false,
    }),
  ])

  return {
    site,
    hero,
    about,
    portfolio: buildPortfolio(photos.docs),
    services: services.docs,
    testimonials: testimonials.docs,
    social: buildSocialFeed(socialSettings, socialPosts.docs),
  }
}
