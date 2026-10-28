'use client'

import { useEffect, useRef } from 'react'

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise: Promise<void> | null = null

const loadScript = (): Promise<void> => {
  if (window.turnstile) return Promise.resolve()
  scriptPromise ??= new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = SCRIPT_SRC
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => {
      scriptPromise = null
      reject(new Error('turnstile script failed'))
    }
    document.head.appendChild(el)
  })
  return scriptPromise
}

type TurnstileProps = {
  siteKey: string
  /** Load the widget only once this becomes true (first interaction with the form). */
  active: boolean
  /** Bump to reset the widget (a token is single-use). */
  resetSignal: number
}

/**
 * Cloudflare Turnstile. The script is fetched only after the visitor starts the form so it
 * does not cost the page any load time. Inside a <form>, Turnstile adds the hidden
 * `cf-turnstile-response` input itself.
 */
export function Turnstile({ siteKey, active, resetSignal }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!active || !container.current || widgetId.current) return
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          theme: 'dark',
          appearance: 'interaction-only',
        })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [active, siteKey])

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current) window.turnstile?.reset(widgetId.current)
  }, [resetSignal])

  useEffect(
    () => () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
    },
    [],
  )

  return <div ref={container} className="min-h-0" />
}
