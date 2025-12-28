// server/src/middleware/errorHandler.js
export function errorHandler(err, _req, res, _next) {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Server Error",
    details: { message: err?.message || String(err) },
  });
}
