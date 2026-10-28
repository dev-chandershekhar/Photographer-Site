import { isHttps } from './url'
import type { RemotePost } from './types'

const base = () =>
  process.env.FACEBOOK_GRAPH_BASE || `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`

type FbPost = {
  id?: string
  message?: string
  created_time?: string
  permalink_url?: string
  full_picture?: string
}

export function normaliseFacebook(items: FbPost[]): RemotePost[] {
  const posts: RemotePost[] = []
  for (const item of items) {
    if (!item.id || !item.permalink_url || !item.created_time || Number.isNaN(Date.parse(item.created_time))) continue
    if (!isHttps(item.permalink_url)) continue
    // Posts with neither text nor a picture (e.g. bare shares) have nothing to show.
    if (!item.message && !item.full_picture) continue
    posts.push({
      platform: 'facebook',
      externalId: item.id,
      permalink: item.permalink_url,
      caption: item.message,
      mediaType: item.full_picture ? 'image' : 'text',
      imageUrl: item.full_picture,
      postedAt: new Date(item.created_time).toISOString(),
    })
  }
  return posts
}

export async function fetchFacebookPosts(pageId: string, token: string, limit = 50): Promise<RemotePost[]> {
  const url = new URL(`${base()}/${encodeURIComponent(pageId)}/published_posts`)
  url.searchParams.set('fields', 'id,message,created_time,permalink_url,full_picture')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('access_token', token)
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Facebook API responded ${res.status}`)
  const json = (await res.json()) as { data?: FbPost[] }
  return normaliseFacebook(json.data ?? [])
}
