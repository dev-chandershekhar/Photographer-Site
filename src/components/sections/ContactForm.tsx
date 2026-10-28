'use client'

import { useActionState, useEffect, useRef, useState } from 'react'

import { submitInquiry } from '@/app/(frontend)/actions'
import { Button } from '@/components/ui/Button'
import { Turnstile } from '@/components/ui/Turnstile'
import type { ContactField, ContactState } from '@/lib/validation'

const input =
  'mt-2 block w-full border border-stone-400 bg-transparent px-4 py-3 text-base text-paper placeholder:text-stone-400 ' +
  'aria-[invalid=true]:border-red-300'

type ContactFormProps = {
  sessionTypes: string[]
  turnstileSiteKey: string | null
  contactEmail: string
}

export function ContactForm({ sessionTypes, turnstileSiteKey, contactEmail }: ContactFormProps) {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(submitInquiry, { ok: null })
  const [touched, setTouched] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const errors = state.ok === false ? (state.errors ?? {}) : {}
  const values = state.ok === false ? (state.values ?? {}) : {}

  useEffect(() => {
    if (state.ok === true) {
      successRef.current?.focus()
    } else if (state.ok === false) {
      setResetSignal((n) => n + 1)
      const first = (Object.keys(errors) as ContactField[])[0]
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  if (state.ok === true) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="border border-stone-400 p-8 outline-none">
        <h3 className="font-display text-subheading text-paper">Thank you — your message is in.</h3>
        <p className="mt-3 text-stone-200">
          I will reply personally, usually within two working days. A confirmation is on its way to your inbox.
        </p>
      </div>
    )
  }

  const err = (name: ContactField) =>
    errors[name] ? (
      <p id={`contact-${name}-error`} className="mt-1.5 text-sm text-red-300">
        {errors[name]}
      </p>
    ) : null
  const a11y = (name: ContactField) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `contact-${name}-error` : undefined,
  })

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      onFocusCapture={() => setTouched(true)}
      onPointerEnter={() => setTouched(true)}
      className="grid gap-6 sm:grid-cols-2"
    >
      <div>
        <label htmlFor="contact-name" className="text-sm uppercase tracking-button text-stone-200">
          Name <span aria-hidden="true">*</span>
        </label>
        <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={100}
          defaultValue={values.name} className={input} {...a11y('name')} />
        {err('name')}
      </div>
      <div>
        <label htmlFor="contact-email" className="text-sm uppercase tracking-button text-stone-200">
          Email <span aria-hidden="true">*</span>
        </label>
        <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254}
          defaultValue={values.email} className={input} {...a11y('email')} />
        {err('email')}
      </div>
      <div>
        <label htmlFor="contact-phone" className="text-sm uppercase tracking-button text-stone-200">
          Phone <span className="normal-case tracking-normal text-stone-300">(optional)</span>
        </label>
        <input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={30}
          defaultValue={values.phone} className={input} {...a11y('phone')} />
        {err('phone')}
      </div>
      <div>
        <label htmlFor="contact-sessionType" className="text-sm uppercase tracking-button text-stone-200">
          Session type <span className="normal-case tracking-normal text-stone-300">(optional)</span>
        </label>
        <select id="contact-sessionType" name="sessionType" defaultValue={values.sessionType ?? ''}
          className={`${input} bg-ink`} {...a11y('sessionType')}>
          <option value="">Choose one…</option>
          {sessionTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
          <option value="Something else">Something else</option>
        </select>
        {err('sessionType')}
      </div>
      <div className="sm:col-span-2 sm:max-w-[50%]">
        <label htmlFor="contact-eventDate" className="text-sm uppercase tracking-button text-stone-200">
          Date <span className="normal-case tracking-normal text-stone-300">(optional)</span>
        </label>
        <input id="contact-eventDate" name="eventDate" type="date" defaultValue={values.eventDate}
          className={`${input} [color-scheme:dark]`} {...a11y('eventDate')} />
        {err('eventDate')}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="contact-message" className="text-sm uppercase tracking-button text-stone-200">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea id="contact-message" name="message" rows={6} required maxLength={3000}
          defaultValue={values.message} className={input} {...a11y('message')} />
        {err('message')}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {turnstileSiteKey ? (
        <div className="sm:col-span-2">
          <Turnstile siteKey={turnstileSiteKey} active={touched} resetSignal={resetSignal} />
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <div role="alert" className="min-h-0 text-red-300">
          {state.ok === false && !state.errors ? state.message : null}
          {state.ok === false && state.errors ? 'Please check the highlighted fields.' : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button type="submit" variant="light" size="lg" disabled={pending} aria-disabled={pending}>
            {pending ? 'Sending…' : 'Send message'}
          </Button>
          <p className="text-sm text-stone-300">
            Or email{' '}
            <a href={`mailto:${contactEmail}`} className="underline underline-offset-4 hover:text-paper">
              {contactEmail}
            </a>
          </p>
        </div>
      </div>
    </form>
  )
}
