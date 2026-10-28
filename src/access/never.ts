/**
 * Denies the operation over REST/GraphQL/admin. Server code that must perform it
 * (contact form action, social sync, seed) uses the Local API with `overrideAccess: true`.
 */
export const never = (): boolean => false
