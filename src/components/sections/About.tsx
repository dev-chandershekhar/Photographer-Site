import { RichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { cn } from '@/lib/cn'
import { resolveImage } from '@/lib/media'
import type { About as AboutContent } from '@/payload-types'

/** Typography for CMS rich text (no typography plugin: styled with the site tokens). */
const richTextClass = cn(
  'text-lg leading-relaxed text-stone-700',
  '[&_p]:mt-5 [&_p:first-child]:mt-0',
  '[&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-subheading [&_h2]:text-ink',
  '[&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-ink',
  '[&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-accent-dark',
  '[&_strong]:font-semibold [&_strong]:text-ink',
)

export function About({ about }: { about: AboutContent }) {
  const portrait = resolveImage(about.portrait, 'grid')
  const stats = about.stats ?? []

  return (
    <section id="about" aria-labelledby="about-heading" className="py-section">
      <Container
        className={cn('grid gap-12 lg:gap-20', portrait && 'lg:grid-cols-12 lg:items-center')}
      >
        {portrait ? (
          <Reveal className="lg:col-span-5" y={40}>
            <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
              <Image
                src={portrait.src}
                alt={portrait.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                placeholder={portrait.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={portrait.blurDataURL}
                className="object-cover"
                style={
                  portrait.objectPosition ? { objectPosition: portrait.objectPosition } : undefined
                }
              />
            </div>
          </Reveal>
        ) : null}

        <div className={cn(portrait && 'lg:col-span-7')}>
          <SectionHeading id="about-heading" eyebrow="About" title={about.heading} />
          {about.bio ? (
            <Reveal delay={0.1}>
              <RichText data={about.bio} className={cn('mt-8 max-w-copy', richTextClass)} />
            </Reveal>
          ) : null}

          {stats.length > 0 ? (
            <Reveal items className="mt-12">
              <dl className="grid grid-cols-2 gap-8 border-t border-stone-200 pt-8 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.id ?? stat.label}
                    className="flex flex-col-reverse"
                    data-reveal-item
                  >
                    <dt className="mt-1 text-xs font-medium uppercase tracking-eyebrow text-stone-600">
                      {stat.label}
                    </dt>
                    <dd className="font-display text-4xl text-ink">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
