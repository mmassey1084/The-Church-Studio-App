// server/src/utils/fetchWithTimeout.js
export async function fetchWithTimeout(url, opts = {}, ms = 12000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);

  const headers = {
    "User-Agent": "churchstudio-api/1.0 (+https://thechurchstudio.com)",
    ...(opts.headers || {}),
  };

  try {
    return await fetch(url, { ...opts, headers, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}
