export function createRateLimiter({
  windowMs,
  maxRequests,
  keyGenerator,
  message = "Too many requests. Please try again later."
}) {
  const hits = new Map();

  function pruneExpiredEntries(now) {
    for (const [key, entry] of hits.entries()) {
      if (entry.expiresAt <= now) {
        hits.delete(key);
      }
    }
  }

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    pruneExpiredEntries(now);

    const key = keyGenerator(req);
    const current = hits.get(key);

    if (!current || current.expiresAt <= now) {
      hits.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        message,
        retry_after_seconds: retryAfterSeconds
      });
    }

    current.count += 1;
    hits.set(key, current);
    return next();
  };
}
