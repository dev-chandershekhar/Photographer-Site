// Waits for the app (and database) to be healthy, then regenerates the static home page.
const base = `http://127.0.0.1:${process.env.PORT || 3000}`
const secret = process.env.CRON_SECRET
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

for (let attempt = 1; attempt <= 40; attempt++) {
  try {
    const health = await fetch(`${base}/internal/health`, { signal: AbortSignal.timeout(20000) })
    if (health.ok) {
      if (secret) {
        await fetch(`${base}/internal/cron/revalidate`, { headers: { 'x-cron-secret': secret } })
      }
      await fetch(`${base}/`) // renders the fresh page into the cache
      console.log('warmup: home page regenerated')
      process.exit(0)
    }
  } catch {
    /* not up yet */
  }
  await sleep(5000)
}
console.error('warmup: gave up waiting for a healthy app; the hourly revalidate will fix the page')
process.exit(0)
