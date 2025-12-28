// server/src/routes/events.routes.js
import { Router } from "express";
import { getUniverseOccurrences } from "../services/universe/occurrencesService.js";
import { isSameDayInTZ } from "../utils/time.js";

const router = Router();

router.get("/today", async (req, res) => {
  try {
    const tz = (req.query.tz || "America/Chicago").trim();
    const today = new Date();

    const all = await getUniverseOccurrences();

    const sameDay = all
      .filter((e) => e.startsAt && isSameDayInTZ(e.startsAt, today, tz))
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    if (sameDay.length) {
      return res.json({ events: sameDay, count: sameDay.length, note: "events-today", source: "fetch-or-cache" });
    }

    const upcoming = all
      .filter((e) => e.startsAt && new Date(e.startsAt) >= new Date())
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 5);

    return res.json({
      events: upcoming,
      count: upcoming.length,
      note: upcoming.length ? "no-events-today-fallback-upcoming" : "no-events-today",
      source: "fetch-or-cache",
    });
  } catch (err) {
    console.error("/api/events/today error:", err);
    return res.status(500).json({ error: "Server Error", details: { message: err.message } });
  }
});

router.get("/day", async (req, res) => {
  try {
    const tz = (req.query.tz || "America/Chicago").trim();
    const qDate = (req.query.date || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
      return res.status(400).json({ error: "Bad date, expected YYYY-MM-DD" });
    }

    const [y, m, d] = qDate.split("-").map(Number);
    const target = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    const all = await getUniverseOccurrences();
    const events = all
      .filter((e) => e.startsAt)
      .filter((e) => isSameDayInTZ(e.startsAt, target, tz))
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    return res.json({
      events,
      count: events.length,
      note: events.length ? "events-day" : "no-events-today",
      source: "fetch-or-cache",
    });
  } catch (err) {
    console.error("/api/events/day error:", err);
    return res.status(500).json({ error: "Server Error", details: { message: err.message } });
  }
});

export default router;
