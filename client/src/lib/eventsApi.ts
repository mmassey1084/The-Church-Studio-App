// Small, shared fetch helpers for the events API (TypeScript)
/// <reference types="vite/client" />

export type UiEvent = {
  id: string;
  startsAt: string | null;
  title: string;
  location?: string | null;
  purchaseUrl?: string | null;
  description?: string | null;
  _eventId?: string | null;
};

const RAW_BASE = (import.meta.env.VITE_API_BASE || "").trim();

// We REQUIRE an absolute base. If it's not absolute, we throw early so you notice.
if (!/^https?:\/\//i.test(RAW_BASE)) {
  // eslint-disable-next-line no-console
  console.error(
    `[eventsApi] VITE_API_BASE must be an absolute URL (got "${RAW_BASE}"). ` +
      `Set it in your .env, e.g. VITE_API_BASE=https://<your-ngrok>.ngrok-free.dev`
  );
}

export const API_BASE = RAW_BASE.replace(/\/+$/, "");
export const TZ = "America/Chicago";

/** Internal: fetch with short timeout and the ngrok header */
async function apiFetchJson(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "1",
        ...(init.headers || {}),
      },
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
    });

    const ct = res.headers.get("content-type") || "";
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} – ${text.slice(0, 180)}`);
    }
    if (!ct.includes("application/json") || text.trim().startsWith("<")) {
      // This is the exact error you were seeing—surface it clearly.
      throw new Error(
        `Expected JSON, got ${ct}. First bytes: ${text.slice(0, 160)}`
      );
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(id);
  }
}

/** GET /api/_whoami (handy for debugging which API you’re hitting) */
export async function whoAmI() {
  const url = `${API_BASE}/api/_whoami?from=client&_=${Date.now()}`;
  return apiFetchJson(url);
}

/** GET /api/events/day */
export async function getEventsForDay(
  dateIsoYYYYMMDD: string,
  tz: string = TZ
): Promise<{
  events: UiEvent[];
  count: number;
  note?: string;
  source?: string;
}> {
  const url =
    `${API_BASE}/api/events/day` +
    `?date=${encodeURIComponent(dateIsoYYYYMMDD)}&tz=${encodeURIComponent(
      tz
    )}` +
    `&ngrok_skip_browser_warning=1&_=${Date.now()}`;

  return apiFetchJson(url);
}
