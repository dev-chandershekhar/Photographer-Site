import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Service } from '@/payload-types'

const formatPrice = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

function Check() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-accent"
    >
      <path
        d="M4 9.5l3.5 3.5L14 5.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Renders nothing when there are no published services (the nav hides its link too). */
export function Services({ services }: { services: Service[] }) {
  if (services.length === 0) return null

  return (
    <section id="services" aria-labelledby="services-heading" className="bg-paper-warm py-section">
      <Container>
        <SectionHeading
          id="services-heading"
          eyebrow="Services"
          title="Ways we can work together"
          description="Every session is tailored. These packages are a starting point."
        />
        <Reveal items className="mt-14">
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const features = service.features ?? []
              return (
                <li key={service.id} className="flex" data-reveal-item>
                  <article className="flex w-full flex-col border border-stone-200 bg-paper p-8">
                    <h3 className="font-display text-subheading text-ink">{service.title}</h3>
                    {service.priceFrom != null ? (
                      <p className="mt-3 text-sm uppercase tracking-button text-accent">
                        From {formatPrice(service.priceFrom, service.currency ?? 'USD')}
                      </p>
                    ) : null}
                    <p className="mt-5 text-stone-700">{service.description}</p>
                    {features.length > 0 ? (
                      <ul className="mt-6 space-y-3 text-stone-700">
                        {features.map((feature) => (
                          <li key={feature.id ?? feature.text} className="flex gap-3">
                            <Check />
                            <span>{feature.text}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-auto pt-8">
                      <Button href="#contact" variant="secondary" size="sm">
                        Enquire
                      </Button>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </Container>
    </section>
  )
}
