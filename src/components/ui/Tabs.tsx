'use client'

import { useRef, type KeyboardEvent, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type TabItem = { id: string; label: string }

type TabsProps = {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  /** Accessible name for the tab list, e.g. "Filter photos by category". */
  label: string
  /** Unique per instance; used to link tabs and the panel. */
  idPrefix: string
  /** The panel content for the selected tab. */
  children: ReactNode
  className?: string
}

/**
 * WAI-ARIA tabs: roving tabindex, Arrow/Home/End keys (selection follows focus), and a
 * single tabpanel whose content reflects the selected tab.
 */
export function Tabs({ items, value, onChange, label, idPrefix, children, className }: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const tabId = (id: string) => `${idPrefix}-tab-${id}`
  const panelId = `${idPrefix}-panel`

  const focusTab = (id: string) => {
    onChange(id)
    refs.current[id]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === value)
    if (index === -1) return
    const last = items.length - 1
    const target =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null
    if (target === null) return
    event.preventDefault()
    focusTab(items[target].id)
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap gap-x-8 gap-y-3">
        {items.map((item) => {
          const selected = item.id === value
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[item.id] = el
              }}
              type="button"
              role="tab"
              id={tabId(item.id)}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              className={cn(
                'min-h-11 border-b-2 py-2 text-xs font-medium uppercase tracking-button transition-colors duration-200',
                selected
                  ? 'border-accent text-ink'
                  : 'border-transparent text-stone-600 hover:border-stone-300 hover:text-ink',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(value)} className="mt-10">
        {children}
      </div>
    </div>
  )
}
