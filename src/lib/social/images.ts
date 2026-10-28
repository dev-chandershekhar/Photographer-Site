const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED_SUFFIXES = ['.cdninstagram.com', '.fbcdn.net', '.facebook.com', '.fbsbx.com']

/** Hosts Meta serves images from, plus the host of a test-stub API base when one is configured. */
const allowedHost = (hostname: string): boolean => {
  const h = hostname.toLowerCase()
  if (ALLOWED_SUFFIXES.some((s) => h.endsWith(s))) return true
  for (const override of [process.env.INSTAGRAM_GRAPH_BASE, process.env.FACEBOOK_GRAPH_BASE]) {
    try {
      if (override && new URL(override).hostname.toLowerCase() === h) return true
    } catch {
      /* ignore malformed override */
    }
  }
  return false
}

export type DownloadedImage = { data: Buffer; mimetype: string; name: string; size: number }

/**
 * Downloads an image from Meta's CDN. The URL comes from an API response, so it is treated as
 * untrusted: https only (http only for a local test stub), an allow-listed host, an image
 * content type, and a size cap. Redirects are not followed.
 */
export async function downloadImage(rawUrl: string, baseName: string): Promise<DownloadedImage> {
  const url = new URL(rawUrl)
  if (!allowedHost(url.hostname)) throw new Error(`image host not allowed: ${url.hostname}`)
  const local = url.hostname === '127.0.0.1' || url.hostname === 'localhost'
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error('image URL must be https')

  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000), cache: 'no-store' })
  if (!res.ok) throw new Error(`image download responded ${res.status}`)
  const mimetype = (res.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase() ?? ''
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mimetype]
  if (!ext) throw new Error(`unsupported image type: ${mimetype || 'unknown'}`)
  const declared = Number(res.headers.get('content-length') ?? 0)
  if (declared > MAX_BYTES) throw new Error('image too large')
  const data = Buffer.from(await res.arrayBuffer())
  if (data.length > MAX_BYTES) throw new Error('image too large')
  return { data, mimetype, name: `${baseName}.${ext}`, size: data.length }
}
