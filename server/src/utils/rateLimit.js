// rateLimit.js — tiny in-memory attempt counter (no extra dependency).
//
// Good enough for a single-server demo: it slows down password guessing and
// mass sign-ups. Counters live in memory, so they reset when the server restarts.

export function createAttemptLimiter({ max, windowMs }) {
  const hits = new Map() // key -> { count, resetAt }

  const entry = (key) => {
    const now = Date.now()
    const e = hits.get(key)
    if (!e || e.resetAt <= now) return null
    return e
  }

  return {
    /** Seconds the caller must wait, or 0 if another attempt is allowed. */
    retryAfter(key) {
      const e = entry(key)
      return e && e.count >= max ? Math.ceil((e.resetAt - Date.now()) / 1000) : 0
    },
    /** Record one attempt (for logins: call this only on a FAILED attempt). */
    hit(key) {
      const e = entry(key)
      if (e) e.count += 1
      else hits.set(key, { count: 1, resetAt: Date.now() + windowMs })
    },
    reset(key) {
      hits.delete(key)
    },
  }
}

export function tooManyAttempts(res, seconds) {
  res.set('Retry-After', String(seconds))
  return res.status(429).json({
    error: { code: 'TOO_MANY_ATTEMPTS', message: `Too many attempts. Try again in ${Math.ceil(seconds / 60)} minute(s).` },
  })
}
