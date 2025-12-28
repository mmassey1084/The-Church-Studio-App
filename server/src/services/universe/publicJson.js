// server/src/services/universe/publicJson.js
import { env } from "../../config/env.js";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout.js";

export async function listEventsFromPublicJson() {
  const slug = env.UNIVERSE_ORGANIZER_SLUG;
  if (!slug) return [];

  const base = env.UNIVERSE_API_BASE.replace(/\/+$/, "");
  const candidates = [
    `${base}/api/v2/users/${encodeURIComponent(slug)}/events?state=upcoming&per_page=200`,
    `${base}/api/v2/organizers/${encodeURIComponent(slug)}/events?state=upcoming&per_page=200`,
    `${base}/api/v2/${encodeURIComponent(slug)}/events?state=upcoming&per_page=200`,
  ];

  for (const url of candidates) {
    try {
      const headers = {
        Accept: "application/json",
        ...(env.UNIVERSE_ACCESS_TOKEN ? { Authorization: `Bearer ${env.UNIVERSE_ACCESS_TOKEN}` } : {}),
      };

      const r = await fetchWithTimeout(url, { headers }, 12000);
      const text = await r.text();
      if (!r.ok) continue;

      const json = JSON.parse(text);
      const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];

      const out = [];
      for (const ev of arr) {
        const title = ev?.title || ev?.name;
        const urlEv = ev?.url || ev?.web_url || (ev?.links?.self ?? "");
        const venueName = ev?.venue?.name || ev?.location?.name || "";
        const slots = ev?.time_slots || ev?.timeslots || ev?.occurrences || [];

        if (Array.isArray(slots) && slots.length) {
          for (const s of slots) {
            const startAt = s?.start_at || s?.startAt || s?.start_time || s?.startDate;
            if (!startAt) continue;
            out.push({
              id: `${ev?.id || urlEv}:${new Date(startAt).toISOString()}`,
              title: title || "Untitled",
              startsAt: new Date(startAt).toISOString(),
              location: venueName,
              purchaseUrl: ev?.purchase_url || ev?.tickets_url || urlEv || null,
              description: ev?.description || "",
              _eventId: ev?.id || null,
            });
          }
        } else {
          const startAt = ev?.start_at || ev?.startAt || ev?.start_time || ev?.startDate;
          if (startAt) {
            out.push({
              id: `${ev?.id || urlEv}:${new Date(startAt).toISOString()}`,
              title: title || "Untitled",
              startsAt: new Date(startAt).toISOString(),
              location: venueName,
              purchaseUrl: ev?.purchase_url || ev?.tickets_url || urlEv || null,
              description: ev?.description || "",
              _eventId: ev?.id || null,
            });
          }
        }
      }

      out.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      return out;
    } catch (e) {
      console.warn("[universe/public-json] failed:", e?.message || e);
    }
  }

  return [];
}
