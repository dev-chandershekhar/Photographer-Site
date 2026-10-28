'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { syncNowAction } from '@/lib/social/actions'

/** Custom admin field: runs the same sync as the hourly cron job. */
export function SyncNowButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      <button
        type="button"
        className="btn btn--style-primary btn--size-medium"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(null)
            try {
              setResult(await syncNowAction())
            } catch {
              setResult({ ok: false, message: 'Sync failed. Check the server logs.' })
            }
            router.refresh()
          })
        }
      >
        {pending ? 'Syncing…' : 'Sync now'}
      </button>
      <div role="status" style={{ marginTop: 8, color: result?.ok === false ? 'var(--theme-error-500)' : undefined }}>
        {result?.message}
      </div>
      <p style={{ marginTop: 8, opacity: 0.7 }}>
        Fetches the latest posts now. This also runs automatically every hour.
      </p>
    </div>
  )
}
