/**
 * Rate limit in-memory por IP. Útil para login/registro/checkout.
 * En producción con múltiples instancias considerar Redis (ej. Upstash).
 */

const defaultWindowMs = 60 * 1000; // 1 minuto
const defaultMax = 10;

type Entry = { count: number; resetAt: number };

const stores = new Map<string, Map<string, Entry>>();

function getStore(key: string, windowMs: number, maxRequests: number): Map<string, Entry> {
  const storeKey = `${key}-${windowMs}-${maxRequests}`;
  if (!stores.has(storeKey)) stores.set(storeKey, new Map());
  return stores.get(storeKey)!;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  return "unknown";
}

function prune(store: Map<string, Entry>) {
  const now = Date.now();
  for (const [k, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(k);
  }
}

export type RateLimitOptions = { windowMs?: number; max?: number };

export function checkRateLimit(
  req: Request,
  options: RateLimitOptions = {}
): { ok: boolean; retryAfter?: number } {
  const windowMs = options.windowMs ?? defaultWindowMs;
  const maxRequests = options.max ?? defaultMax;
  const store = getStore("auth", windowMs, maxRequests);
  prune(store);
  const ip = getClientIp(req);
  const now = Date.now();
  let entry = store.get(ip);

  if (!entry) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(ip, entry);
    return { ok: true };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true };
}

/** Límite más permisivo para creación de órdenes (checkout). */
export function checkOrderRateLimit(req: Request): { ok: boolean; retryAfter?: number } {
  return checkRateLimit(req, { windowMs: 60 * 1000, max: 15 });
}
