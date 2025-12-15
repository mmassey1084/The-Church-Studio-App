// server/index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import compression from "compression";
import { parse as csvParse } from "csv-parse/sync"; // <-- CSV parser

// --- Firebase Admin (server push) + cron scheduler ---
import admin from "firebase-admin";
import cron from "node-cron";
import fs from "fs";

const app = express();

/* ---------------- Env & flags ---------------- */
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.API_HOST || "0.0.0.0";
const isProd = process.env.NODE_ENV === "production";

/* ---- Universe OAuth / API env (server-only) ---- */
const UNIVERSE_CLIENT_ID = process.env.UNIVERSE_CLIENT_ID || "";
const UNIVERSE_CLIENT_SECRET = process.env.UNIVERSE_CLIENT_SECRET || "";
const UNIVERSE_API_BASE =
  process.env.UNIVERSE_API_BASE || "https://www.universe.com";
const UNIVERSE_TOKEN_URL =
  process.env.UNIVERSE_TOKEN_URL || `${UNIVERSE_API_BASE}/oauth/token`;

const UNIVERSE_ACCESS_TOKEN = (process.env.UNIVERSE_ACCESS_TOKEN || "").trim();
/** GraphQL path can be '/graphql', '/graphql/beta', etc. */
const UNIVERSE_GRAPHQL_PATH = (
  process.env.UNIVERSE_GRAPHQL_PATH || "/graphql"
).trim();
/** Organizer identifiers: ID for GraphQL, optional slug for public fallback */
const UNIVERSE_ORGANIZER_ID = (process.env.UNIVERSE_ORGANIZER_ID || "").trim();
const UNIVERSE_ORGANIZER_SLUG = (
  process.env.UNIVERSE_ORGANIZER_SLUG || "the-church-studio"
).trim();
/** Webhook secret (set the same value in Universe UI) */
const UNIVERSE_WEBHOOK_SECRET = (
  process.env.UNIVERSE_WEBHOOK_SECRET || ""
).trim();

/* ---- (Optional) your OAuth redirect URIs, shown here for completeness ---- */
const OAUTH_REDIRECT_WEB =
  process.env.OAUTH_REDIRECT_WEB ||
  "https://epimyocardial-goldie-weightlessly.ngrok-free.dev/auth/callback";
const OAUTH_REDIRECT_ANDROID =
  process.env.OAUTH_REDIRECT_ANDROID || "com.churchstudio.app://oauth/callback";

/* ---- SubscriptionFlow env (server-only) ---- */
const SF_SITE = process.env.SF_SITE;
const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;

/* ---------------- Firebase Admin (server push) - FILE-FIRST INIT ---------------- */
let adminInitialized = false;

function loadFirebaseCreds() {
  // 1) Prefer file path (recommended)
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS; // also supported by Google libs

  if (filePath) {
    try {
      const text = fs.readFileSync(filePath, "utf8");
      return JSON.parse(text);
    } catch (e) {
      console.warn(
        "⚠️ Could not read service account file:",
        filePath,
        e.message
      );
    }
  }

  // 2) Fallback: JSON string in env (plain or base64)
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "";
  if (raw) {
    try {
      const looksB64 =
        /^[A-Za-z0-9+/=]+$/.test(raw.trim()) && !raw.trim().startsWith("{");
      const text = looksB64 ? Buffer.from(raw, "base64").toString("utf8") : raw;
      return JSON.parse(text);
    } catch (e) {
      console.warn(
        "⚠️ JSON in FIREBASE_SERVICE_ACCOUNT_JSON failed to parse:",
        e.message
      );
    }
  }

  // 3) Last resort: split env vars (with escaped newlines)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return {
      type: "service_account",
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  }

  return null;
}

try {
  if (!admin.apps?.length) {
    const cred = loadFirebaseCreds();
    if (!cred) {
      console.warn(
        "⚠️ Firebase Admin NOT initialized (no credentials found). Set FIREBASE_SERVICE_ACCOUNT_FILE=./serviceAccount.json in server/.env"
      );
    } else {
      admin.initializeApp({ credential: admin.credential.cert(cred) });
      adminInitialized = true;
      console.log("✅ Firebase Admin initialized for push");
    }
  } else {
    adminInitialized = true;
  }
} catch (e) {
  console.error("❌ Firebase Admin init failed:", e?.message || e);
}

/* ---------------- App middleware (no body parsers yet) ---------------- */

app.use(cookieParser());

app.use((req, _res, next) => {
  console.log("Origin:", req.headers.origin || "<none>", req.method, req.path);
  next();
});

/* ---- CORS ---- */
function isLocalhostOrigin(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      /^[0-9.]+$/.test(u.hostname)
    );
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (isLocalhostOrigin(origin)) return cb(null, true);

      const allow = (process.env.CORS_ALLOW_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (allow.includes(origin)) return cb(null, true);

      console.warn(`[CORS] Blocked Origin: ${origin}`);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "x-debug-client",
      "ngrok-skip-browser-warning",
      "Cache-Control",
      "Pragma",
      "If-None-Match",
      "If-Modified-Since",
      "X-Uniiverse-Event",
      "X-Uniiverse-Signature",
      "X-Universe-Event",
      "X-Universe-Signature",
    ],
    exposedHeaders: ["Content-Type"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.options("*", cors());

/* ---- Helmet ---- */
app.use(
  helmet({
    crossOriginOpenerPolicy: isProd ? { policy: "same-origin" } : false,
    crossOriginEmbedderPolicy: isProd ? true : false,
    originAgentCluster: isProd ? true : false,
  })
);

/* ---- Compression (gzip) ---- */
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (res.getHeader("Content-Encoding")) return false;
      return compression.filter(req, res);
    },
  })
);

app.use(morgan("dev"));

/* ---------------- Utilities ---------------- */
function fetchWithTimeout(url, opts = {}, ms = 12000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  const headers = {
    "User-Agent": "churchstudio-api/1.0 (+https://thechurchstudio.com)",
    ...opts.headers,
  };
  return fetch(url, { ...opts, headers, signal: controller.signal }).finally(
    () => clearTimeout(t)
  );
}

// Simple api logging / cache-control middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log(
      `[api] ${req.method} ${req.originalUrl}` +
        ` :: ua=${req.headers["user-agent"] || "<none>"} ` +
        `:: x-debug=${req.headers["x-debug-client"] || "<none>"}`
    );
    res.set("Cache-Control", "no-store");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
  }
  next();
});

/* ---------------- Debug / Health ---------------- */
app.get("/", (_req, res) => res.send("✅ Church Studio API is running…"));
app.get("/api/_health", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});
const BOOT_TIME = new Date().toISOString();
app.get("/api/_whoami", (req, res) => {
  res.json({
    pid: process.pid,
    boot: BOOT_TIME,
    host: process.env.HOSTNAME || "local",
    url: req.originalUrl,
  });
});

/* ---------------- SubscriptionFlow token cache ---------------- */
let cachedToken = null;
let tokenExpMs = 0;

async function getAuthToken() {
  if (!SF_SITE || !SF_CLIENT_ID || !SF_CLIENT_SECRET) {
    throw new Error(
      "Missing SubscriptionFlow env vars (SF_SITE, SF_CLIENT_ID, SF_CLIENT_SECRET)"
    );
  }

  const now = Date.now();
  if (cachedToken && tokenExpMs - 10000 > now) return cachedToken;

  const tokenUrl = `https://${SF_SITE}.subscriptionflow.com/oauth/token`;
  console.log("[SF OAuth] POST:", tokenUrl);

  const res = await fetchWithTimeout(
    tokenUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: SF_CLIENT_ID,
        client_secret: SF_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    },
    12000
  );

  const raw = await res.text();
  console.log("[SF OAuth] Raw response:", raw.slice(0, 200));

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("SubscriptionFlow returned non-JSON while getting token");
  }

  if (!res.ok) {
    throw new Error(
      data.error_description || data.message || "SF OAuth failed"
    );
  }

  const { access_token, expires_in } = data || {};
  if (!access_token) throw new Error("SF OAuth response missing access_token");

  cachedToken = access_token;
  tokenExpMs = now + Math.max(30, (expires_in || 3600) - 15) * 1000;
  return cachedToken;
}

/* ---------------- SubscriptionFlow routes ---------------- */
app.get("/api/plans", async (_req, res) => {
  try {
    const token = await getAuthToken();
    if (!SF_SITE) return res.status(500).json({ error: "SF_SITE missing" });

    const candidates = [
      `https://${SF_SITE}.subscriptionflow.com/api/plans`,
      `https://${SF_SITE}.subscriptionflow.com/api/v1/plans`,
    ];

    console.log("🔎 candidates:", candidates);
    console.log(`[SF OAuth] token (prefix): ${(token || "").slice(0, 12)}…`);

    let lastStatus = 0;
    let lastBody = "";

    for (const url of candidates) {
      console.log(`🔎 Fetching plans from: ${url}`);
      const r = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
        12000
      );

      const ct = r.headers.get("content-type") || "";
      console.log(`🧾 SF response: status=${r.status} ct=${ct}`);

      const text = await r.text();
      console.log("🧾 SF response:", r.status, text.slice(0, 200));

      if (r.ok && ct.includes("application/json")) {
        try {
          const json = JSON.parse(text);
          const items = Array.isArray(json) ? json : json?.data ?? [];
          res.type("application/json");
          return res.json(items);
        } catch {
          return res
            .status(502)
            .json({ error: "Invalid JSON from SubscriptionFlow" });
        }
      }
      if ([401, 403].includes(r.status)) {
        return res
          .status(r.status)
          .json({
            error: "Unauthorized with SubscriptionFlow",
            body: text.slice(0, 300),
          });
      }
      lastStatus = r.status;
      lastBody = text;
    }

    return res.status(lastStatus || 502).json({
      error: "Failed to fetch plans",
      details: { lastStatus, body: (lastBody || "").slice(0, 500) },
    });
  } catch (err) {
    console.error("/api/plans error:", err);
    return res
      .status(500)
      .json({ error: "Server Error", details: { message: err.message } });
  }
});

app.get("/api/plans/:id/checkout-url", async (req, res) => {
  try {
    const { id } = req.params;
    const locale = (req.query.locale || "en").trim();
    const successUrl = (req.query.successUrl || "").trim();
    const cancelUrl = (req.query.cancelUrl || "").trim();
    const token = await getAuthToken();

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    const pick = (obj, path) =>
      path
        .split(".")
        .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj || {});

    async function getJSON(url) {
      const r = await fetchWithTimeout(url, { headers }, 12000);
      const text = await r.text();
      console.log(`[checkout-url] ${r.status} ${url}`);
      console.log(`[checkout-url] body: ${text.slice(0, 300)}`);
      if (!r.ok) return null;
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }

    let detail =
      (
        await getJSON(
          `https://${SF_SITE}.subscriptionflow.com/api/v1/plans/${encodeURIComponent(
            id
          )}`
        )
      )?.data ||
      (
        await getJSON(
          `https://${SF_SITE}.subscriptionflow.com/api/plans/${encodeURIComponent(
            id
          )}`
        )
      )?.data;

    if (!detail)
      return res.status(502).json({ error: "Could not load plan detail" });

    const rels = detail.relationships || {};
    const attrs = detail.attributes || {};

    let productId =
      attrs.product_id ||
      pick(rels, "product.data.id") ||
      pick(rels, "products.data.0.id") ||
      pick(rels, "plan_product.data.id") ||
      pick(rels, "plan_products.data.0.id") ||
      null;

    if (!productId) {
      const prodResp = await getJSON(
        `https://${SF_SITE}.subscriptionflow.com/api/v1/products?filter[plan_id]=${encodeURIComponent(
          id
        )}`
      );
      const arr = Array.isArray(prodResp?.data) ? prodResp.data : [];
      for (const p of arr) {
        productId =
          p.id ||
          pick(p, "attributes.id") ||
          pick(p, "data.id") ||
          pick(p, "attributes.product_id") ||
          p.product_id;
        if (productId) break;
      }
    }

    if (!productId) {
      return res.status(422).json({
        error: "No productId in plan detail or product query",
        notes: "We tried plan, plan-products, and products list.",
      });
    }

    // Base hosted page
    const base = `https://${SF_SITE}.subscriptionflow.com/${locale}/hosted-page/subscribe/${encodeURIComponent(
      id
    )}/product/${encodeURIComponent(productId)}`;

    const u = new URL(base);
    if (successUrl) u.searchParams.set("success_url", successUrl);
    if (cancelUrl) u.searchParams.set("cancel_url", cancelUrl);

    const hosted = u.toString();
    console.log("[checkout-url] hosted URL:", hosted);
    return res.json({ url: hosted, planId: id, productId });
  } catch (err) {
    console.error("/api/plans/:id/checkout-url error:", err);
    return res
      .status(500)
      .json({ error: "Server Error", details: { message: err.message } });
  }
});

/* ---------------- Universe helpers + cache ---------------- */
// Track token metadata for introspection
let uniToken = null;
let uniExpMs = 0;
let uniIssuedMs = 0;
let uniLastOAuth = null; // { token_type, scope, expires_in, ...raw }

// cache (filled by webhook and/or fetch fallback)
const universeCache = new Map(); // id -> occurrence
let universeCacheLast = 0;

async function getUniverseToken() {
  // Prefer explicit access token if provided
  if (UNIVERSE_ACCESS_TOKEN) {
    if (!uniToken) {
      uniToken = UNIVERSE_ACCESS_TOKEN;
      uniIssuedMs = Date.now();
      uniExpMs = 0; // unknown
      uniLastOAuth = {
        note: "Using UNIVERSE_ACCESS_TOKEN from env; expiry unknown.",
      };
    }
    return uniToken;
  }

  if (!UNIVERSE_CLIENT_ID || !UNIVERSE_CLIENT_SECRET) {
    throw new Error(
      "Missing UNIVERSE_CLIENT_ID / UNIVERSE_CLIENT_SECRET (or set UNIVERSE_ACCESS_TOKEN)"
    );
  }

  const now = Date.now();
  if (uniToken && uniExpMs && uniExpMs - 15000 > now) return uniToken;

  const r = await fetchWithTimeout(
    UNIVERSE_TOKEN_URL,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: UNIVERSE_CLIENT_ID,
        client_secret: UNIVERSE_CLIENT_SECRET,
      }),
    },
    15000
  );

  const text = await r.text();
  if (!r.ok) {
    console.error("[Universe OAuth] error:", r.status, text.slice(0, 300));
    throw new Error(`Universe token failed (${r.status})`);
  }

  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Universe token non-JSON");
  }

  const { access_token, expires_in, token_type, scope, ...rest } = json || {};
  if (!access_token)
    throw new Error("Universe OAuth response missing access_token");

  uniToken = access_token;
  uniIssuedMs = now;
  const ttl = Number(expires_in || 3600);
  uniExpMs = now + ttl * 1000;
  uniLastOAuth = { token_type, scope, expires_in: ttl, raw: rest };

  return uniToken;
}

function formatInTZ(date, tz) {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(d)
    .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});
  return {
    y: Number(parts.year),
    m: Number(parts.month),
    d: Number(parts.day),
  };
}

function isSameDayInTZ(aISO, bDate, tz) {
  if (!aISO) return false;
  const A = formatInTZ(aISO, tz);
  const B = formatInTZ(bDate, tz);
  return A.y === B.y && A.m === B.m && A.d === B.d;
}

/* ---------- GraphQL + public fallback ---------- */
async function gql(query, variables = {}) {
  const token = await getUniverseToken();
  const endpoint = `${UNIVERSE_API_BASE}${
    UNIVERSE_GRAPHQL_PATH.startsWith("/") ? "" : "/"
  }${UNIVERSE_GRAPHQL_PATH}`;

  const r = await fetchWithTimeout(
    endpoint,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    },
    15000
  );

  const text = await r.text();
  if (!r.ok)
    throw new Error(`[Universe GraphQL] ${r.status}: ${text.slice(0, 300)}`);
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Universe GraphQL returned non-JSON");
  }
  if (json.errors?.length) {
    const msg = json.errors.map((e) => e.message).join("; ");
    throw new Error(msg || "GraphQL error");
  }
  return json.data;
}

/* ---------- NEW: Safe GQL + pagination helpers ---------- */
async function gqlSafe(query, variables) {
  try {
    return await gql(query, variables);
  } catch (e) {
    console.warn("[gqlSafe]", e?.message || e);
    return null;
  }
}

/** Fetch ALL events for a host, paginating if supported. */
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
  const nodes = d?.host?.events?.nodes || [];
  return nodes;
}

/** Fetch ALL timeSlots for an event, paginating if supported. */
async function fetchTimeSlotsAll(eventId) {
  const LEGACY_TS = `
    query EventWithLegacyTS($id: ID!) {
      event(id:$id) { id timeSlots { nodes { startAt endAt } } }
    }
  `;
  const d2 = await gqlSafe(LEGACY_TS, { id: eventId });
  return d2?.event?.timeSlots?.nodes || [];
}

/** normalize one occurrence (either from GraphQL timeslots or JSON-LD) */
function normalizeOccurrence(evLike, slotLike, hostName = "") {
  const startISO =
    slotLike?.startAt ||
    slotLike?.startDate ||
    slotLike?.startTime ||
    evLike?.startDate ||
    null;

  const offerUrl =
    evLike?.offers?.url ||
    (Array.isArray(evLike?.offers)
      ? evLike.offers.find((o) => o?.url)?.url
      : null) ||
    evLike?.url ||
    slotLike?.url ||
    null;

  const idSource = evLike?.id || evLike?.url || evLike?.name || "event";
  const locationName =
    evLike?.address ||
    evLike?.venue?.name ||
    evLike?.location?.name ||
    [
      evLike?.location?.address?.addressLocality,
      evLike?.location?.address?.addressRegion,
    ]
      .filter(Boolean)
      .join(", ") ||
    hostName ||
    "";

  return {
    id: `${idSource}:${
      startISO ? new Date(startISO).toISOString() : crypto.randomUUID()
    }`,
    title: evLike?.title || evLike?.name || "Untitled",
    startsAt: startISO ? new Date(startISO).toISOString() : null,
    location: locationName,
    purchaseUrl: offerUrl,
    description: evLike?.description || "",
    _eventId: evLike?.id || null,
  };
}

/* ---- JSON-LD helpers ---- */
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

async function parseEventJsonLd(eventUrl) {
  const r = await fetchWithTimeout(
    eventUrl,
    {
      headers: {
        Accept: "text/html,*/*;q=0.8",
        "User-Agent": "churchstudio-api/1.0 (+https://thechurchstudio.com)",
      },
    },
    12000
  );
  if (!r.ok) return [];
  const html = await r.text();

  const scripts = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
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

/* ---- Public JSON fallback (fast) ---- */
async function listEventsFromPublicJson() {
  const slug = UNIVERSE_ORGANIZER_SLUG;
  if (!slug) return [];
  const base = UNIVERSE_API_BASE.replace(/\/+$/, "");
  const candidates = [
    `${base}/api/v2/users/${encodeURIComponent(
      slug
    )}/events?state=upcoming&per_page=200`,
    `${base}/api/v2/organizers/${encodeURIComponent(
      slug
    )}/events?state=upcoming&per_page=200`,
    `${base}/api/v2/${encodeURIComponent(
      slug
    )}/events?state=upcoming&per_page=200`,
  ];

  for (const url of candidates) {
    try {
      const headers = {
        Accept: "application/json",
        "User-Agent": "churchstudio-api/1.0 (+https://thechurchstudio.com)",
        ...(UNIVERSE_ACCESS_TOKEN
          ? { Authorization: `Bearer ${UNIVERSE_ACCESS_TOKEN}` }
          : {}),
      };

      const r = await fetchWithTimeout(url, { headers }, 12000);
      const text = await r.text();
      if (!r.ok) {
        console.warn(
          `[universe/public-json] ${r.status} ${url} :: ${text.slice(0, 160)}`
        );
        continue;
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch {
        continue;
      }

      const arr = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : [];
      const out = [];
      for (const ev of arr) {
        const title = ev?.title || ev?.name;
        const urlEv = ev?.url || ev?.web_url || (ev?.links?.self ?? "");
        const venueName = ev?.venue?.name || ev?.location?.name || "";
        const slots = ev?.time_slots || ev?.timeslots || ev?.occurrences || [];

        if (Array.isArray(slots) && slots.length) {
          for (const s of slots) {
            const startAt =
              s?.start_at || s?.startAt || s?.start_time || s?.startDate;
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
          const startAt =
            ev?.start_at || ev?.startAt || ev?.start_time || ev?.startDate;
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
      console.log(`[universe/public-json] ${out.length} upcoming via ${url}`);
      return out;
    } catch (e) {
      console.warn("[universe/public-json] failed:", e?.message || e);
    }
  }

  return [];
}

/* ---- Crawl organizer public page for event URLs, then JSON-LD ---- */
async function listEventsFromPublicOrganizer() {
  const slug = UNIVERSE_ORGANIZER_SLUG;
  if (!slug) return [];
  const base = UNIVERSE_API_BASE.replace(/\/+$/, "");
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
      const r = await fetchWithTimeout(
        url,
        {
          headers: {
            Accept: "text/html",
            "User-Agent": "churchstudio-api/1.0 (+https://thechurchstudio.com)",
          },
        },
        12000
      );
      if (r.ok) {
        const t = await r.text();
        if (t && t.length > 0) {
          html = t;
          break;
        }
      }
    } catch (e) {
      console.warn(
        "[universe/public] organizer fetch failed:",
        e?.message || e
      );
    }
  }
  if (!html) return [];

  const abs =
    html.match(
      /https?:\/\/(?:www\.)?universe\.com\/events\/[a-z0-9-]+(?:-[A-Z0-9]+)?(?:\?[^\s"'<>)]*)?/gi
    ) || [];

  const rel = (
    html.match(
      /href=["']\/events\/[a-z0-9-]+(?:-[A-Z0-9]+)?(?:\?[^\s"'<>)]*)?["']/gi
    ) || []
  )
    .map((h) => h.replace(/^href=["']/, "").replace(/["']$/, ""))
    .map((p) => `${base}${p.startsWith("/") ? "" : "/"}${p}`);

  const urls = [...new Set([...abs, ...rel])].slice(0, 120);
  if (!urls.length) {
    console.log("[universe/public] no event links found on organizer page");
    return [];
  }

  const out = [];
  for (const url of urls) {
    try {
      const occ = await parseEventJsonLd(url);
      for (const o of occ) out.push(o);
    } catch (e) {
      console.warn("[universe/public] JSON-LD parse failed:", e?.message || e);
    }
  }
  out.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  console.log(
    `[universe/public] parsed ${out.length} total occurrences from ${urls.length} URLs`
  );
  return out;
}

/* ---------------- Spreadsheet: Tunes @ Noon (CSV) ---------------- */
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRoMIis2XZig04Jfxh764tdQ4XiZcuM_I3FP8ViiCo2OsWL763BKPfQzg6MzrUnS1jwis2_GaTIbSb8/pub?gid=0&single=true&output=csv";

let sheetCache = { events: [], ts: 0 };
const SHEET_TTL_MS = 15 * 60 * 1000; // 15 minutes

const MONTHS = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function tzOffsetMinutes(tz, date) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    });

    const parts = fmt.formatToParts(date);
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "";

    // Try to parse GMT/UTC-style offsets like "GMT-05:00"
    let m =
      tzName.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/i) ||
      tzName.match(/UTC([+-]\d{1,2})(?::(\d{2}))?/i);

    if (m) {
      const sign = m[1].startsWith("-") ? -1 : 1;
      const h = Math.abs(parseInt(m[1], 10)) || 0;
      const mm = m[2] ? parseInt(m[2], 10) : 0;
      // We want: UTC = local + offsetMinutes
      return (h * 60 + mm) * sign * -1;
    }

    // Fallback for zones like "CST", "CDT"
    const fmt2 = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    });
    const name2 =
      fmt2.formatToParts(date).find((p) => p.type === "timeZoneName")?.value ||
      "";

    if (/CDT/i.test(name2)) return 300; // UTC = local + 300 (UTC-5)
    if (/CST/i.test(name2)) return 360; // UTC = local + 360 (UTC-6)
  } catch {
    // ignore and fall through
  }

  // Safe default (UTC-6 like standard Central)
  return 360;
}

function chicagoNoonISO(y, m, d) {
  // Rough guess in UTC just to get the correct offset
  const guess = new Date(Date.UTC(y, m - 1, d, 18, 0, 0)); // 18:00 UTC ≈ noon CST/CDT
  const offMin = tzOffsetMinutes("America/Chicago", guess);

  // Local noon → convert to UTC using offset
  const utcMs = Date.UTC(y, m - 1, d, 12, 0, 0) + offMin * 60 * 1000;
  return new Date(utcMs).toISOString();
}

function parseSheetDate(dateStr) {
  // Normalize string and remove non-breaking spaces
  const raw = (dateStr || "")
    .toString()
    .trim()
    .replace(/\u00A0/g, " ");
  if (/^date$/i.test(raw)) return null;

  // Strip weekday prefixes like "Thursday," or "Sun:" if present
  const s = stripWeekdayPrefix(raw);

  // 1) MM/DD/YYYY, M-D-YY, etc.
  let m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (m) {
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    return { y, m: parseInt(m[1], 10), d: parseInt(m[2], 10) };
  }

  // 2) YYYY/MM/DD, etc.
  m = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (m) {
    return {
      y: parseInt(m[1], 10),
      m: parseInt(m[2], 10),
      d: parseInt(m[3], 10),
    };
  }

  // 3) "January 5, 2024" / "Jan 5 2024"
  m = s.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(\d{1,2})(?:,)?\s+(\d{4})/i
  );
  if (m) {
    const mm = MONTHS[m[1].toLowerCase().replace(/\.$/, "")];
    return { y: parseInt(m[3], 10), m: mm, d: parseInt(m[2], 10) };
  }

  // 4) "Jan 5, 2024 7:00 PM" → strip time and recurse
  m = s.match(/^([^@]+?)\s+\d{1,2}:\d{2}\s*(AM|PM)?/i);
  if (m) return parseSheetDate(m[1]);

  // 5) Last resort: let Date try to parse
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    return {
      y: dt.getUTCFullYear(),
      m: dt.getUTCMonth() + 1,
      d: dt.getUTCDate(),
    };
  }

  console.warn("[sheet] Unrecognized date format:", s);
  return null;
}

function stripWeekdayPrefix(s = "") {
  const raw = (s || "").toString().trim();

  // 1) Normal case: weekday at the start, with optional punctuation
  let out = raw.replace(
    /^\s*(?:mon|monday|tue|tues|tuesday|wed|weds|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday|sday)\s*[:;,]?\s*/i,
    ""
  );

  // 2) Fallback: if it still contains something like "sday: Jam Econo",
  //    remove everything up to and including the first ":" or ";".
  if (/sday\s*[:;,]/i.test(out)) {
    out = out.split(/[:;,]/).slice(1).join(":").trim();
  }

  return out.trim();
}

async function fetchTunesAtNoonEvents() {
  const now = Date.now();
  const age = now - (sheetCache.ts || 0);
  if (sheetCache.events.length && age < SHEET_TTL_MS) {
    console.log(
      `[spreadsheet] Using cached ${
        sheetCache.events.length
      } events (${Math.floor(age / 60000)}m old)`
    );
    return sheetCache.events;
  }

  try {
    const r = await fetchWithTimeout(
      SHEET_CSV_URL,
      { headers: { Accept: "text/csv" } },
      12000
    );
    const text = await r.text();

    const rows = csvParse(text, {
      skip_empty_lines: true,
      relax_column_count: true,
    });

    const out = [];
    for (const row of rows) {
      const [dateRaw, artistRaw] = row;

      const dateStr = (dateRaw || "").toString().trim();
      const artistSheet = (artistRaw || "").toString().trim();
      if (!dateStr || !artistSheet) continue;

      const pd = parseSheetDate(dateStr);
      if (!pd || !pd.y || !pd.m || !pd.d) continue;

      // Clean things like "sday: Jam Econo" → "Jam Econo"
      const artistClean = stripWeekdayPrefix(artistSheet);
      if (!artistClean) continue;

      const startsAt = chicagoNoonISO(pd.y, pd.m, pd.d);

      out.push({
        id: `tunes-noon:${startsAt}`,
        title: "Tunes @ Noon",
        startsAt,
        location: "The Church Studio",
        description: `Artist: ${artistClean}`,
        tunesArtist: artistClean,
        _eventId: null,
        _source: "sheet",
      });
    }

    sheetCache = { events: out, ts: now };
    console.log(`[spreadsheet] Loaded ${out.length} events from sheet CSV`);
    return out;
  } catch (e) {
    console.warn("[spreadsheet] fetch failed:", e?.message || e);
    return sheetCache.events || [];
  }
}

/** ----------------- COLLECT (with pagination) ------------------ */
async function collectUniverseEvents() {
  let gqlOcc = [];
  let hostName = "";

  if (UNIVERSE_ORGANIZER_ID) {
    const HOST_Q = `query($id: ID!){ host(id:$id){ id name } }`;
    const host = await gqlSafe(HOST_Q, { id: UNIVERSE_ORGANIZER_ID });
    hostName = host?.host?.name || "";

    const events = await fetchHostEventsAll(UNIVERSE_ORGANIZER_ID);

    for (const ev of events) {
      let slots = Array.isArray(ev?.timeSlots?.nodes) ? ev.timeSlots.nodes : [];
      if (!slots.length) {
        slots = await fetchTimeSlotsAll(ev.id);
      }
      for (const ts of slots) {
        const start = ts?.startAt || ts?.start_time || ts?.startDate;
        if (!start) continue;
        gqlOcc.push(normalizeOccurrence(ev, { startAt: start }, hostName));
      }
    }
  }

  gqlOcc.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  console.log(`[universe/graphql:host] occurrences: ${gqlOcc.length}`);

  const [pubJsonOcc, pubCrawlOcc, sheetOcc] = await Promise.all([
    listEventsFromPublicJson(),
    listEventsFromPublicOrganizer(),
    fetchTunesAtNoonEvents(),
  ]);

  const key = (o) =>
    [
      o.title?.trim().toLowerCase(),
      o.startsAt,
      o.location?.trim().toLowerCase(),
    ]
      .filter(Boolean)
      .join("|");

  const map = new Map();
  for (const o of [...gqlOcc, ...pubJsonOcc, ...pubCrawlOcc, ...sheetOcc]) {
    if (!o?.startsAt) continue;
    const k = key(o);
    if (!map.has(k)) map.set(k, o);
  }

  const merged = [...map.values()].sort(
    (a, b) => new Date(a.startsAt) - new Date(b.startsAt)
  );

  const minDate = merged[0]?.startsAt || "n/a";
  const maxDate = merged[merged.length - 1]?.startsAt || "n/a";
  console.log(
    `[universe/merged] total=${merged.length} (gql=${gqlOcc.length}, json=${pubJsonOcc.length}, crawl=${pubCrawlOcc.length}, sheet=${sheetOcc.length}) range: ${minDate} → ${maxDate}`
  );

  return merged;
}

/* -------- Helper: compute ranges per source for /api/events/_cap ---------- */
function rangeStats(arr) {
  if (!arr || !arr.length) return { count: 0, min: null, max: null };
  const sorted = arr
    .filter((e) => e?.startsAt)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  return {
    count: sorted.length,
    min: sorted[0]?.startsAt || null,
    max: sorted[sorted.length - 1]?.startsAt || null,
  };
}
function tryDecodeJWT(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64uToStr = (s) =>
      Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8"
      );
    const header = JSON.parse(b64uToStr(parts[0]));
    const payload = JSON.parse(b64uToStr(parts[1]));
    return { header, payload };
  } catch {
    return null;
  }
}

async function probeUniverseCaps() {
  let gqlOcc = [];
  let hostName = "";

  if (UNIVERSE_ORGANIZER_ID) {
    const HOST_Q = `query($id: ID!){ host(id:$id){ id name } }`;
    const host = await gqlSafe(HOST_Q, { id: UNIVERSE_ORGANIZER_ID });
    hostName = host?.host?.name || "";
    const events = await fetchHostEventsAll(UNIVERSE_ORGANIZER_ID);

    for (const ev of events) {
      let slots = Array.isArray(ev?.timeSlots?.nodes) ? ev.timeSlots.nodes : [];
      if (!slots.length) {
        slots = await fetchTimeSlotsAll(ev.id);
      }
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

  const key = (o) =>
    [
      o.title?.trim().toLowerCase(),
      o.startsAt,
      o.location?.trim().toLowerCase(),
    ]
      .filter(Boolean)
      .join("|");
  const dedupe = new Map();
  for (const o of [...gqlOcc, ...pubJsonOcc, ...pubCrawlOcc, ...sheetOcc]) {
    if (!o?.startsAt) continue;
    const k = key(o);
    if (!dedupe.has(k)) dedupe.set(k, o);
  }
  const merged = [...dedupe.values()].sort(
    (a, b) => new Date(a.startsAt) - new Date(b.startsAt)
  );

  const stats = {
    gql: rangeStats(gqlOcc),
    publicJson: rangeStats(pubJsonOcc),
    publicCrawl: rangeStats(pubCrawlOcc),
    sheet: rangeStats(sheetOcc),
    merged: rangeStats(merged),
  };

  let cap = "unknown";
  if (stats.merged.max) {
    if (stats.gql.max && stats.gql.max === stats.merged.max) cap = "graphql";
    else if (stats.publicJson.max && stats.publicJson.max === stats.merged.max)
      cap = "public-json";
    else if (
      stats.publicCrawl.max &&
      stats.publicCrawl.max === stats.merged.max
    )
      cap = "public-crawl";
  }

  return {
    stats,
    cap,
    counts: {
      gql: stats.gql.count,
      publicJson: stats.publicJson.count,
      publicCrawl: stats.publicCrawl.count,
      sheet: stats.sheet.count,
      merged: stats.merged.count,
    },
  };
}

/* ---------------- Webhook receiver (RAW body) ---------------- */
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

    if (UNIVERSE_WEBHOOK_SECRET) {
      const headerSigRaw =
        req.header("X-Uniiverse-Signature") ||
        req.header("X-Universe-Signature") ||
        "";

      const { hex, prefixed, base64 } = digestsFor(
        rawBodyBuf,
        UNIVERSE_WEBHOOK_SECRET
      );
      const raw = (headerSigRaw || "").trim();
      const lowerPrefixed = raw.toLowerCase();

      const matches =
        safeEqual(raw, hex) ||
        safeEqual(lowerPrefixed, prefixed) ||
        safeEqual(raw, base64);

      if (!matches) {
        console.warn("[universe/webhook] invalid signature", {
          headerLen: raw.length,
          wantHex: hex.slice(0, 16) + "…",
          wantB64: base64.slice(0, 16) + "…",
        });
        return res.status(401).send("invalid signature");
      }
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
    if (Array.isArray(payload?.data?.events))
      maybeEvents.push(...payload.data.events);

    for (const ev of maybeEvents) {
      const slots =
        ev?.timeSlots?.nodes || ev?.timeSlots || ev?.occurrences || [];
      if (Array.isArray(slots) && slots.length) {
        for (const s of slots) pushOcc(ev, s, payload?.host?.name || "");
      } else {
        pushOcc(
          ev,
          { startDate: ev?.startDate || ev?.startAt },
          payload?.host?.name || ""
        );
      }
    }

    const { upcoming_events, past_events } = splitEventsByTime(occurrences);

    let addedToCache = 0;
    for (const o of upcoming_events) {
      if (!universeCache.has(o.id)) {
        universeCache.set(o.id, o);
        addedToCache++;
      }
    }
    universeCacheLast = Date.now();

    console.log(
      `[universe/webhook] ${eventType}; in_payload=${occurrences.length}, ` +
        `upcoming=${upcoming_events.length}, past=${past_events.length}, cached+${addedToCache}`
    );

    const enriched = {
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
    };

    return res.status(200).json(enriched);
  } catch (e) {
    console.error("[universe/webhook] error:", e?.message || e);
    return res
      .status(200)
      .json({
        ok: true,
        error: "handler_error",
        message: e?.message || String(e),
      });
  }
}

// Universe webhook RAW body route BEFORE JSON parser
app.options("/api/webhooks/universe", (_req, res) => res.sendStatus(204));
app.get("/api/webhooks/universe", (_req, res) =>
  res
    .status(405)
    .type("text/plain")
    .send(
      "Universe webhook endpoint: use POST with raw body and X-Universe-Signature (HMAC-SHA256)."
    )
);
app.post(
  "/api/webhooks/universe",
  express.raw({ type: "*/*", limit: "1mb" }),
  universeWebhookHandler
);

/* Now it’s safe to parse JSON for all other routes */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/* ---------------- Occurrence retrieval ---------------- */
async function getUniverseOccurrences() {
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

/* ---------------- Debug endpoint (optional) ---------------- */
app.get("/api/events/_debug", async (_req, res) => {
  try {
    const items = await getUniverseOccurrences();
    res.json({ total: items.length, sample: items.slice(0, 5) });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.get("/api/events/_sheet", async (_req, res) => {
  try {
    const items = await fetchTunesAtNoonEvents();
    res.json({ total: items.length, items: items.slice(0, 20) });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

/* ---------------- NEW: Events Cap endpoint ---------------- */
app.get("/api/events/_cap", async (_req, res) => {
  try {
    const { stats, cap, counts } = await probeUniverseCaps();
    res.json({
      ok: true,
      sources: stats,
      counts,
      inferredCapSource: cap,
      note:
        cap === "graphql"
          ? "Merged max equals GraphQL max — likely capped by host GraphQL feed."
          : cap === "public-json"
          ? "Merged max equals public JSON — likely capped by Universe public JSON."
          : cap === "public-crawl"
          ? "Merged max equals public crawl — likely capped by what the public pages expose."
          : "Unable to infer cap source (no data or equal nulls).",
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

/* ---------------- Events API ---------------- */
app.get("/api/events/today", async (req, res) => {
  try {
    const tz = (req.query.tz || "America/Chicago").trim();
    const today = new Date();

    const all = await getUniverseOccurrences();

    const sameDay = all
      .filter((e) => e.startsAt && isSameDayInTZ(e.startsAt, today, tz))
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    const source = "fetch-or-cache";
    if (sameDay.length) {
      return res.type("application/json").json({
        events: sameDay,
        count: sameDay.length,
        note: "events-today",
        source,
      });
    }

    const upcoming = all
      .filter((e) => e.startsAt && new Date(e.startsAt) >= new Date())
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 5);

    return res.type("application/json").json({
      events: upcoming,
      count: upcoming.length,
      note: upcoming.length
        ? "no-events-today-fallback-upcoming"
        : "no-events-today",
      source,
    });
  } catch (err) {
    console.error("/api/events/today error:", err);
    return res
      .status(500)
      .type("application/json")
      .json({ error: "Server Error", details: { message: err.message } });
  }
});

app.get("/api/events/day", async (req, res) => {
  console.log(
    "[api] /api/events/day hit with",
    req.query,
    "x-debug:",
    req.headers["x-debug-client"]
  );
  try {
    const tz = (req.query.tz || "America/Chicago").trim();
    const qDate = (req.query.date || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
      return res
        .status(400)
        .type("application/json")
        .json({ error: "Bad date, expected YYYY-MM-DD" });
    }
    const [y, m, d] = qDate.split("-").map((n) => Number(n));
    const target = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    const all = await getUniverseOccurrences();

    const events = all
      .filter((e) => e.startsAt)
      .filter((e) => isSameDayInTZ(e.startsAt, target, tz))
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    return res.type("application/json").json({
      events,
      count: events.length,
      note: events.length ? "events-day" : "no-events-today",
      source: "fetch-or-cache",
    });
  } catch (err) {
    console.error("/api/events/day error:", err);
    return res
      .status(500)
      .type("application/json")
      .json({ error: "Server Error", details: { message: err.message } });
  }
});

/* ---- Debug: dump raw GraphQL (host-only) ---- */
app.get("/api/events/_raw/graphql", async (_req, res) => {
  try {
    const token = await getUniverseToken();
    const endpoint = `${UNIVERSE_API_BASE}${
      UNIVERSE_GRAPHQL_PATH.startsWith("/") ? "" : "/"
    }${UNIVERSE_GRAPHQL_PATH}`;

    const q = `
      query HostEvents($id: ID!) {
        host(id: $id) {
          __typename
          id
          name
          events {
            nodes {
              id
              title
              url
              description
              address
              timeSlots {
                nodes {
                  startAt
                  endAt
                }
              }
            }
          }
        }
      }
    `;
    const body = JSON.stringify({
      query: q,
      variables: { id: UNIVERSE_ORGANIZER_ID },
    });

    const r = await fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
      },
      15000
    );

    const text = await r.text();
    res
      .status(r.ok ? 200 : 502)
      .type("application/json")
      .send(text);
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

/* ---------------- NEW: Universe token-info WITHOUT SDK -------------- */
app.get("/api/universe/token-info", async (_req, res) => {
  try {
    const token = await getUniverseToken();

    let graphqlReachable = false;
    let hostName = null;
    if (UNIVERSE_ORGANIZER_ID) {
      try {
        const data = await gql(`query($id: ID!){ host(id:$id){ id name } }`, {
          id: UNIVERSE_ORGANIZER_ID,
        });
        hostName = data?.host?.name || null;
        graphqlReachable = true;
      } catch {
        graphqlReachable = false;
      }
    }

    const now = Date.now();
    const issuedAtISO = uniIssuedMs
      ? new Date(uniIssuedMs).toISOString()
      : null;
    const expiresAtISO = uniExpMs ? new Date(uniExpMs).toISOString() : null;
    const secondsLeft = uniExpMs
      ? Math.max(0, Math.floor((uniExpMs - now) / 1000))
      : null;
    const minutesLeft =
      secondsLeft != null ? +(secondsLeft / 60).toFixed(1) : null;
    const renewAtMs = uniExpMs ? Math.max(now, uniExpMs - 5 * 60 * 1000) : 0;
    const renewAtISO = renewAtMs ? new Date(renewAtMs).toISOString() : null;
    const cacheAgeSec = uniIssuedMs
      ? Math.max(0, Math.floor((now - uniIssuedMs) / 1000))
      : null;

    const jwt = tryDecodeJWT(token);
    const jwtSummary = jwt
      ? {
          header: jwt.header,
          payload: (() => {
            const p = { ...jwt.payload };
            return p;
          })(),
          expFromClaimsISO: jwt.payload?.exp
            ? new Date(jwt.payload.exp * 1000).toISOString()
            : null,
        }
      : null;

    res.json({
      ok: true,
      usedSDK: false,
      tokenPrefix: (token || "").slice(0, 12) + "…",
      tokenLength: token?.length || 0,
      isJWT: !!jwt,
      oauth: uniLastOAuth,
      clocks: {
        issuedAtISO,
        expiresAtISO,
        secondsLeft,
        minutesLeft,
        renewAtISO,
        cacheAgeSec,
      },
      jwt: jwtSummary,
      graphqlReachable,
      hostName,
      info:
        !uniLastOAuth || !uniExpMs
          ? {
              note: "Using static access token or unknown expiry; JWT claims shown if available.",
            }
          : undefined,
    });
  } catch (err) {
    res.status(500).json({ ok: false, usedSDK: false, error: err.message });
  }
});

/* ------------------- NEW: Push registration & test ------------------- */
/* NOTE: These are AFTER express.json so req.body works */
const deviceTokens = new Set();

app.post("/api/push/register", async (req, res) => {
  try {
    if (!adminInitialized)
      return res.status(500).json({ error: "Push not configured" });

    const { token, platform } = req.body || {};
    if (!token) return res.status(400).json({ error: "token required" });

    deviceTokens.add(token);
    try {
      await admin.messaging().subscribeToTopic([token], "tunes-noon");
    } catch (e) {
      console.warn("[push] subscribeToTopic failed:", e?.message || e);
    }

    return res.json({
      ok: true,
      count: deviceTokens.size,
      platform: platform || "unknown",
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

app.post("/api/push/test", async (req, res) => {
  try {
    if (!adminInitialized)
      return res.status(500).json({ error: "Push not configured" });
    const {
      token,
      title = "Test Push",
      body = "Hello from Church Studio",
      route = "/listen-in",
    } = req.body || {};

    const msg = {
      notification: { title, body },
      data: { route },
      ...(token ? { token } : { topic: "tunes-noon" }),
      android: { priority: "high" },
      apns: { headers: { "apns-priority": "10" } },
    };

    const id = await admin.messaging().send(msg);
    return res.json({ ok: true, id, targeted: token ? "token" : "topic" });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

/* ------------------- 11:15 AM Tunes @ Noon scheduler ------------------- */
// Helper Y-M-D equality using UTC midnight anchor (fed with Chicago date string)
function isSameYMD(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate()
  );
}

async function sendTunesNoonIfToday() {
  if (!adminInitialized) {
    console.warn("[push] admin not initialized; skip");
    return;
  }

  try {
    const events = await fetchTunesAtNoonEvents();
    const now = new Date();

    // Get today's date in America/Chicago as YYYY-MM-DD, then make a UTC midnight Date
    const todayISO = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now); // YYYY-MM-DD
    const todayUTC = new Date(`${todayISO}T00:00:00Z`);

    const todays = events.filter(
      (e) => e.startsAt && isSameYMD(e.startsAt, todayUTC)
    );
    if (!todays.length) {
      console.log("[push] no Tunes @ Noon today; nothing sent");
      return;
    }

    todays.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    const pick = todays[0];
    const artist =
      pick.tunesArtist ||
      pick.description?.replace(/^Performing artist:\s*/i, "") ||
      "today’s artist";

    const msg = {
      topic: "tunes-noon",
      notification: {
        title: "🎶 Tunes @ Noon today",
        body: `Don't forget: ${artist} at 12:00 PM`,
      },
      data: {
        route: "/listen-in",
        artist: artist,
        startsAt: pick.startsAt,
      },
      android: {
        priority: "high",
        notification: { channelId: "default" },
      },
      apns: { headers: { "apns-priority": "10" } },
    };

    const id = await admin.messaging().send(msg);
    console.log("✅ Sent Tunes @ Noon notification:", id, artist);
  } catch (e) {
    console.warn("[push] scheduler error:", e?.message || e);
  }
}

// Run every day at 11:15 AM America/Chicago
cron.schedule("15 11 * * *", sendTunesNoonIfToday, {
  timezone: "America/Chicago",
});
console.log("⏰ Scheduled Tunes @ Noon notifier for 11:15 AM America/Chicago");

/* ---------------- Start server ---------------- */
app.listen(PORT, HOST, () => {
  const hostShown = HOST === "0.0.0.0" ? "localhost" : HOST;
  console.log(`\n🚀 Server running on http://${hostShown}:${PORT}`);
  console.log(
    `[READY] Using ORGANIZER_ID = ${UNIVERSE_ORGANIZER_ID || "<undefined>"}`
  );
  console.log("   Try: GET /api/_health");
  console.log("        GET /api/_whoami");
  console.log("        GET /api/events/_debug");
  console.log("        GET /api/events/_sheet");
  console.log("        GET /api/events/_cap");
  console.log("        GET /api/universe/token-info");
  console.log("        POST /api/push/register");
  console.log("        POST /api/push/test\n");
});
