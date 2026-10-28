import type { gsap as GsapType } from 'gsap'
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger'

export type GsapKit = { gsap: typeof GsapType; ScrollTrigger: typeof ScrollTriggerType }

let kit: Promise<GsapKit> | null = null

/**
 * Loads GSAP + ScrollTrigger on demand (a separate chunk, so none of it is in the initial JavaScript)
 * and registers the plugin once. Sets `data-gsap` on <html> so the CSS fail-safe stands down.
 */
export function loadGsap(): Promise<GsapKit> {
  kit ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    .then(([g, s]) => {
      g.gsap.registerPlugin(s.ScrollTrigger)
      s.ScrollTrigger.config({ ignoreMobileResize: true })
      document.documentElement.setAttribute('data-gsap', 'ready')
      return { gsap: g.gsap, ScrollTrigger: s.ScrollTrigger }
    })
    .catch((error) => {
      kit = null
      throw error
    })
  return kit
}

/** Runs `callback` when the browser is idle (so animation setup never competes with first paint). */
export function whenIdle(callback: () => void): () => void {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 1200 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(callback, 250)
  return () => clearTimeout(id)
}

export const motionAllowed = (): boolean =>
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
