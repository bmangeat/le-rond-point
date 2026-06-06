// Rate limiter simple, en mémoire (fenêtre fixe), par instance serverless.
// Suffisant contre le spam/brute-force basique. Pour une protection forte
// multi-instance, migrer vers Upstash Ratelimit (Redis) — même API d'appel.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Retourne true si l'appel est autorisé, false s'il dépasse la limite.
 * @param key    identifiant unique (ex: `${userId}:comment`)
 * @param limit  nombre d'appels autorisés par fenêtre
 * @param windowMs durée de la fenêtre en ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now > b.resetAt) {
    // Purge légère des entrées expirées pour éviter une croissance illimitée.
    if (buckets.size > 5000) {
      buckets.forEach((v, k) => { if (now > v.resetAt) buckets.delete(k); });
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (b.count >= limit) return false;
  b.count++;
  return true;
}
