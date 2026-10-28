import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import React from 'react'

import { Nav } from '@/components/ui/Nav'
import { buildMetadata } from '@/lib/seo'
import { getSiteChrome } from '@/lib/site'

import './globals.css'

// Self-hosted variable fonts (no Google requests, no network needed at build time).
const sans = localFont({
  src: '../fonts/inter-latin-wght-normal.woff2',
  variable: '--font-sans',
  weight: '100 900',
  display: 'swap',
})

const display = localFont({
  src: '../fonts/cormorant-garamond-latin-wght-normal.woff2',
  variable: '--font-display',
  weight: '300 700',
  display: 'swap',
})

export const generateMetadata = (): Promise<Metadata> => buildMetadata()

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { siteTitle, logo } = await getSiteChrome()
  // Self-hosted Umami (cookie-free). Loaded after everything else; omitted unless both vars are set.
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS as available so scroll-reveal content is only hidden when it can be revealed. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:text-paper"
        >
          Skip to content
        </a>
        <Nav siteTitle={siteTitle} logo={logo} />
        {/* The page renders <main id="main"> and the footer. */}
        {children}
        {umamiId && umamiSrc ? (
          <Script
            src={umamiSrc}
            data-website-id={umamiId}
            data-do-not-track="true"
            strategy="lazyOnload"
          />
        ) : null}
      </body>
    </html>
  )
}
