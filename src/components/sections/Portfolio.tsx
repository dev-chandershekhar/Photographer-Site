import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Portfolio as PortfolioData } from '@/lib/portfolio'

import { PortfolioGallery } from './PortfolioGallery'

/** Renders nothing when there are no published photos (the nav hides its link too). */
export function Portfolio({ photos, categories }: PortfolioData) {
  if (photos.length === 0) return null

  return (
    <section id="portfolio" aria-labelledby="portfolio-heading" className="py-section">
      <Container>
        <SectionHeading
          id="portfolio-heading"
          eyebrow="Portfolio"
          title="Selected work"
          description="A look at recent sessions. Tap any photo to view it larger."
        />
        <div className="mt-12">
          <PortfolioGallery photos={photos} categories={categories} />
        </div>
      </Container>
    </section>
  )
}
