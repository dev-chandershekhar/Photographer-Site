'use server'

import { headers } from 'next/headers'

import { sendInquiryEmails } from '@/lib/email'
import { getSiteSettings } from '@/lib/content'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { contactSchema, type ContactField, type ContactState } from '@/lib/validation'

const MAX_PER_HOUR = 5
const HOUR_MS = 60 * 60 * 1000

const FIELDS: ContactField[] = ['name', 'email', 'phone', 'eventDate', 'sessionType', 'message']

const GENERIC_ERROR = 'Something went wrong. Please try again, or email me directly.'

async function clientIp(): Promise<string | null> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return h.get('cf-connecting-ip') ?? forwarded ?? h.get('x-real-ip') ?? null
}

export async function submitInquiry(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(
    ['name', 'email', 'phone', 'eventDate', 'sessionType', 'message', 'website'].map((k) => [
      k,
      typeof formData.get(k) === 'string' ? (formData.get(k) as string) : undefined,
    ]),
  ) as Record<string, string | undefined>
  const values = Object.fromEntries(FIELDS.map((k) => [k, raw[k] ?? ''])) as Partial<Record<ContactField, string>>
  const turnstileToken = formData.get('cf-turnstile-response')

  // 1. Validate
  const parsed = contactSchema.safeParse({
    ...raw,
    turnstileToken: typeof turnstileToken === 'string' ? turnstileToken : undefined,
  })
  if (!parsed.success) {
    const errors: Partial<Record<ContactField, string>> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as ContactField
      if (FIELDS.includes(key) && !errors[key]) {
        errors[key] = issue.message
      }
    }
    return { ok: false, message: 'Please check the highlighted fields.', errors, values }
  }
  const input = parsed.data

  // 2. Honeypot: pretend it worked so bots learn nothing.
  if (input.website) return { ok: true }

  const ip = await clientIp()

  // 3. Turnstile
  if (!(await verifyTurnstile(input.turnstileToken, ip))) {
    return { ok: false, message: 'We could not verify you are human. Please try again.', values }
  }

  // 4. Rate limit (5 per IP per hour)
  if (!rateLimit(`inquiry:${ip ?? 'unknown'}`, MAX_PER_HOUR, HOUR_MS)) {
    return { ok: false, message: 'Too many messages from your connection. Please try again later, or email me directly.', values }
  }

  // 5. Save first, so an email problem can never lose the inquiry.
  let site
  try {
    const payload = await getPayloadClient()
    site = await getSiteSettings()
    await payload.create({
      collection: 'inquiries',
      overrideAccess: true,
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        eventDate: input.eventDate ? `${input.eventDate}T00:00:00.000Z` : undefined,
        sessionType: input.sessionType,
        message: input.message,
        status: 'new',
        ip: ip ?? undefined,
      },
    })
  } catch (error) {
    console.error('inquiry: save failed:', (error as Error).message)
    return { ok: false, message: GENERIC_ERROR, values }
  }

  // 6. Emails (failures are logged inside, never surfaced).
  try {
    await sendInquiryEmails(input, { siteTitle: site.siteTitle, contactEmail: site.contactEmail })
  } catch (error) {
    console.error('inquiry: email step failed:', (error as Error).message)
  }

  return { ok: true }
}
