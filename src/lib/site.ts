import { getSiteSettings } from '@/lib/content'
import { resolveImage } from '@/lib/media'

export type SiteChrome = {
  siteTitle: string
  logo: { url: string; alt: string; width: number; height: number } | null
}

const FALLBACK: SiteChrome = { siteTitle: 'Photographer', logo: null }

/**
 * The few Site Settings values the layout needs (nav brand). If the database is
 * unreachable (e.g. a build without a database) the layout still renders with a
 * neutral fallback instead of failing.
 */
export const getSiteChrome = async (): Promise<SiteChrome> => {
  try {
    const settings = await getSiteSettings()
    const logo = resolveImage(settings.logo, 'thumb')
    return {
      siteTitle: settings.siteTitle || FALLBACK.siteTitle,
      logo: logo ? { url: logo.src, alt: logo.alt, width: logo.width, height: logo.height } : null,
    }
  } catch (error) {
    console.error('getSiteChrome: falling back to defaults', (error as Error).message)
    return FALLBACK
  }
}
