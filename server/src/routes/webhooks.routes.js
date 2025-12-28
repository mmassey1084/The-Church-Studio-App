// server/src/routes/webhooks.routes.js
import express from "express";
import crypto from "crypto";
import { env } from "../config/env.js";
import { normalizeOccurrence } from "../services/universe/normalize.js";

const router = express.Router();

function safeEqual(a, b) {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function digestsFor(bodyBuf, secret) {
  const h = crypto.createHmac("sha256", secret).update(bodyBuf);
  const hex = h.digest("hex");
  const prefixed = `sha256=${hex}`;
  const base64 = Buffer.from(hex, "hex").toString("base64");
  return { hex, prefixed, base64 };
}

function splitEventsByTime(occurrences) {
  const now = new Date();
  const upcoming_events = [];
  const past_events = [];
  for (const o of occurrences) {
    if (!o?.startsAt) continue;
    const t = new Date(o.startsAt);
    if (t >= now) upcoming_events.push(o);
    else past_events.push(o);
  }
  upcoming_events.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  past_events.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
  return { upcoming_events, past_events };
}

function toBuffer(body) {
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === "string") return Buffer.from(body, "utf8");
  return Buffer.from(JSON.stringify(body ?? {}), "utf8");
}

function universeWebhookHandler(req, res) {
  try {
    const rawBodyBuf = toBuffer(req.body);

    if (env.UNIVERSE_WEBHOOK_SECRET) {
      const headerSigRaw =
        req.header("X-Uniiverse-Signature") ||
        req.header("X-Universe-Signature") ||
        "";

      const { hex, prefixed, base64 } = digestsFor(rawBodyBuf, env.UNIVERSE_WEBHOOK_SECRET);
      const raw = (headerSigRaw || "").trim();
      const lowerPrefixed = raw.toLowerCase();

      const matches =
        safeEqual(raw, hex) || safeEqual(lowerPrefixed, prefixed) || safeEqual(raw, base64);

      if (!matches) return res.status(401).send("invalid signature");
    }

    let payload = {};
    try {
      payload = JSON.parse(rawBodyBuf.toString("utf8"));
    } catch {
      return res.status(400).send("bad json");
    }

    const eventType =
      req.header("X-Uniiverse-Event") ||
      req.header("X-Universe-Event") ||
      payload?.type ||
      "unknown";

    const occurrences = [];
    const pushOcc = (ev, slot, host = "") => {
      const norm = normalizeOccurrence(ev, slot, host);
      if (norm.startsAt) occurrences.push(norm);
    };

    const maybeEvents = [];
    if (payload?.event) maybeEvents.push(payload.event);
    if (Array.isArray(payload?.events)) maybeEvents.push(...payload.events);
    if (payload?.data?.event) maybeEvents.push(payload.data.event);
    if (Array.isArray(payload?.data?.events)) maybeEvents.push(...payload.data.events);

    for (const ev of maybeEvents) {
      const slots = ev?.timeSlots?.nodes || ev?.timeSlots || ev?.occurrences || [];
      if (Array.isArray(slots) && slots.length) {
        for (const s of slots) pushOcc(ev, s, payload?.host?.name || "");
      } else {
        pushOcc(ev, { startDate: ev?.startDate || ev?.startAt }, payload?.host?.name || "");
      }
    }

    const { upcoming_events, past_events } = splitEventsByTime(occurrences);

    return res.status(200).json({
      ok: true,
      received_at: new Date().toISOString(),
      event_type: eventType,
      counts: {
        occurrences_in_payload: occurrences.length,
        upcoming: upcoming_events.length,
        past: past_events.length,
      },
      upcoming_events,
      past_events,
      original_payload: payload,
    });
  } catch (e) {
    console.error("[universe/webhook] error:", e?.message || e);
    return res.status(200).json({ ok: true, error: "handler_error", message: e?.message || String(e) });
  }
}

router.options("/universe", (_req, res) => res.sendStatus(204));
router.get("/universe", (_req, res) =>
  res.status(405).type("text/plain").send(
    "Universe webhook endpoint: use POST with raw body and X-Universe-Signature (HMAC-SHA256)."
  )
);

// IMPORTANT: raw body parser is attached right here on this route
router.post("/universe", express.raw({ type: "*/*", limit: "1mb" }), universeWebhookHandler);

export default router;
