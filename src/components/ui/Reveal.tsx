'use client'

import { useEffect, useRef, type ElementType, type ReactNode } from 'react'

import { loadGsap, motionAllowed, whenIdle } from '@/lib/gsap'

type RevealProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  /**
   * Animate every descendant marked `data-reveal-item` as it scrolls into view (rows are staggered),
   * instead of the wrapper itself.
   */
  items?: boolean
  /** Animate right after load instead of on scroll (for content that starts on screen). */
  immediate?: boolean
  delay?: number
  /** Start offset in px (default 28). */
  y?: number
  /** Re-scan for new `data-reveal-item`s when this changes (e.g. after a filter or tab switch). */
  watch?: unknown
}

/**
 * Scroll-reveal with GSAP.
 *
 * Content is visible by default. When JavaScript is on, globals.css hides unrevealed
 * `[data-reveal]` / `[data-reveal-item]` elements (no flash), GSAP fades them in, and a CSS fail-safe
 * reveals everything if GSAP never loads. Reduced-motion visitors never see anything hidden.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className,
  items = false,
  immediate = false,
  delay = 0,
  y = 28,
  watch,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || !motionAllowed()) return
    let cancelled = false
    let revert: (() => void) | undefined

    const cancelIdle = whenIdle(() => {
      loadGsap()
        .then(({ gsap, ScrollTrigger }) => {
          if (cancelled) return
          const ctx = gsap.context(() => {
            const targets = items
              ? Array.from(
                  root.querySelectorAll<HTMLElement>('[data-reveal-item]:not([data-revealed])'),
                )
              : [root]
            if (targets.length === 0) return
            const show = (els: Element[]) => {
              els.forEach((el) => el.setAttribute('data-revealed', ''))
              gsap.fromTo(
                els,
                { opacity: 0, y },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.85,
                  ease: 'power3.out',
                  delay,
                  stagger: items ? 0.08 : 0,
                  clearProps: 'opacity,transform',
                  overwrite: 'auto',
                },
              )
            }
            // Hold the hidden state at the start values until the trigger fires.
            gsap.set(targets, { opacity: 0, y })
            if (immediate) {
              show(targets)
            } else {
              ScrollTrigger.batch(targets, { start: 'top 90%', once: true, onEnter: show })
            }
          }, root)
          revert = () => ctx.revert()
        })
        .catch(() => {
          // GSAP failed to load: the CSS fail-safe un-hides everything.
        })
    })

    return () => {
      cancelled = true
      cancelIdle()
      revert?.()
    }
  }, [items, immediate, delay, y, watch])

  const Component = Tag as ElementType
  return (
    <Component
      ref={ref}
      className={className}
      {...(items ? { 'data-reveal-group': '' } : { 'data-reveal': '' })}
    >
      {children}
    </Component>
  )
}
