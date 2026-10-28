'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { loadGsap, motionAllowed, whenIdle } from '@/lib/gsap'
import type { ResolvedImage } from '@/lib/media'

const INTERVAL_MS = 6000

const usePrefersReducedMotion = (): boolean => {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduce(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduce
}

/**
 * Full-bleed crossfading background for the hero (plain CSS opacity transitions: no
 * animation library, so no extra JavaScript on the critical path).
 *
 * - Only the first image is `priority`; the next one is mounted (and so loaded) only after
 *   the page has finished loading, so it never competes with the LCP image.
 * - Visitors with `prefers-reduced-motion` get the first image only: no autoplay, no fade.
 * - Autoplay can be paused (WCAG 2.2.2) with the button in the corner.
 */
export function HeroSlideshow({ images }: { images: ResolvedImage[] }) {
  const reduceMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [warm, setWarm] = useState(false)
  const [seen, setSeen] = useState<number[]>([0])

  const count = images.length
  const slidesRef = useRef<HTMLDivElement>(null)
  const canAnimate = count > 1 && !reduceMotion

  // Start preloading the next image shortly after the page has loaded.
  useEffect(() => {
    if (count < 2) return
    let timer: ReturnType<typeof setTimeout>
    const start = () => {
      timer = setTimeout(() => setWarm(true), 1500)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('load', start)
    }
  }, [count])

  useEffect(() => {
    if (!canAnimate || paused || !warm) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
    return () => clearInterval(id)
  }, [canAnimate, paused, warm, count])

  // Subtle parallax: the slides drift down slowly while the hero scrolls out (desktop only).
  useEffect(() => {
    const el = slidesRef.current
    if (!el || count === 0 || !motionAllowed()) return
    if (!window.matchMedia('(min-width: 768px)').matches) return
    let cancelled = false
    let revert = () => {}
    const cancelIdle = whenIdle(() => {
      loadGsap()
        .then(({ gsap }) => {
          if (cancelled) return
          const ctx = gsap.context(() => {
            gsap.to(el, {
              yPercent: 12,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
            })
          })
          revert = () => ctx.revert()
        })
        .catch(() => {})
    })
    return () => {
      cancelled = true
      cancelIdle()
      revert()
    }
  }, [count])

  useEffect(() => {
    setSeen((s) => (s.includes(index) ? s : [...s, index]))
  }, [index])

  if (count === 0) return null

  const next = (index + 1) % count

  return (
    <>
      <div
        ref={slidesRef}
        className="absolute inset-0 -z-20"
        role="group"
        aria-label="Featured photographs"
      >
        {images.map((image, i) => {
          const mounted = i === 0 || seen.includes(i) || (warm && canAnimate && i === next)
          if (!mounted) return null
          const visible = reduceMotion ? i === 0 : i === index
          return (
            <div
              key={image.src}
              className={cn(
                'absolute inset-0 transition-opacity duration-[1200ms] ease-in-out motion-reduce:transition-none',
                visible ? 'opacity-100' : 'opacity-0',
              )}
              aria-hidden={!visible}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="100vw"
                priority={i === 0}
                fetchPriority={i === 0 ? 'high' : undefined}
                placeholder={image.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={image.blurDataURL}
                className="object-cover"
                style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
              />
            </div>
          )
        })}
      </div>

      {canAnimate ? (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="absolute bottom-6 right-5 z-10 inline-flex h-11 items-center gap-2 bg-ink/60 px-4 text-xs font-medium uppercase tracking-button text-paper backdrop-blur-sm transition-colors hover:bg-ink/80 sm:right-8"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            {paused ? (
              <path d="M3 1.5v11l9-5.5z" />
            ) : (
              <path d="M2.5 1.5h3v11h-3zM8.5 1.5h3v11h-3z" />
            )}
          </svg>
          {paused ? 'Play slideshow' : 'Pause slideshow'}
        </button>
      ) : null}
    </>
  )
}
