// server/src/services/universe/universeClient.js
import { env } from "../../config/env.js";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout.js";

let uniToken = null;
let uniExpMs = 0;
let uniIssuedMs = 0;
let uniLastOAuth = null;

export function getUniverseTokenState() {
  return { uniToken, uniExpMs, uniIssuedMs, uniLastOAuth };
}

export async function getUniverseToken() {
  if (env.UNIVERSE_ACCESS_TOKEN) {
    if (!uniToken) {
      uniToken = env.UNIVERSE_ACCESS_TOKEN;
      uniIssuedMs = Date.now();
      uniExpMs = 0;
      uniLastOAuth = { note: "Using UNIVERSE_ACCESS_TOKEN from env; expiry unknown." };
    }
    return uniToken;
  }

  if (!env.UNIVERSE_CLIENT_ID || !env.UNIVERSE_CLIENT_SECRET) {
    throw new Error("Missing UNIVERSE_CLIENT_ID / UNIVERSE_CLIENT_SECRET (or set UNIVERSE_ACCESS_TOKEN)");
  }

  const now = Date.now();
  if (uniToken && uniExpMs && uniExpMs - 15000 > now) return uniToken;

  const r = await fetchWithTimeout(
    env.UNIVERSE_TOKEN_URL,
    {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: env.UNIVERSE_CLIENT_ID,
        client_secret: env.UNIVERSE_CLIENT_SECRET,
      }),
    },
    15000
  );

  const text = await r.text();
  if (!r.ok) throw new Error(`Universe token failed (${r.status})`);

  const json = JSON.parse(text);
  const { access_token, expires_in, token_type, scope, ...rest } = json || {};
  if (!access_token) throw new Error("Universe OAuth response missing access_token");

  uniToken = access_token;
  uniIssuedMs = now;

  const ttl = Number(expires_in || 3600);
  uniExpMs = now + ttl * 1000;
  uniLastOAuth = { token_type, scope, expires_in: ttl, raw: rest };

  return uniToken;
}

export async function gql(query, variables = {}) {
  const token = await getUniverseToken();
  const endpoint = `${env.UNIVERSE_API_BASE}${env.UNIVERSE_GRAPHQL_PATH.startsWith("/") ? "" : "/"}${env.UNIVERSE_GRAPHQL_PATH}`;

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
  if (!r.ok) throw new Error(`[Universe GraphQL] ${r.status}: ${text.slice(0, 300)}`);

  const json = JSON.parse(text);
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

export async function gqlSafe(query, variables) {
  try {
    return await gql(query, variables);
  } catch (e) {
    console.warn("[gqlSafe]", e?.message || e);
    return null;
  }
}
