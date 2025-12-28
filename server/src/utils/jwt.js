// server/src/utils/jwt.js
export function tryDecodeJWT(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const b64uToStr = (s) =>
      Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

    const header = JSON.parse(b64uToStr(parts[0]));
    const payload = JSON.parse(b64uToStr(parts[1]));
    return { header, payload };
  } catch {
    return null;
  }
}
