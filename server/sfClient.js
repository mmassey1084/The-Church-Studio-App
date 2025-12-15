// server/sfClient.js
import { URLSearchParams } from "node:url";

let cached = {
  token: null,
  // epoch ms
  expiresAt: 0,
};

const EARLY_EXPIRY_SKEW_MS = 15_000; // refresh 15s before expiry

export async function getSfToken({ site, clientId, clientSecret }) {
  const now = Date.now();
  if (cached.token && now < cached.expiresAt - EARLY_EXPIRY_SKEW_MS) {
    return { token: cached.token, expiresAt: cached.expiresAt };
  }

  const url = `https://${site}.subscriptionflow.com/oauth/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `SF OAuth failed (${res.status}): ${text || res.statusText}`
    );
  }

  const json = await res.json();
  const token = json.access_token;
  const expiresIn = Number(json.expires_in || 3600);
  const expiresAt = Date.now() + expiresIn * 1000;

  cached = { token, expiresAt };
  return { token, expiresAt };
}

export async function sfGetJson(path, { site, token }) {
  const url = `https://${site}.subscriptionflow.com${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.message || res.statusText;
    throw new Error(`SF API ${path} failed (${res.status}): ${msg}`);
  }
  return data;
}
