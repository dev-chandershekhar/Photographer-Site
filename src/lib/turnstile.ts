// Overridable only so tests can point at a stub; operators leave it unset.
const VERIFY_URL = process.env.TURNSTILE_VERIFY_URL || 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Server-side Turnstile check. Fails closed in production when the secret is missing.
 * In development with no secret configured the check is skipped so the form can be tried.
 */
export async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('turnstile: TURNSTILE_SECRET_KEY is not set; rejecting submission')
      return false
    }
    return true
  }
  if (!token) return false

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip) body.set('remoteip', ip)
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (error) {
    console.error('turnstile: verification request failed:', (error as Error).message)
    return false
  }
}
