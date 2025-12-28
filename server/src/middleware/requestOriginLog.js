// server/src/middleware/requestOriginLog.js
export function requestOriginLog(req, _res, next) {
  console.log("Origin:", req.headers.origin || "<none>", req.method, req.path);
  next();
}
