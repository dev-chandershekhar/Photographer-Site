'use server'

import { headers } from 'next/headers'

import { getPayloadClient } from '@/lib/payload'

import { runSocialSync } from './sync'

/** "Sync now" in the admin. Requires a logged-in admin; never callable anonymously. */
export async function syncNowAction(): Promise<{ ok: boolean; message: string }> {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return { ok: false, message: 'You must be logged in.' }
  const result = await runSocialSync()
  return { ok: result.ok, message: result.message }
}
