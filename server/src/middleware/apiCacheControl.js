// server/src/middleware/apiCacheControl.js
export function apiCacheControl(req, res, next) {
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
}
