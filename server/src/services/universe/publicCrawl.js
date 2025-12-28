// server/src/services/universe/publicCrawl.js
import { env } from "../../config/env.js";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout.js";
import { parseEventJsonLd } from "./jsonld.js";

export async function listEventsFromPublicOrganizer() {
  const slug = env.UNIVERSE_ORGANIZER_SLUG;
  if (!slug) return [];

  const base = env.UNIVERSE_API_BASE.replace(/\/+$/, "");
  const candidates = [
    `${base}/users/${encodeURIComponent(slug)}`,
    `${base}/users/${encodeURIComponent(slug)}/events`,
    `${base}/${encodeURIComponent(slug)}`,
    `${base}/users/${encodeURIComponent(slug)}/events?view=list&sort=upcoming`,
    `${base}/users/${encodeURIComponent(slug)}?view=list&sort=upcoming`,
  ];

  let html = "";
  for (const url of candidates) {
    try {
      const r = await fetchWithTimeout(url, { headers: { Accept: "text/html" } }, 12000);
      if (!r.ok) continue;

      const t = await r.text();
      if (t) {
        html = t;
        break;
      }
    } catch (e) {
      console.warn("[universe/public] organizer fetch failed:", e?.message || e);
    }
  }
  if (!html) return [];

  const abs =
    html.match(/https?:\/\/(?:www\.)?universe\.com\/events\/[a-z0-9-]+(?:-[A-Z0-9]+)?(?:\?[^\s"'<>)]*)?/gi) || [];

  const rel = (html.match(/href=["']\/events\/[a-z0-9-]+(?:-[A-Z0-9]+)?(?:\?[^\s"'<>)]*)?["']/gi) || [])
    .map((h) => h.replace(/^href=["']/, "").replace(/["']$/, ""))
    .map((p) => `${base}${p.startsWith("/") ? "" : "/"}${p}`);

  const urls = [...new Set([...abs, ...rel])].slice(0, 120);
  if (!urls.length) return [];

  const out = [];
  for (const url of urls) {
    try {
      const occ = await parseEventJsonLd(url);
      out.push(...occ);
    } catch (e) {
      console.warn("[universe/public] JSON-LD parse failed:", e?.message || e);
    }
  }

  out.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  return out;
}
