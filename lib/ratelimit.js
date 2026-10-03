// Lightweight in-memory rate limiter (per-process). Adequate for MVP / sensitive endpoints.
const buckets = new Map()

export function rateLimit(key, limit = 10, windowMs = 60 * 1000) {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }
  entry.count += 1
  if (entry.count > limit) return { ok: false, remaining: 0 }
  return { ok: true, remaining: limit - entry.count }
}
