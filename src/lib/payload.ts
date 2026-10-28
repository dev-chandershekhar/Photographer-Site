import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

/**
 * Local API client for Server Components, server actions and route handlers.
 * `getPayload` caches the instance internally, so this is cheap to call.
 */
export const getPayloadClient = (): Promise<Payload> => getPayload({ config })
