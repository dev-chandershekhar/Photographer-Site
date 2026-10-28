import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  Payload,
  RequestContext,
} from 'payload'

/**
 * Re-renders the statically generated one-page site after content changes.
 *
 * Skipped when `req.context.disableRevalidate` is true (seed and sync scripts set it and
 * revalidate once at the end). `revalidatePath` only works inside a Next.js request, so
 * outside one (e.g. `payload run`) it is logged and ignored instead of failing the write.
 */
export const revalidateHomepage = (payload: Payload, context: RequestContext): void => {
  if (context.disableRevalidate === true) return
  try {
    revalidatePath('/')
    payload.logger.info('Revalidated /')
  } catch {
    payload.logger.warn('Skipped revalidation of / (not running inside a Next.js request)')
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc, req }) => {
  revalidateHomepage(req.payload, req.context)
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  revalidateHomepage(req.payload, req.context)
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ doc, req }) => {
  revalidateHomepage(req.payload, req.context)
  return doc
}
