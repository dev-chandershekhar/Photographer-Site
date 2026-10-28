import { resolveImage } from '@/lib/media'
import { isHttps } from '@/lib/social/url'
import type { SocialPost, SocialSetting } from '@/payload-types'

export type SocialItem = {
  id: number
  platform: 'instagram' | 'facebook'
  permalink: string
  caption: string
  mediaType: SocialPost['mediaType']
  postedAt: string
  pinned: boolean
  image: ReturnType<typeof resolveImage>
}

export type SocialFeed = {
  heading: string
  subheading: string | null
  layout: 'tabs' | 'combined'
  instagram: SocialItem[]
  facebook: SocialItem[]
  /** Combined feed, already limited to `postsToShow`. */
  combined: SocialItem[]
}

/**
 * Pinned first, then newest; respects `postsToShow` and the enabled platforms.
 * Posts arrive already filtered to `hidden = false` by the query.
 */
export function buildSocialFeed(settings: SocialSetting, posts: SocialPost[]): SocialFeed | null {
  const limit = settings.postsToShow ?? 8
  const items: SocialItem[] = posts
    .filter((p) => isHttps(p.permalink))
    .filter((p) => (p.platform === 'instagram' ? settings.instagramEnabled : settings.facebookEnabled))
    .map((p) => ({
      id: p.id,
      platform: p.platform,
      permalink: p.permalink,
      caption: p.caption ?? '',
      mediaType: p.mediaType,
      postedAt: p.postedAt,
      pinned: Boolean(p.pinned),
      image: resolveImage(p.image, 'thumb'),
    }))
    // Instagram tiles need a picture; Facebook cards can be text-only.
    .filter((p) => p.platform === 'facebook' || p.image !== null)

  items.sort((a, b) => {
    return Number(b.pinned) - Number(a.pinned) || b.postedAt.localeCompare(a.postedAt)
  })

  const instagram = items.filter((i) => i.platform === 'instagram').slice(0, limit)
  const facebook = items.filter((i) => i.platform === 'facebook').slice(0, limit)
  if (instagram.length === 0 && facebook.length === 0) return null

  return {
    heading: settings.heading || 'Follow along',
    subheading: settings.subheading ?? null,
    layout: settings.layout === 'combined' ? 'combined' : 'tabs',
    instagram,
    facebook,
    combined: items.slice(0, limit),
  }
}
