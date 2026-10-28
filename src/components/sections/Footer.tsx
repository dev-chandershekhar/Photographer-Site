import { Container } from '@/components/ui/Container'
import { NAV_LINKS } from '@/lib/navigation'
import type { SiteSetting } from '@/payload-types'

const SOCIAL_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  x: 'X',
} as const

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value)

type FooterProps = {
  site: SiteSetting
  /** Section ids that exist on the page, so the footer never links to a missing one. */
  sections: string[]
}

export function Footer({ site, sections }: FooterProps) {
  const social = (Object.keys(SOCIAL_LABELS) as Array<keyof typeof SOCIAL_LABELS>)
    .map((key) => ({ label: SOCIAL_LABELS[key], href: site.socialLinks?.[key] ?? '' }))
    .filter((link) => isHttpUrl(link.href))
  const links = NAV_LINKS.filter(({ id }) => sections.includes(id))
  const place = [site.location, site.serviceArea].filter(Boolean).join(' · ')

  return (
    <footer className="on-dark bg-ink-soft py-14 text-stone-300">
      <Container className="grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-paper">{site.siteTitle}</p>
          {place ? <p className="mt-3 text-sm">{place}</p> : null}
          {site.contactEmail ? (
            <p className="mt-3 text-sm">
              <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-4 hover:text-paper">
                {site.contactEmail}
              </a>
            </p>
          ) : null}
        </div>

        <nav aria-label="Footer">
          <ul className="space-y-3 text-sm uppercase tracking-button">
            {links.map(({ id, label }) => (
              <li key={id}>
                <a href={`#${id}`} className="hover:text-paper">{label}</a>
              </li>
            ))}
            <li>
              <a href="#hero" className="hover:text-paper">Back to top</a>
            </li>
          </ul>
        </nav>

        {social.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-eyebrow text-accent-light">Follow</p>
            <ul aria-label="Social media" className="mt-4 space-y-3 text-sm uppercase tracking-button">
              {social.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-paper">
                    {label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Container>
      <Container className="mt-12 border-t border-stone-700 pt-6 text-xs text-stone-400">
        © {new Date().getFullYear()} {site.siteTitle}. All rights reserved.
      </Container>
    </footer>
  )
}
