// server/src/routes/health.routes.js
import { Router } from "express";
const router = Router();

const BOOT_TIME = new Date().toISOString();

router.get("/", (_req, res) => res.send("✅ Church Studio API is running…"));
router.get("/_health", (_req, res) => res.json({ ok: true, now: new Date().toISOString() }));
router.get("/_whoami", (req, res) => {
  res.json({
    pid: process.pid,
    boot: BOOT_TIME,
    host: process.env.HOSTNAME || "local",
    url: req.originalUrl,
  });
});

export default router;
