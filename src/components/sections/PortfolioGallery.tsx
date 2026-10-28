'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useMemo, useState } from 'react'

import { MasonryGrid, MasonryItem } from '@/components/ui/MasonryGrid'
import { Reveal } from '@/components/ui/Reveal'
import { Tabs } from '@/components/ui/Tabs'
import type { Portfolio } from '@/lib/portfolio'

// The lightbox (and its CSS) only downloads when a visitor first opens a photo or is about to.
const loadLightbox = () => import('@/components/ui/Lightbox').then((m) => m.Lightbox)
const Lightbox = dynamic(loadLightbox, { ssr: false })

const ALL = 'all'

/** Category filter + masonry grid + lightbox. Receives plain data from the server section. */
export function PortfolioGallery({ photos, categories }: Portfolio) {
  const [category, setCategory] = useState<string>(ALL)
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const visible = useMemo(
    () => (category === ALL ? photos : photos.filter((p) => String(p.categoryId) === category)),
    [photos, category],
  )

  const names = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  const slides = useMemo(
    () =>
      visible.map((photo) => ({
        src: photo.full.src,
        alt: photo.full.alt,
        width: photo.full.width,
        height: photo.full.height,
        // Let the browser pick the 1024px or 2560px file for the viewport.
        srcSet: [
          { src: photo.thumb.src, width: photo.thumb.width, height: photo.thumb.height },
          { src: photo.full.src, width: photo.full.width, height: photo.full.height },
        ],
        title: photo.title,
        description: names.get(photo.categoryId),
      })),
    [visible, names],
  )

  const tabs = [
    { id: ALL, label: 'All' },
    ...categories.map((c) => ({ id: String(c.id), label: c.name })),
  ]
  const activeLabel = tabs.find((t) => t.id === category)?.label ?? 'All'

  const content = (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        Showing {visible.length} {visible.length === 1 ? 'photo' : 'photos'}
        {category === ALL ? '' : ` in ${activeLabel}`}
      </p>
      <Reveal items watch={category}>
        <MasonryGrid>
          {visible.map((photo, i) => (
            <MasonryItem key={photo.id}>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`View larger: ${photo.title}`}
                onClick={() => setLightboxIndex(i)}
                onPointerEnter={() => void loadLightbox()}
                onFocus={() => void loadLightbox()}
                className="group relative block w-full overflow-hidden bg-stone-100"
              >
                <Image
                  src={photo.thumb.src}
                  alt={photo.thumb.alt}
                  width={photo.thumb.width}
                  height={photo.thumb.height}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  placeholder={photo.thumb.blurDataURL ? 'blur' : 'empty'}
                  blurDataURL={photo.thumb.blurDataURL}
                  className="h-auto w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-3 pt-10 text-left text-xs font-medium uppercase tracking-button text-paper opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {photo.title}
                </span>
              </button>
            </MasonryItem>
          ))}
        </MasonryGrid>
      </Reveal>
    </>
  )

  return (
    <>
      {categories.length > 1 ? (
        <Tabs
          items={tabs}
          value={category}
          onChange={(id) => {
            setLightboxIndex(-1)
            setCategory(id)
          }}
          label="Filter photos by category"
          idPrefix="portfolio"
        >
          {content}
        </Tabs>
      ) : (
        content
      )}

      {lightboxIndex >= 0 ? (
        <Lightbox
          slides={slides}
          open
          index={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </>
  )
}
