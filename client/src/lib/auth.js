// src/lib/auth.js (server-side)
let cached = { token: null, exp: 0 };

function getBaseUrl() {
  const site = process.env.SF_SITE;
  if (!site) throw new Error("SF_SITE is missing");
  return `https://${site}.subscriptionflow.com`;
}

export async function getAuthToken() {
  const staticToken = process.env.SF_TOKEN;
  if (staticToken) return staticToken;

  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing credentials: set SF_CLIENT_ID and SF_CLIENT_SECRET"
    );
  }

  const now = Date.now();
  if (cached.token && cached.exp > now + 5000) return cached.token;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(`${getBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("OAuth error:", text);
    throw new Error(`OAuth failed: ${res.status} ${res.statusText}`);
  }

  const json = JSON.parse(text);
  const { access_token, expires_in } = json;

  if (!access_token) throw new Error("Missing access_token in response");

  cached.token = access_token;
  cached.exp = now + (expires_in || 3600) * 1000 - 15000; // refresh early
  return cached.token;
}
