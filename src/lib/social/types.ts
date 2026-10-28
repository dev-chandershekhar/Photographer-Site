export type Platform = 'instagram' | 'facebook'
export type MediaKind = 'image' | 'video' | 'carousel' | 'text'

/** One upstream post, normalised from either API. */
export type RemotePost = {
  platform: Platform
  externalId: string
  permalink: string
  caption?: string
  mediaType: MediaKind
  /** Signed, expiring Meta CDN URL. Only ever used to download; never stored or rendered. */
  imageUrl?: string
  postedAt: string
}

export type SyncResult = {
  ok: boolean
  skipped?: boolean
  message: string
  created: number
  updated: number
  deleted: number
  errors: string[]
}
