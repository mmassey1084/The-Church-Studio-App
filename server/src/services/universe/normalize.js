// server/src/services/universe/normalize.js
import crypto from "crypto";

export function normalizeOccurrence(evLike, slotLike, hostName = "") {
  const startISO =
    slotLike?.startAt ||
    slotLike?.startDate ||
    slotLike?.startTime ||
    evLike?.startDate ||
    null;

  const offerUrl =
    evLike?.offers?.url ||
    (Array.isArray(evLike?.offers) ? evLike.offers.find((o) => o?.url)?.url : null) ||
    evLike?.url ||
    slotLike?.url ||
    null;

  const idSource = evLike?.id || evLike?.url || evLike?.name || "event";

  const locationName =
    evLike?.address ||
    evLike?.venue?.name ||
    evLike?.location?.name ||
    [evLike?.location?.address?.addressLocality, evLike?.location?.address?.addressRegion]
      .filter(Boolean)
      .join(", ") ||
    hostName ||
    "";

  return {
    id: `${idSource}:${startISO ? new Date(startISO).toISOString() : crypto.randomUUID()}`,
    title: evLike?.title || evLike?.name || "Untitled",
    startsAt: startISO ? new Date(startISO).toISOString() : null,
    location: locationName,
    purchaseUrl: offerUrl,
    description: evLike?.description || "",
    _eventId: evLike?.id || null,
  };
}
