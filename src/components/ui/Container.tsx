import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type ContainerProps = {
  as?: ElementType
  className?: string
  children: ReactNode
}

/** Centered, padded content column used by every section. */
export function Container({ as: Tag = 'div', className, children }: ContainerProps) {
  return <Tag className={cn('mx-auto w-full max-w-content px-5 sm:px-8', className)}>{children}</Tag>
}
