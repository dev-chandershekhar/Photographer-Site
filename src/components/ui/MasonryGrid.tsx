import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * Masonry layout with pure CSS columns: no JavaScript, renders on the server, and no layout
 * shift as long as each item reserves its aspect ratio (next/image width/height do that).
 * Columns mirror the `sizes` hint used for the images: 2 (<640px), 3 (<1024px), 4.
 */
export function MasonryGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cn('columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4', className)}>
      {children}
    </ul>
  )
}

export function MasonryItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <li data-reveal-item className={cn('mb-3 break-inside-avoid sm:mb-4', className)}>
      {children}
    </li>
  )
}
