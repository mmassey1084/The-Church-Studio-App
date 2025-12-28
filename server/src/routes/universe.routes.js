// server/src/routes/universe.routes.js
import { Router } from "express";
import { env } from "../config/env.js";
import { gql, getUniverseToken, getUniverseTokenState } from "../services/universe/universeClient.js";
import { tryDecodeJWT } from "../utils/jwt.js";

const router = Router();

router.get("/token-info", async (_req, res) => {
  try {
    const token = await getUniverseToken();

    let graphqlReachable = false;
    let hostName = null;

    if (env.UNIVERSE_ORGANIZER_ID) {
      try {
        const data = await gql(`query($id: ID!){ host(id:$id){ id name } }`, { id: env.UNIVERSE_ORGANIZER_ID });
        hostName = data?.host?.name || null;
        graphqlReachable = true;
      } catch {
        graphqlReachable = false;
      }
    }

    const { uniExpMs, uniIssuedMs, uniLastOAuth } = getUniverseTokenState();

    const now = Date.now();
    const issuedAtISO = uniIssuedMs ? new Date(uniIssuedMs).toISOString() : null;
    const expiresAtISO = uniExpMs ? new Date(uniExpMs).toISOString() : null;
    const secondsLeft = uniExpMs ? Math.max(0, Math.floor((uniExpMs - now) / 1000)) : null;

    const jwt = tryDecodeJWT(token);

    res.json({
      ok: true,
      usedSDK: false,
      tokenPrefix: (token || "").slice(0, 12) + "…",
      tokenLength: token?.length || 0,
      isJWT: !!jwt,
      oauth: uniLastOAuth,
      clocks: { issuedAtISO, expiresAtISO, secondsLeft },
      jwt: jwt
        ? {
            header: jwt.header,
            payload: jwt.payload,
            expFromClaimsISO: jwt.payload?.exp ? new Date(jwt.payload.exp * 1000).toISOString() : null,
          }
        : null,
      graphqlReachable,
      hostName,
    });
  } catch (err) {
    res.status(500).json({ ok: false, usedSDK: false, error: err.message });
  }
});

export default router;
