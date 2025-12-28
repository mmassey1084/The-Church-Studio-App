// server/src/services/subscriptionflow/tokenService.js
import { env } from "../../config/env.js";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout.js";

let cachedToken = null;
let tokenExpMs = 0;

export async function getAuthToken() {
  const { SF_SITE, SF_CLIENT_ID, SF_CLIENT_SECRET } = env;

  if (!SF_SITE || !SF_CLIENT_ID || !SF_CLIENT_SECRET) {
    throw new Error("Missing SubscriptionFlow env vars (SF_SITE, SF_CLIENT_ID, SF_CLIENT_SECRET)");
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
    throw new Error(data.error_description || data.message || "SF OAuth failed");
  }

  const { access_token, expires_in } = data || {};
  if (!access_token) throw new Error("SF OAuth response missing access_token");

  cachedToken = access_token;
  tokenExpMs = now + Math.max(30, (expires_in || 3600) - 15) * 1000;
  return cachedToken;
}
