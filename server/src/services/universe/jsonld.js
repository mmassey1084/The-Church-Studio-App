// server/src/services/universe/jsonld.js
import { fetchWithTimeout } from "../../utils/fetchWithTimeout.js";
import { normalizeOccurrence } from "./normalize.js";

function* walkJsonLd(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) yield* walkJsonLd(n);
    return;
  }
  yield node;
  if (node["@graph"]) yield* walkJsonLd(node["@graph"]);
  if (node["graph"]) yield* walkJsonLd(node["graph"]);
  if (node["itemListElement"]) yield* walkJsonLd(node["itemListElement"]);
  if (node["subEvent"]) yield* walkJsonLd(node["subEvent"]);
}

export async function parseEventJsonLd(eventUrl) {
  const r = await fetchWithTimeout(
    eventUrl,
    {
      headers: {
        Accept: "text/html,*/*;q=0.8",
      },
    },
    12000
  );
  if (!r.ok) return [];
  const html = await r.text();

  const scripts = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];

  const out = [];
  for (const m of scripts) {
    let json;
    try {
      json = JSON.parse(m[1].trim());
    } catch {
      continue;
    }

    for (const node of walkJsonLd(json)) {
      if (node?.["@type"] === "Event" && (node.startDate || node.startTime)) {
        out.push(
          normalizeOccurrence(
            { ...node, url: node.url || eventUrl },
            { startDate: node.startDate || node.startTime },
            node?.location?.name || ""
          )
        );
      }

      if (node?.["@type"] === "EventSeries" && Array.isArray(node.subEvent)) {
        for (const se of node.subEvent) {
          if (se?.["@type"] === "Event" && (se.startDate || se.startTime)) {
            out.push(
              normalizeOccurrence(
                { ...se, url: se.url || eventUrl },
                { startDate: se.startDate || se.startTime },
                se?.location?.name || node?.location?.name || ""
              )
            );
          }
        }
      }
    }
  }

  return out;
}
