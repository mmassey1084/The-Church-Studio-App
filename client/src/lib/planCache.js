// src/lib/planCache.js
const LS_KEY = "sf:plans:v1";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// In-memory cache for this tab
let mem = { at: 0, plans: null };

export function readCache() {
  // Try memory first (fastest)
  if (mem.plans && Date.now() - mem.at < TTL_MS) {
    return { plans: mem.plans, fresh: true };
  }

  // Try localStorage
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { plans: null, fresh: false };
    const { at, plans } = JSON.parse(raw);
    if (Array.isArray(plans)) {
      const fresh = Date.now() - at < TTL_MS;
      // hydrate mem either way so subsequent reads are instant
      mem = { at, plans };
      return { plans, fresh };
    }
  } catch {}
  return { plans: null, fresh: false };
}

export function writeCache(plans) {
  try {
    const at = Date.now();
    mem = { at, plans };
    localStorage.setItem(LS_KEY, JSON.stringify({ at, plans }));
  } catch {}
}

/**
 * Stale-while-revalidate helper:
 * - returns cached (possibly stale) immediately for instant UI
 * - kicks off a background fetch via the provided loader
 * - calls onUpdate(newPlans) when fresh data arrives
 */
export async function swrLoad({ loader, onUpdate }) {
  const cache = readCache();
  // Fire background refresh if stale or empty
  if (!cache.plans || !cache.fresh) {
    try {
      const freshPlans = await loader();
      if (Array.isArray(freshPlans)) {
        writeCache(freshPlans);
        onUpdate && onUpdate(freshPlans);
      }
    } catch (e) {
      // ignore background failures; UI already has cached data
      console.warn("[plans/swr] refresh failed:", e?.message || e);
    }
  }
  return cache;
}
