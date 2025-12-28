// server/src/middleware/cors.js
import cors from "cors";

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

export function buildCors() {
  return cors({
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
  });
}
