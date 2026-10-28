'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { NAV_CTA, NAV_LINKS, SECTION_IDS } from '@/lib/navigation'
import type { SiteChrome } from '@/lib/site'

import { Button } from './Button'

type NavProps = {
  siteTitle: SiteChrome['siteTitle']
  logo?: SiteChrome['logo']
  /**
   * When true (default) the nav is transparent with light text while the page is at the
   * top, which assumes a dark full-bleed hero beneath it, and turns solid after scrolling.
   */
  overHero?: boolean
}

/**
 * Sticky one-page navigation with anchor links, current-section highlighting and an
 * accessible mobile menu (disclosure button; closes on Escape, outside click, link click
 * or when the viewport grows to desktop size).
 */
export function Nav({ siteTitle, logo, overHero = true }: NavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  // Section ids actually on the page; links to missing sections are hidden (null = not checked yet).
  const [present, setPresent] = useState<Set<string> | null>(null)
  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback((returnFocus = false) => {
    setOpen(false)
    if (returnFocus) toggleRef.current?.focus()
  }, [])

  // Solid background once the page has scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Hide links whose section doesn't exist (e.g. an empty Services list).
  useEffect(() => {
    setPresent(new Set(SECTION_IDS.filter((id) => document.getElementById(id))))
  }, [])

  // Highlight the section in the middle band of the viewport.
  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Close the mobile menu on Escape, outside click, or when resized to desktop.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu(true)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) closeMenu()
    }
    const media = window.matchMedia('(min-width: 1024px)')
    const onChange = () => media.matches && closeMenu()
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    media.addEventListener('change', onChange)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      media.removeEventListener('change', onChange)
    }
  }, [open, closeMenu])

  // Light text over the hero; dark text on the solid bar and in the open menu.
  const light = overHero && !scrolled && !open
  const solid = scrolled || open || !overHero

  const links = NAV_LINKS.filter(({ id }) => present === null || present.has(id))

  const linkClass = (id: string) =>
    cn(
      'text-xs font-medium uppercase tracking-button transition-colors duration-200',
      light ? 'text-paper/90 hover:text-paper' : 'text-stone-700 hover:text-accent',
      active === id && (light ? 'text-paper underline decoration-accent-light' : 'text-accent underline'),
      active === id && 'decoration-2 underline-offset-8',
    )

  return (
    <header
      ref={headerRef}
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
        solid ? 'border-b border-stone-200 bg-paper/95 backdrop-blur' : 'bg-transparent',
        light && 'on-dark',
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-nav w-full max-w-content items-center justify-between px-5 sm:px-8"
      >
        <a
          href="#hero"
          onClick={() => closeMenu()}
          className={cn(
            'font-display text-2xl font-medium tracking-tight transition-colors duration-200',
            light ? 'text-paper' : 'text-ink',
          )}
        >
          {logo ? (
            <Image
              src={logo.url}
              alt={siteTitle}
              width={logo.width}
              height={logo.height}
              priority
              sizes="160px"
              className="h-8 w-auto"
            />
          ) : (
            siteTitle
          )}
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          <ul className="flex items-center gap-8">
            {links.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={active === id ? 'location' : undefined}
                  className={linkClass(id)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Button href={`#${NAV_CTA.id}`} size="sm" variant={light ? 'light' : 'primary'}>
            {NAV_CTA.label}
          </Button>
        </div>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            '-mr-2 inline-flex h-11 w-11 items-center justify-center lg:hidden',
            light ? 'text-paper' : 'text-ink',
          )}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            ) : (
              <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      <div id="mobile-menu" hidden={!open} className="border-t border-stone-200 lg:hidden">
        <ul className="mx-auto flex max-w-content animate-fade-in flex-col px-5 py-4 sm:px-8">
          {links.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={() => closeMenu()}
                aria-current={active === id ? 'location' : undefined}
                className={cn(
                  'block py-3 text-sm font-medium uppercase tracking-button',
                  active === id ? 'text-accent' : 'text-stone-700',
                )}
              >
                {label}
              </a>
            </li>
          ))}
          <li className="pt-3">
            <Button href={`#${NAV_CTA.id}`} onClick={() => closeMenu()} className="w-full">
              {NAV_CTA.label}
            </Button>
          </li>
        </ul>
      </div>
    </header>
  )
}
