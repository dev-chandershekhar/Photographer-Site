import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * Liveness + database check for Docker and UptimeRobot. Public on purpose and deliberately
 * tiny: it reveals nothing beyond "up" or "down".
 */
export async function GET() {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'categories', overrideAccess: true })
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('health: check failed:', (error as Error).message)
    return NextResponse.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
