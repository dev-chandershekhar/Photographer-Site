/**
 * Simple in-memory sliding-window limiter. Fine for a single container (our deployment);
 * counts reset on restart, and it is not shared between instances.
 */
const hits = new Map<string, number[]>()
let lastSweep = 0

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (now - lastSweep > windowMs) {
    lastSweep = now
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k)
    }
  }
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}
