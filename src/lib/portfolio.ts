import { resolveImage, type ResolvedImage } from '@/lib/media'
import type { Photo } from '@/payload-types'

/** Plain, serializable shapes passed from the server section to the client gallery. */
export type PortfolioCategory = { id: number; name: string; slug: string }

export type PortfolioPhoto = {
  id: number
  title: string
  categoryId: number
  /** `grid` size: used in the masonry grid. */
  thumb: ResolvedImage
  /** `full` size: used in the lightbox. */
  full: ResolvedImage
}

export type Portfolio = {
  photos: PortfolioPhoto[]
  /** Only categories that have at least one published photo, in CMS order. */
  categories: PortfolioCategory[]
}

/**
 * Turns populated Photo documents (depth >= 1) into the gallery's data. Photos whose image
 * or category isn't populated are skipped rather than rendered broken.
 */
export const buildPortfolio = (docs: Photo[]): Portfolio => {
  const categories = new Map<number, PortfolioCategory & { order: number }>()
  const photos: PortfolioPhoto[] = []

  for (const doc of docs) {
    const category = typeof doc.category === 'object' ? doc.category : null
    const thumb = resolveImage(doc.image, 'grid')
    const full = resolveImage(doc.image, 'full')
    if (!category || !thumb || !full) continue

    if (!categories.has(category.id)) {
      categories.set(category.id, {
        id: category.id,
        name: category.name,
        slug: category.slug ?? String(category.id),
        order: category.order ?? 0,
      })
    }
    photos.push({ id: doc.id, title: doc.title, categoryId: category.id, thumb, full })
  }

  return {
    photos,
    categories: [...categories.values()]
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map(({ id, name, slug }) => ({ id, name, slug })),
  }
}
