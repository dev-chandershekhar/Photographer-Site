import { About } from '@/components/sections/About'
import { Contact } from '@/components/sections/Contact'
import { Footer } from '@/components/sections/Footer'
import { Hero } from '@/components/sections/Hero'
import { Portfolio } from '@/components/sections/Portfolio'
import { Social } from '@/components/sections/Social'
import { Services } from '@/components/sections/Services'
import { Testimonials } from '@/components/sections/Testimonials'
import { getHomeContent } from '@/lib/content'
import { buildJsonLd, serializeJsonLd } from '@/lib/seo'

/**
 * Statically rendered; the revalidation hooks refresh it when content changes. The hourly
 * `revalidate` is a safety net (and heals a page built while the database was unreachable).
 */
export const revalidate = 3600

/** Shown only if the image build ran without a database; the container start-up warm-up replaces it. */
function BuildPlaceholder() {
  return (
    <main id="main" className="grid min-h-[60svh] place-items-center px-6 text-center">
      <p className="text-lg text-stone-700">This site is starting up. Please refresh in a moment.</p>
    </main>
  )
}

export default async function HomePage() {
  let content: Awaited<ReturnType<typeof getHomeContent>>
  try {
    content = await getHomeContent()
  } catch (error) {
    // Docker/CI builds usually have no database. Don't fail the build then; at run time errors still surface.
    if (process.env.NEXT_PHASE === 'phase-production-build') return <BuildPlaceholder />
    throw error
  }
  const { site, hero, about, portfolio, services, testimonials, social } = content

  const sections = [
    'about',
    ...(portfolio.photos.length > 0 ? ['portfolio'] : []),
    ...(services.length > 0 ? ['services'] : []),
    ...(testimonials.length > 0 ? ['testimonials'] : []),
    ...(social ? ['social'] : []),
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildJsonLd(site, services)) }} />
      <main id="main">
        <Hero hero={hero} fallbackHeading={site.siteTitle} />
        <About about={about} />
        <Portfolio photos={portfolio.photos} categories={portfolio.categories} />
        <Services services={services} />
        <Testimonials testimonials={testimonials} />
        {social ? <Social feed={social} /> : null}
        <Contact site={site} services={services} />
      </main>
      <Footer site={site} sections={sections} />
    </>
  )
}
