// src/lib/api.js
const API = "https://epimyocardial-goldie-weightlessly.ngrok-free.dev";

export async function fetchPlans() {
  // add ngrok param + a tiny cache-buster
  const url = `${API}/api/plans?ngrok_skip_browser_warning=1&_=${Date.now()}`;

  const res = await fetch(url, {
    method: "GET",
    mode: "cors",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "1",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!ct.includes("application/json")) {
    console.error(
      "[/api/plans] NON-JSON BODY (likely SW/tunnel HTML). Full body logged above.\n",
      text
    );
    throw new Error("Server returned non-JSON (SW/tunnel cache).");
  }

  const json = JSON.parse(text);
  return Array.isArray(json) ? json : json?.data ?? [];
}
