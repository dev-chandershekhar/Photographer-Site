import type { ContactInput } from '@/lib/validation'

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export type Message = { to: string; subject: string; html: string; text: string; replyTo?: string }

/**
 * Sends through Resend's REST API (no SDK needed). Returns false instead of throwing so a
 * mail failure can never lose an inquiry. Without RESEND_API_KEY/EMAIL_FROM it logs and skips.
 */
export async function sendEmail(message: Message): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    console.warn('email: RESEND_API_KEY or EMAIL_FROM not set; skipping send')
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error(`email: Resend responded ${res.status}`)
      return false
    }
    return true
  } catch (error) {
    console.error('email: send failed:', (error as Error).message)
    return false
  }
}

const row = (label: string, value: string) =>
  `<tr><td style="padding:4px 16px 4px 0;color:#6b6154;vertical-align:top">${label}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`

export async function sendInquiryEmails(
  input: ContactInput,
  site: { siteTitle: string; contactEmail: string },
): Promise<{ notification: boolean; confirmation: boolean }> {
  const details: Array<[string, string | undefined]> = [
    ['Name', input.name],
    ['Email', input.email],
    ['Phone', input.phone],
    ['Session', input.sessionType],
    ['Date', input.eventDate],
  ]
  const present = details.filter((d): d is [string, string] => Boolean(d[1]))

  const notification = await sendEmail({
    to: site.contactEmail,
    replyTo: input.email,
    subject: `New inquiry from ${input.name}`,
    html: `<div style="font-family:system-ui,sans-serif;color:#151515;line-height:1.5">
<h2 style="font-weight:600">New website inquiry</h2>
<table>${present.map(([l, v]) => row(l, v)).join('')}</table>
<p style="white-space:pre-wrap;border-left:3px solid #8a5a2f;padding-left:12px">${escapeHtml(input.message)}</p>
<p style="color:#6b6154;font-size:13px">Reply to this email to answer ${escapeHtml(input.name)} directly.</p></div>`,
    text: `${present.map(([l, v]) => `${l}: ${v}`).join('\n')}\n\n${input.message}`,
  })

  const confirmation = await sendEmail({
    to: input.email,
    replyTo: site.contactEmail,
    subject: `Thanks for getting in touch — ${site.siteTitle}`,
    html: `<div style="font-family:system-ui,sans-serif;color:#151515;line-height:1.6">
<p>Hi ${escapeHtml(input.name)},</p>
<p>Thank you for your message. I have received it and will reply personally, usually within two working days.</p>
<p style="color:#6b6154">— ${escapeHtml(site.siteTitle)}</p></div>`,
    text: `Hi ${input.name},\n\nThank you for your message. I have received it and will reply personally, usually within two working days.\n\n— ${site.siteTitle}`,
  })

  return { notification, confirmation }
}
