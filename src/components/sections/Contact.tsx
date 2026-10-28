import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Service, SiteSetting } from '@/payload-types'

import { ContactForm } from './ContactForm'

export function Contact({ site, services }: { site: SiteSetting; services: Service[] }) {
  const facts = [
    site.location ? { label: 'Based in', value: site.location } : null,
    site.serviceArea ? { label: 'Travels to', value: site.serviceArea } : null,
  ].filter((f): f is { label: string; value: string } => f !== null)

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="on-dark relative bg-ink py-section text-paper"
    >
      <Container>
        <div className="grid gap-14 lg:grid-cols-[2fr_3fr] lg:gap-20">
          <div>
            <SectionHeading
              id="contact-heading"
              eyebrow="Contact"
              title="Let’s create something together"
              description="Tell me about your day, your session or your idea. I read every message and reply personally."
              tone="dark"
            />
            {facts.length > 0 ? (
              <dl className="mt-10 space-y-5">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-xs uppercase tracking-eyebrow text-accent-light">
                      {fact.label}
                    </dt>
                    <dd className="mt-1 text-lg text-stone-100">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          <Reveal delay={0.1}>
            <ContactForm
              sessionTypes={services.map((s) => s.title)}
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null}
              contactEmail={site.contactEmail}
            />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
