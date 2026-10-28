/**
 * Creates the first admin user (idempotent).
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' pnpm create-admin
 *
 * Alternatively, open /admin on an empty database and use Payload's
 * built-in "create first user" screen.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD to create the admin user.')
  process.exit(1)
}
if (password.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters.')
  process.exit(1)
}

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
  limit: 1,
  overrideAccess: true,
})

if (existing.totalDocs > 0) {
  console.log(`Admin ${email} already exists — nothing to do.`)
} else {
  await payload.create({
    collection: 'users',
    data: { email, password },
    overrideAccess: true,
  })
  console.log(`Created admin ${email}.`)
}

process.exit(0)
