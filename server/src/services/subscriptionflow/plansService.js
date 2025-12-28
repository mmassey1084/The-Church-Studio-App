// server/src/services/subscriptionflow/plansService.js
import { env } from "../../config/env.js";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout.js";

export async function fetchPlans(token) {
  const { SF_SITE } = env;
  const candidates = [
    `https://${SF_SITE}.subscriptionflow.com/api/plans`,
    `https://${SF_SITE}.subscriptionflow.com/api/v1/plans`,
  ];

  let lastStatus = 0;
  let lastBody = "";

  for (const url of candidates) {
    const r = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      },
      12000
    );

    const ct = r.headers.get("content-type") || "";
    const text = await r.text();

    if (r.ok && ct.includes("application/json")) {
      const json = JSON.parse(text);
      return Array.isArray(json) ? json : json?.data ?? [];
    }

    if ([401, 403].includes(r.status)) {
      const err = new Error("Unauthorized with SubscriptionFlow");
      err.status = r.status;
      err.body = text.slice(0, 300);
      throw err;
    }

    lastStatus = r.status;
    lastBody = text;
  }

  const err = new Error("Failed to fetch plans");
  err.status = lastStatus || 502;
  err.body = (lastBody || "").slice(0, 500);
  throw err;
}
