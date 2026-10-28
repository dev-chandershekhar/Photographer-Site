import { createHash, timingSafeEqual } from 'node:crypto'

import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

import { runSocialSync, runTokenRefresh } from '@/lib/social/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const digest = (value: string) => createHash('sha256').update(value).digest()

/** Constant-time comparison (both sides hashed to equal length first). */
const secretMatches = (provided: string | null): boolean => {
  const expected = process.env.CRON_SECRET
  if (!expected || !provided) return false
  return timingSafeEqual(digest(provided), digest(expected))
}

async function handle(request: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  if (!secretMatches(request.headers.get('x-cron-secret'))) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const { job } = await params
  if (job === 'social-sync') {
    const result = await runSocialSync()
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  }
  if (job === 'token-refresh') {
    const result = await runTokenRefresh()
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  }
  if (job === 'revalidate') {
    // Run by the container entrypoint after start-up (and usable as a deploy hook).
    revalidatePath('/')
    return NextResponse.json({ ok: true, message: 'Revalidated.' })
  }
  return new NextResponse('Not found', { status: 404 })
}

export const GET = handle
export const POST = handle
