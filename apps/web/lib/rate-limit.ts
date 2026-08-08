type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 5

export function scanRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }

  if (current.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
  }

  current.count += 1
  return { allowed: true, retryAfter: 0 }
}
