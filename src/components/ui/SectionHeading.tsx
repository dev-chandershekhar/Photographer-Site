import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'

type SectionHeadingProps = {
  /** Put this on the `<h2>` and reference it from the section with `aria-labelledby`. */
  id?: string
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  /** `dark` is for use on dark backgrounds. */
  tone?: 'light' | 'dark'
  className?: string
}

/** Standard section header. The page's single `<h1>` lives in the Hero, so this is always an `<h2>`. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'light',
  className,
}: SectionHeadingProps) {
  const dark = tone === 'dark'
  return (
    <Reveal
      as="header"
      className={cn('max-w-copy', align === 'center' && 'mx-auto text-center', className)}
    >
      {eyebrow ? (
        <p
          className={cn(
            'text-xs font-medium uppercase tracking-eyebrow',
            dark ? 'text-accent-light' : 'text-accent',
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className={cn('font-display text-heading', eyebrow && 'mt-3', dark && 'text-paper')}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn('mt-4 text-lg', dark ? 'text-stone-200' : 'text-stone-700')}>
          {description}
        </p>
      ) : null}
    </Reveal>
  )
}
