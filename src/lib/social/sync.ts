import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'

import { sendEmail } from '@/lib/email'
import { getPayloadClient } from '@/lib/payload'
import type { SocialPost } from '@/payload-types'

import { fetchFacebookPosts } from './facebook'
import { downloadImage } from './images'
import { fetchInstagramPosts, refreshInstagramToken } from './instagram'
import type { Platform, RemotePost, SyncResult } from './types'

const KEEP_NEWEST = 50
/** Stops cron, "Sync now" and retries from running over each other inside one process. */
let running = false

const quiet = { disableRevalidate: true }
const altFor = (post: RemotePost): string => {
  const label = post.platform === 'instagram' ? 'Instagram' : 'Facebook'
  const text = (post.caption ?? '').replace(/\s+/g, ' ').trim()
  return text ? `${label} post: ${text.slice(0, 110)}` : `${label} post from ${post.postedAt.slice(0, 10)}`
}

async function notifyAdmin(payload: Payload, subject: string, lines: string[]): Promise<void> {
  try {
    const site = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    if (!site.contactEmail) return
    const text = lines.join('\n')
    await sendEmail({
      to: site.contactEmail,
      subject,
      text,
      html: `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)}</pre>`,
    })
  } catch (error) {
    console.error('social: could not email admin:', (error as Error).message)
  }
}

/** Upserts one platform's posts and prunes what disappeared upstream. */
async function syncPlatform(
  payload: Payload,
  platform: Platform,
  remote: RemotePost[],
): Promise<{ created: number; updated: number; deleted: number; errors: string[] }> {
  const errors: string[] = []
  let created = 0
  let updated = 0
  let deleted = 0

  const existing = await payload.find({
    collection: 'social-posts',
    where: { platform: { equals: platform } },
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  const byId = new Map(existing.docs.map((d) => [d.externalId, d]))

  for (const post of remote) {
    try {
      const current = byId.get(post.externalId)
      if (current) {
        // Never touch `hidden` or `pinned`; only refresh upstream-owned text.
        await payload.update({
          collection: 'social-posts',
          id: current.id,
          overrideAccess: true,
          context: quiet,
          data: { permalink: post.permalink, caption: post.caption, postedAt: post.postedAt },
        })
        updated++
        continue
      }
      let imageId: number | undefined
      let mediaType = post.mediaType
      if (post.imageUrl) {
        try {
          const file = await downloadImage(post.imageUrl, `${platform}-${post.externalId}`.replace(/[^\w-]/g, ''))
          const media = await payload.create({
            collection: 'media',
            data: { alt: altFor(post) },
            file,
            overrideAccess: true,
            context: quiet,
          })
          imageId = media.id
        } catch (error) {
          errors.push(`${platform} ${post.externalId}: image — ${(error as Error).message}`)
        }
      }
      // A post whose image failed would render as an empty tile; skip it until the next run.
      if (!imageId && post.mediaType !== 'text') continue
      if (!imageId) mediaType = 'text'
      await payload.create({
        collection: 'social-posts',
        overrideAccess: true,
        context: quiet,
        data: {
          platform,
          externalId: post.externalId,
          permalink: post.permalink,
          caption: post.caption,
          mediaType,
          image: imageId,
          postedAt: post.postedAt,
          hidden: false,
          pinned: false,
        },
      })
      created++
    } catch (error) {
      errors.push(`${platform} ${post.externalId}: ${(error as Error).message}`)
    }
  }

  // Prune: gone upstream AND outside the newest KEEP_NEWEST locally.
  const remoteIds = new Set(remote.map((p) => p.externalId))
  if (remote.length > 0) {
    const newestFirst = [...existing.docs].sort((a, b) => b.postedAt.localeCompare(a.postedAt))
    for (const doc of newestFirst.slice(KEEP_NEWEST)) {
      if (remoteIds.has(doc.externalId)) continue
      try {
        const mediaId = typeof doc.image === 'object' && doc.image ? doc.image.id : doc.image
        await payload.delete({ collection: 'social-posts', id: doc.id, overrideAccess: true, context: quiet })
        if (mediaId) await payload.delete({ collection: 'media', id: mediaId, overrideAccess: true, context: quiet })
        deleted++
      } catch (error) {
        errors.push(`${platform} prune ${doc.externalId}: ${(error as Error).message}`)
      }
    }
  }
  return { created, updated, deleted, errors }
}

export async function runSocialSync(): Promise<SyncResult> {
  if (running) return { ok: false, message: 'A sync is already running.', created: 0, updated: 0, deleted: 0, errors: [] }
  running = true
  const payload = await getPayloadClient()
  const total: SyncResult = { ok: true, message: '', created: 0, updated: 0, deleted: 0, errors: [] }
  try {
    const settings = await payload.findGlobal({ slug: 'social-settings', depth: 0, overrideAccess: true })
    const jobs: Array<{ platform: Platform; fetch: () => Promise<RemotePost[]> }> = []
    if (settings.instagramEnabled) {
      const token = settings.instagramToken
      if (token) jobs.push({ platform: 'instagram', fetch: () => fetchInstagramPosts(token) })
      else total.errors.push('Instagram is enabled but has no access token.')
    }
    if (settings.facebookEnabled) {
      const { facebookPageId: pageId, facebookPageToken: token } = settings
      if (pageId && token) jobs.push({ platform: 'facebook', fetch: () => fetchFacebookPosts(pageId, token) })
      else total.errors.push('Facebook is enabled but has no page ID or token.')
    }
    if (jobs.length === 0 && total.errors.length === 0) {
      return { ...total, skipped: true, message: 'No platform is enabled, nothing to sync.' }
    }

    for (const job of jobs) {
      try {
        const remote = await job.fetch()
        const r = await syncPlatform(payload, job.platform, remote)
        total.created += r.created
        total.updated += r.updated
        total.deleted += r.deleted
        total.errors.push(...r.errors)
      } catch (error) {
        total.errors.push(`${job.platform}: ${(error as Error).message}`)
      }
    }

    total.ok = total.errors.length === 0
    total.message = total.ok
      ? `Synced: ${total.created} new, ${total.updated} updated, ${total.deleted} removed.`
      : `Finished with problems: ${total.errors.length} error(s).`
    await payload.updateGlobal({
      slug: 'social-settings',
      overrideAccess: true,
      context: quiet,
      data: { lastSyncAt: new Date().toISOString(), lastSyncStatus: total.ok ? 'success' : 'failed' },
    })
    if (!total.ok) {
      console.error('social: sync problems:', total.errors.join(' | '))
      await notifyAdmin(payload, 'Social feed sync failed', [
        'The website could not fully sync your social feed.',
        '',
        ...total.errors.slice(0, 10),
        '',
        'Check the connection tokens in Admin → Social Feed.',
      ])
    }
    try {
      revalidatePath('/')
    } catch {
      /* not inside a Next.js request (e.g. a script) */
    }
    return total
  } catch (error) {
    console.error('social: sync crashed:', (error as Error).message)
    await notifyAdmin(payload, 'Social feed sync failed', ['The social feed sync stopped unexpectedly.'])
    return { ...total, ok: false, message: 'Sync failed.', errors: [...total.errors, (error as Error).message] }
  } finally {
    running = false
  }
}

/** Extends the Instagram token (Meta allows it once it is at least a day old and not expired). */
export async function runTokenRefresh(): Promise<{ ok: boolean; message: string }> {
  const payload = await getPayloadClient()
  try {
    const settings = await payload.findGlobal({ slug: 'social-settings', depth: 0, overrideAccess: true })
    if (!settings.instagramEnabled || !settings.instagramToken) return { ok: true, message: 'Nothing to refresh.' }
    const refreshed = await refreshInstagramToken(settings.instagramToken)
    await payload.updateGlobal({
      slug: 'social-settings',
      overrideAccess: true,
      context: quiet,
      data: { instagramToken: refreshed.token, instagramTokenExpiresAt: refreshed.expiresAt },
    })
    return { ok: true, message: `Instagram token refreshed until ${refreshed.expiresAt.slice(0, 10)}.` }
  } catch (error) {
    console.error('social: token refresh failed:', (error as Error).message)
    await notifyAdmin(payload, 'Instagram token refresh failed', [
      'The Instagram access token could not be refreshed. If it expires, the feed will stop updating.',
      'Generate a new token in the Meta developer dashboard and paste it into Admin → Social Feed → Connections.',
    ])
    return { ok: false, message: 'Token refresh failed.' }
  }
}

export type { SocialPost }
