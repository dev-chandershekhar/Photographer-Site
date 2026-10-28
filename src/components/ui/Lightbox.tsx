'use client'

import { useEffect, useRef } from 'react'
import YARLightbox, { type ControllerRef, type Slide } from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'

export type LightboxSlide = Slide & { title?: string; description?: string }

type LightboxProps = {
  slides: LightboxSlide[]
  open: boolean
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

export function Lightbox({ slides, open, index, onClose, onIndexChange }: LightboxProps) {
  const ref = useRef<ControllerRef>(null)

  // YARL only hears keys while focus is inside it. When focus sits on the
  // browser's focus edge (BODY), handle Escape and arrows ourselves.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      const inside = document.querySelector('.yarl__root')?.contains(document.activeElement)
      if (event.key === 'Escape') onClose()
      else if (!inside && event.key === 'ArrowRight') ref.current?.next()
      else if (!inside && event.key === 'ArrowLeft') ref.current?.prev()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <YARLightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Captions]}
      on={{ view: ({ index: next }) => onIndexChange(next) }}
      controller={{ ref, closeOnBackdropClick: true }}
      carousel={{ finite: slides.length < 2, preload: 1 }}
      captions={{ descriptionTextAlign: 'center' }}
      styles={{ container: { backgroundColor: 'rgb(21 21 21 / 0.96)' } }}
    />
  )
}
