import type { Media } from '@/payload-types'

export type ImageSize = 'thumb' | 'grid' | 'full'

export type ResolvedImage = {
  src: string
  width: number
  height: number
  /** Always passed through to `<Image alt>`. */
  alt: string
  blurDataURL?: string
  /** CSS object-position from the focal point set in the admin, e.g. "30% 60%". */
  objectPosition?: string
}

/**
 * Picks the smallest Payload size that fits the use (thumb / grid / full) and returns
 * everything `next/image` needs. Returns null for unpopulated or incomplete media.
 */
export const resolveImage = (
  media: number | Media | null | undefined,
  size: ImageSize = 'grid',
): ResolvedImage | null => {
  if (!media || typeof media === 'number') return null
  const variant = media.sizes?.[size]
  const src = variant?.url ?? media.url
  const width = variant?.width ?? media.width
  const height = variant?.height ?? media.height
  if (!src || !width || !height) return null

  return {
    src,
    width,
    height,
    alt: media.alt,
    blurDataURL: media.blurDataURL ?? undefined,
    objectPosition:
      media.focalX != null && media.focalY != null ? `${media.focalX}% ${media.focalY}%` : undefined,
  }
}

/** Resolves a list of media relationships, dropping any that aren't populated. */
export const resolveImages = (
  items: Array<number | Media> | null | undefined,
  size: ImageSize = 'grid',
): ResolvedImage[] =>
  (items ?? []).map((item) => resolveImage(item, size)).filter((img): img is ResolvedImage => img !== null)
