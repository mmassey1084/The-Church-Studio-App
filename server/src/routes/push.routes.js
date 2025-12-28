// server/src/routes/push.routes.js
import { Router } from "express";

export function buildPushRoutes({ admin, adminInitialized }) {
  const router = Router();
  const deviceTokens = new Set();

  router.post("/register", async (req, res) => {
    try {
      if (!adminInitialized) return res.status(500).json({ error: "Push not configured" });

      const { token, platform } = req.body || {};
      if (!token) return res.status(400).json({ error: "token required" });

      deviceTokens.add(token);
      try {
        await admin.messaging().subscribeToTopic([token], "tunes-noon");
      } catch (e) {
        console.warn("[push] subscribeToTopic failed:", e?.message || e);
      }

      return res.json({ ok: true, count: deviceTokens.size, platform: platform || "unknown" });
    } catch (e) {
      return res.status(500).json({ error: e?.message || String(e) });
    }
  });

  router.post("/test", async (req, res) => {
    try {
      if (!adminInitialized) return res.status(500).json({ error: "Push not configured" });

      const { token, title = "Test Push", body = "Hello from Church Studio", route = "/listen-in" } = req.body || {};

      const msg = {
        notification: { title, body },
        data: { route },
        ...(token ? { token } : { topic: "tunes-noon" }),
        android: { priority: "high" },
        apns: { headers: { "apns-priority": "10" } },
      };

      const id = await admin.messaging().send(msg);
      return res.json({ ok: true, id, targeted: token ? "token" : "topic" });
    } catch (e) {
      return res.status(500).json({ error: e?.message || String(e) });
    }
  });

  return router;
}
