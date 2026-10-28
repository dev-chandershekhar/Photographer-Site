/** Permalinks come from an API response; only https links are ever stored or rendered. */
export const isHttps = (value: string): boolean => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
