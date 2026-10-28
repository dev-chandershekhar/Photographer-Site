import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { SocialFeed } from '@/lib/social'

import { CombinedGrid, FacebookGrid, InstagramGrid } from './SocialPosts'
import { SocialTabs } from './SocialTabs'

/** Renders nothing without posts (the nav hides its link too). No Meta scripts or iframes. */
export function Social({ feed }: { feed: SocialFeed }) {
  const both = feed.instagram.length > 0 && feed.facebook.length > 0

  let body
  if (feed.layout === 'combined') body = <CombinedGrid items={feed.combined} />
  else if (both) body = <SocialTabs instagram={<InstagramGrid items={feed.instagram} />} facebook={<FacebookGrid items={feed.facebook} />} />
  else if (feed.instagram.length > 0) body = <InstagramGrid items={feed.instagram} />
  else body = <FacebookGrid items={feed.facebook} />

  return (
    <section id="social" aria-labelledby="social-heading" className="py-section">
      <Container>
        <SectionHeading id="social-heading" eyebrow="Social" title={feed.heading} description={feed.subheading ?? undefined} />
        <div className={feed.layout === 'combined' || !both ? 'mt-10' : undefined}>{body}</div>
      </Container>
    </section>
  )
}
