import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Container } from '@/components/ui/Container'
import { resolveImages } from '@/lib/media'
import type { Hero as HeroContent } from '@/payload-types'

import { HeroSlideshow } from './HeroSlideshow'

type HeroProps = {
  hero: HeroContent
  /** Used when the Hero heading hasn't been filled in yet. */
  fallbackHeading: string
}

/** The page's only `<h1>`. Full-bleed slideshow with a dark scrim so text stays readable on any photo. */
export function Hero({ hero, fallbackHeading }: HeroProps) {
  const images = resolveImages(hero.images, 'full')

  return (
    <section
      id="hero"
      aria-label="Introduction"
      className="on-dark relative isolate flex min-h-[100svh] items-end overflow-hidden bg-stone-900 pb-28 pt-[calc(theme(spacing.nav)+2rem)] text-paper sm:pb-section"
    >
      <HeroSlideshow images={images} />
      {/*
        Scrim: keeps text at WCAG AA contrast even over a pure-white photo.
        Bottom (where the text sits): >= 65% ink. Top: >= 70% ink behind the nav bar.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/65 via-55% to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-52 bg-gradient-to-b from-ink/85 via-ink/70 via-35% to-transparent"
      />
      <Container>
        <h1 className="max-w-4xl font-display text-display">{hero.heading || fallbackHeading}</h1>
        {/* The h1 (the page's LCP element) is never animated; the supporting text and button ease in after it. */}
        <Reveal immediate delay={0.15} y={20}>
          {hero.subheading ? (
            <p className="mt-6 max-w-copy text-lg text-paper sm:text-xl">{hero.subheading}</p>
          ) : null}
          <div className="mt-10">
            <Button href="#contact" variant="light" size="lg">
              {hero.ctaText || 'Get in touch'}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
