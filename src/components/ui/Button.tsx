import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'light' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type CommonProps = {
  /** `light` is for use on dark photos/backgrounds. */
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

type LinkButtonProps = CommonProps & { href: string } & Omit<
    ComponentPropsWithoutRef<'a'>,
    keyof CommonProps | 'href'
  >

type NativeButtonProps = CommonProps & { href?: undefined } & Omit<
    ComponentPropsWithoutRef<'button'>,
    keyof CommonProps
  >

export type ButtonProps = LinkButtonProps | NativeButtonProps

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium uppercase tracking-button ' +
  'transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-accent-dark',
  secondary: 'border border-ink text-ink hover:bg-ink hover:text-paper',
  light: 'bg-paper text-ink hover:bg-white',
  ghost: 'text-ink underline decoration-accent decoration-2 underline-offset-8 hover:text-accent',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-10 px-5 py-2 text-xs',
  md: 'min-h-11 px-7 py-3 text-xs',
  lg: 'min-h-14 px-9 py-4 text-sm',
}

const isExternal = (href: string): boolean => /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)

/**
 * A link styled as a button when given `href`, otherwise a native `<button>`.
 * In-page (`#contact`) and internal (`/path`) links use next/link; absolute URLs,
 * `mailto:` and `tel:` render a plain anchor.
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { href, variant = 'primary', size = 'md', className, children, ...rest } = props
    const classes = cn(base, variants[variant], sizes[size], className)

    if (isExternal(href)) {
      const rel = rest.target === '_blank' ? 'noopener noreferrer' : undefined
      return (
        <a href={href} rel={rel} {...rest} className={classes}>
          {children}
        </a>
      )
    }
    return (
      <Link href={href} {...rest} className={classes}>
        {children}
      </Link>
    )
  }

  const { variant = 'primary', size = 'md', className, children, type = 'button', ...rest } = props
  return (
    <button type={type} {...rest} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </button>
  )
}
