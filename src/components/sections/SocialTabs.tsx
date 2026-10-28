'use client'

import { useState, type ReactNode } from 'react'

import { Tabs } from '@/components/ui/Tabs'

/** Client-side switch only; both feeds are rendered on the server and passed in. */
export function SocialTabs({ instagram, facebook }: { instagram: ReactNode; facebook: ReactNode }) {
  const [value, setValue] = useState('instagram')
  return (
    <Tabs
      items={[
        { id: 'instagram', label: 'Instagram' },
        { id: 'facebook', label: 'Facebook' },
      ]}
      value={value}
      onChange={setValue}
      label="Choose a social feed"
      idPrefix="social"
      className="mt-10"
    >
      {value === 'instagram' ? instagram : facebook}
    </Tabs>
  )
}
