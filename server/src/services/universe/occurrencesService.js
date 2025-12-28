// server/src/services/universe/occurrencesService.js
import { env } from "../../config/env.js";
import { gqlSafe } from "./universeClient.js";
import { normalizeOccurrence } from "./normalize.js";
import { listEventsFromPublicJson } from "./publicJson.js";
import { listEventsFromPublicOrganizer } from "./publicCrawl.js";
import { fetchTunesAtNoonEvents } from "../tunes/sheetService.js";

const universeCache = new Map(); // id -> occurrence
let universeCacheLast = 0;

async function fetchHostEventsAll(hostId) {
  const SIMPLE = `
    query HostEventsPaged($id: ID!) {
      host(id: $id) {
        events {
          nodes { id title url description address timeSlots { nodes { startAt endAt } } }
        }
      }
    }
  `;
  const d = await gqlSafe(SIMPLE, { id: hostId });
  return d?.host?.events?.nodes || [];
}

async function fetchTimeSlotsAll(eventId) {
  const LEGACY_TS = `
    query EventWithLegacyTS($id: ID!) {
      event(id:$id) { id timeSlots { nodes { startAt endAt } } }
    }
  `;
  const d2 = await gqlSafe(LEGACY_TS, { id: eventId });
  return d2?.event?.timeSlots?.nodes || [];
}

function dedupeKey(o) {
  return [o.title?.trim().toLowerCase(), o.startsAt, o.location?.trim().toLowerCase()]
    .filter(Boolean)
    .join("|");
}

export async function collectUniverseEvents() {
  let gqlOcc = [];
  let hostName = "";

  if (env.UNIVERSE_ORGANIZER_ID) {
    const HOST_Q = `query($id: ID!){ host(id:$id){ id name } }`;
    const host = await gqlSafe(HOST_Q, { id: env.UNIVERSE_ORGANIZER_ID });
    hostName = host?.host?.name || "";

    const events = await fetchHostEventsAll(env.UNIVERSE_ORGANIZER_ID);

    for (const ev of events) {
      let slots = Array.isArray(ev?.timeSlots?.nodes) ? ev.timeSlots.nodes : [];
      if (!slots.length) slots = await fetchTimeSlotsAll(ev.id);

      for (const ts of slots) {
        const start = ts?.startAt || ts?.start_time || ts?.startDate;
        if (!start) continue;
        gqlOcc.push(normalizeOccurrence(ev, { startAt: start }, hostName));
      }
    }
  }

  const [pubJsonOcc, pubCrawlOcc, sheetOcc] = await Promise.all([
    listEventsFromPublicJson(),
    listEventsFromPublicOrganizer(),
    fetchTunesAtNoonEvents(),
  ]);

  const map = new Map();
  for (const o of [...gqlOcc, ...pubJsonOcc, ...pubCrawlOcc, ...sheetOcc]) {
    if (!o?.startsAt) continue;
    const k = dedupeKey(o);
    if (!map.has(k)) map.set(k, o);
  }

  return [...map.values()].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

export async function getUniverseOccurrences() {
  try {
    const merged = await collectUniverseEvents();
    for (const occ of merged) universeCache.set(occ.id, occ);
    universeCacheLast = Date.now();
    return merged;
  } catch (e) {
    console.warn("[events] fetch failed, using cache:", e?.message || e);
    const cached = Array.from(universeCache.values());
    cached.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return cached;
  }
}
