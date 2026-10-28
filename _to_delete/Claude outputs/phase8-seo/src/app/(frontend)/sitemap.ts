import type { MetadataRoute } from 'next'

import { getSiteSettings } from '@/lib/content'
import { siteUrl } from '@/lib/seo'

/** One-page site: a single URL. `lastModified` follows the latest Site Settings change. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let lastModified: Date | undefined
  try {
    const site = await getSiteSettings()
    if (site.updatedAt) lastModified = new Date(site.updatedAt)
  } catch {
    /* database unavailable: omit lastModified */
  }
  return [{ url: `${siteUrl()}/`, lastModified, changeFrequency: 'monthly', priority: 1 }]
}
