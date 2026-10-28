import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { resolveImage } from '@/lib/media'
import type { Testimonial } from '@/payload-types'

function Stars({ rating }: { rating: number }) {
  return (
    <p role="img" aria-label={`${rating} out of 5 stars`} className="flex gap-1 text-accent-light">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="16"
          height="16"
          viewBox="0 0 20 20"
          aria-hidden="true"
          fill={n <= rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.25"
        >
          <path d="M10 1.8l2.4 5.2 5.7.7-4.2 3.9 1.1 5.6L10 14.4 5 17.2l1.1-5.6L1.9 7.7l5.7-.7z" />
        </svg>
      ))}
    </p>
  )
}

/** Renders nothing when there are no published testimonials (the nav hides its link too). */
export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="on-dark bg-ink py-section text-paper"
    >
      <Container>
        <SectionHeading
          id="testimonials-heading"
          tone="dark"
          eyebrow="Kind words"
          title="What clients say"
        />
        <Reveal items className="mt-14">
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => {
              const photo = resolveImage(t.photo, 'thumb')
              return (
                <li key={t.id} className="flex" data-reveal-item>
                  <figure className="flex w-full flex-col border border-stone-800 bg-ink-soft p-8">
                    <Stars rating={t.rating} />
                    <blockquote className="mt-5 font-display text-2xl leading-snug text-paper">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-auto flex items-center gap-4 pt-8">
                      {photo ? (
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          width={56}
                          height={56}
                          sizes="56px"
                          placeholder={photo.blurDataURL ? 'blur' : 'empty'}
                          blurDataURL={photo.blurDataURL}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : null}
                      <span className="text-sm font-medium uppercase tracking-button text-stone-200">
                        {t.clientName}
                      </span>
                    </figcaption>
                  </figure>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </Container>
    </section>
  )
}
