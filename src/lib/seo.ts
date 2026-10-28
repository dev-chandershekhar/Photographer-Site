import type { Metadata } from 'next'

import { getSiteSettings } from '@/lib/content'
import { resolveImage } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import { isHttps } from '@/lib/social/url'
import type { Service, SiteSetting } from '@/payload-types'

const FALLBACK_TITLE = 'Photographer'
const FALLBACK_DESCRIPTION = 'Photography portfolio'

/** Canonical origin without a trailing slash. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl = (): string => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

/** Social-sharing image: the SEO image from Site Settings, else the first Hero image. */
async function shareImage(site: SiteSetting) {
  const own = resolveImage(site.seo?.ogImage, 'full')
  if (own) return own
  try {
    const payload = await getPayloadClient()
    const hero = await payload.findGlobal({ slug: 'hero', depth: 1, overrideAccess: false })
    const first = hero.images?.[0]
    return resolveImage(first, 'full')
  } catch {
    return null
  }
}

/** Metadata for the whole site, from Site Settings (falls back safely if the database is unreachable). */
export async function buildMetadata(): Promise<Metadata> {
  const base: Metadata = { metadataBase: new URL(siteUrl()), title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION }
  try {
    const site = await getSiteSettings()
    const title = site.seo?.title || site.siteTitle || FALLBACK_TITLE
    const description = site.seo?.description || FALLBACK_DESCRIPTION
    const image = await shareImage(site)
    const images = image ? [{ url: image.src, width: image.width, height: image.height, alt: image.alt }] : undefined

    return {
      ...base,
      title,
      description,
      applicationName: site.siteTitle,
      alternates: { canonical: '/' },
      openGraph: { type: 'website', url: '/', siteName: site.siteTitle, title, description, locale: 'en_US', images },
      twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map((i) => i.url) },
    }
  } catch (error) {
    console.error('buildMetadata: falling back to defaults', (error as Error).message)
    return base
  }
}

/** `ProfessionalService` structured data. Only facts the photographer has entered; no invented ratings. */
export function buildJsonLd(site: SiteSetting, services: Service[]): Record<string, unknown> {
  const url = siteUrl()
  const logo = resolveImage(site.logo, 'full')
  const image = resolveImage(site.seo?.ogImage, 'full') ?? logo
  const sameAs = Object.values(site.socialLinks ?? {}).filter(
    (v): v is string => typeof v === 'string' && isHttps(v),
  )
  const abs = (src: string) => new URL(src, url).toString()

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${url}/#business`,
    name: site.siteTitle,
    url,
    ...(site.seo?.description ? { description: site.seo.description } : {}),
    ...(image ? { image: abs(image.src) } : {}),
    ...(logo ? { logo: abs(logo.src) } : {}),
    ...(site.contactEmail ? { email: site.contactEmail } : {}),
    ...(site.location ? { address: { '@type': 'PostalAddress', addressLocality: site.location } } : {}),
    ...(site.serviceArea ? { areaServed: site.serviceArea } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(services.length > 0
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Photography services',
            itemListElement: services.map((s) => ({
              '@type': 'Offer',
              itemOffered: { '@type': 'Service', name: s.title },
              ...(s.priceFrom != null ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: s.priceFrom, priceCurrency: s.currency ?? 'USD' } } : {}),
            })),
          },
        }
      : {}),
  }
}

/** JSON for a <script type="application/ld+json">: `<` is escaped so content can never close the tag. */
export const serializeJsonLd = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c')
