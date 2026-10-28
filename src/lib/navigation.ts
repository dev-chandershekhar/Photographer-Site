/** Anchor targets for the one-page site. `id` must match the section element's id. */
export const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'services', label: 'Services' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'social', label: 'Social' },
] as const

export const NAV_CTA = { id: 'contact', label: 'Get in touch' } as const

/** Every section on the page, in order. The nav watches these to highlight the current one. */
export const SECTION_IDS = [
  'hero',
  'about',
  'portfolio',
  'services',
  'testimonials',
  'social',
  'contact',
] as const
