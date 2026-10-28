import Image from 'next/image'

import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'
import type { SocialItem } from '@/lib/social'

const snippet = (text: string, max: number): string => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat
}

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso))

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  )
}
function CarouselIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 3h11a2 2 0 0 1 2 2v11h-2V5H7V3Zm-3 4h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
    </svg>
  )
}

const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>

/** Instagram tile: a square crop that links out to the post. */
export function InstagramTile({ item }: { item: SocialItem }) {
  if (!item.image) return null
  const kind =
    item.mediaType === 'video' ? 'Video' : item.mediaType === 'carousel' ? 'Carousel' : null
  return (
    <a
      href={item.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-square overflow-hidden bg-stone-100"
    >
      <Image
        src={item.image.src}
        alt={item.image.alt}
        width={item.image.width}
        height={item.image.height}
        sizes="(max-width: 768px) 33vw, 25vw"
        placeholder={item.image.blurDataURL ? 'blur' : 'empty'}
        blurDataURL={item.image.blurDataURL}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      {kind ? (
        <span className="absolute right-2 top-2 text-paper drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {item.mediaType === 'video' ? <VideoIcon /> : <CarouselIcon />}
          <span className="sr-only">{kind}. </span>
        </span>
      ) : null}
      <span className="sr-only">View on Instagram{NEW_TAB}</span>
    </a>
  )
}

/** Facebook card: optional image, trimmed text, date and a link to the post. */
export function FacebookCard({ item }: { item: SocialItem }) {
  return (
    <article className="flex h-full flex-col border border-stone-200 bg-paper">
      {item.image ? (
        <Image
          src={item.image.src}
          alt={item.image.alt}
          width={item.image.width}
          height={item.image.height}
          sizes="(max-width: 768px) 100vw, 33vw"
          placeholder={item.image.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={item.image.blurDataURL}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col p-5">
        {item.caption ? <p className="text-stone-700">{snippet(item.caption, 220)}</p> : null}
        <div className="mt-auto flex items-center justify-between gap-4 pt-4 text-sm">
          <time dateTime={item.postedAt} className="text-stone-600">
            {formatDate(item.postedAt)}
          </time>
          <a
            href={item.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline underline-offset-4 hover:text-accent-dark"
          >
            View on Facebook{NEW_TAB}
          </a>
        </div>
      </div>
    </article>
  )
}

export function InstagramGrid({ items, label: aria }: { items: SocialItem[]; label?: string }) {
  return (
    <Reveal items>
      <ul
        aria-label={aria ?? 'Instagram posts'}
        className="grid grid-cols-3 gap-1.5 sm:gap-2 md:grid-cols-4"
      >
        {items.map((item) => (
          <li key={item.id} data-reveal-item>
            <InstagramTile item={item} />
          </li>
        ))}
      </ul>
    </Reveal>
  )
}

export function FacebookGrid({ items, label: aria }: { items: SocialItem[]; label?: string }) {
  return (
    <Reveal items>
      <ul
        aria-label={aria ?? 'Facebook posts'}
        className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item) => (
          <li key={item.id} data-reveal-item>
            <FacebookCard item={item} />
          </li>
        ))}
      </ul>
    </Reveal>
  )
}

/** Combined feed: Instagram tiles take one cell, Facebook cards two, in one date-ordered grid. */
export function CombinedGrid({ items }: { items: SocialItem[] }) {
  return (
    <Reveal items>
      <ul aria-label="Recent posts" className="grid grid-cols-3 gap-1.5 sm:gap-2 md:grid-cols-4">
        {items.map((item) => (
          <li
            key={item.id}
            data-reveal-item
            className={cn(item.platform === 'facebook' && 'col-span-3 md:col-span-2')}
          >
            {item.platform === 'instagram' ? (
              <InstagramTile item={item} />
            ) : (
              <FacebookCard item={item} />
            )}
          </li>
        ))}
      </ul>
    </Reveal>
  )
}
