import { isHttps } from './url'
import type { RemotePost } from './types'

/** Overridable so tests can point at a stub; leave unset in production. */
const base = () => process.env.INSTAGRAM_GRAPH_BASE || 'https://graph.instagram.com'

type IgChild = { media_type?: string; media_url?: string; thumbnail_url?: string }
type IgMedia = {
  id?: string
  caption?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  children?: { data?: IgChild[] }
}

const FIELDS =
  'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}'

export function normaliseInstagram(items: IgMedia[]): RemotePost[] {
  const posts: RemotePost[] = []
  for (const item of items) {
    if (!item.id || !item.permalink || !item.timestamp || Number.isNaN(Date.parse(item.timestamp))) continue
    if (!isHttps(item.permalink)) continue
    const type = item.media_type
    const mediaType = type === 'VIDEO' ? 'video' : type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image'
    const child = item.children?.data?.[0]
    // Videos: store the thumbnail. Carousels: cover image, else the first child's picture.
    const imageUrl =
      mediaType === 'video'
        ? item.thumbnail_url
        : (item.media_url ?? child?.media_url ?? child?.thumbnail_url)
    posts.push({
      platform: 'instagram',
      externalId: item.id,
      permalink: item.permalink,
      caption: item.caption,
      mediaType,
      imageUrl,
      postedAt: new Date(item.timestamp).toISOString(),
    })
  }
  return posts
}

/** Latest media for the account behind the token (Instagram API with Instagram Login). */
export async function fetchInstagramPosts(token: string, limit = 50): Promise<RemotePost[]> {
  const url = new URL(`${base()}/me/media`)
  url.searchParams.set('fields', FIELDS)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('access_token', token)
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Instagram API responded ${res.status}`)
  const json = (await res.json()) as { data?: IgMedia[] }
  return normaliseInstagram(json.data ?? [])
}

/** Extends a long-lived token by another 60 days. */
export async function refreshInstagramToken(token: string): Promise<{ token: string; expiresAt: string }> {
  const url = new URL(`${base()}/refresh_access_token`)
  url.searchParams.set('grant_type', 'ig_refresh_token')
  url.searchParams.set('access_token', token)
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Instagram token refresh responded ${res.status}`)
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token || !json.expires_in) throw new Error('Instagram token refresh returned no token')
  return { token: json.access_token, expiresAt: new Date(Date.now() + json.expires_in * 1000).toISOString() }
}
