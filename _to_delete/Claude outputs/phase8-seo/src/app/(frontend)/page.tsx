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

/** Statically rendered; the revalidation hooks refresh it when content changes. */
export default async function HomePage() {
  const { site, hero, about, portfolio, services, testimonials, social } = await getHomeContent()

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
