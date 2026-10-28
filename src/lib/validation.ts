import { z } from 'zod'

/** Strip control characters (incl. CR/LF) so values are safe in email headers and logs. */
const clean = (value: string): string => value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim()

const field = (max: number) => z.string().trim().max(max)

export const contactSchema = z.object({
  name: field(100)
    .min(2, 'Please enter your name.')
    .transform(clean),
  email: field(254).email('Please enter a valid email address.').toLowerCase(),
  phone: field(30)
    .regex(/^[0-9+()\-.\s]*$/, 'Use digits, spaces and + ( ) - only.')
    .optional()
    .transform((v) => (v ? v : undefined)),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a valid date.')
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), 'Please choose a valid date.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  sessionType: field(100)
    .transform(clean)
    .optional()
    .transform((v) => (v ? v : undefined)),
  message: field(3000).min(10, 'Please tell me a little more (at least 10 characters).'),
  /** Honeypot: real visitors never see or fill this. */
  website: z.string().max(500).optional(),
  turnstileToken: z.string().max(4096).optional(),
})

export type ContactInput = z.infer<typeof contactSchema>
export type ContactField = 'name' | 'email' | 'phone' | 'eventDate' | 'sessionType' | 'message'

export type ContactState =
  | { ok: null }
  | { ok: true }
  | {
      ok: false
      message: string
      errors?: Partial<Record<ContactField, string>>
      /** Echoed back because React resets the form after an action. */
      values?: Partial<Record<ContactField, string>>
    }
