// server/src/schedulers/tunesNoon.scheduler.js
import cron from "node-cron";
import { fetchTunesAtNoonEvents } from "../services/tunes/sheetService.js";

function isSameYMD(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate()
  );
}

export function scheduleTunesNoon({ admin, adminInitialized }) {
  async function sendTunesNoonIfToday() {
    if (!adminInitialized) {
      console.warn("[push] admin not initialized; skip");
      return;
    }

    try {
      const events = await fetchTunesAtNoonEvents();
      const now = new Date();

      const todayISO = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
      const todayUTC = new Date(`${todayISO}T00:00:00Z`);

      const todays = events.filter((e) => e.startsAt && isSameYMD(e.startsAt, todayUTC));
      if (!todays.length) return;

      todays.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      const pick = todays[0];
      const artist =
        pick.tunesArtist ||
        pick.description?.replace(/^Performing artist:\s*/i, "") ||
        "today’s artist";

      const msg = {
        topic: "tunes-noon",
        notification: { title: "🎶 Tunes @ Noon today", body: `Don't forget: ${artist} at 12:00 PM` },
        data: { route: "/listen-in", artist, startsAt: pick.startsAt },
        android: { priority: "high", notification: { channelId: "default" } },
        apns: { headers: { "apns-priority": "10" } },
      };

      await admin.messaging().send(msg);
      console.log("✅ Sent Tunes @ Noon notification:", artist);
    } catch (e) {
      console.warn("[push] scheduler error:", e?.message || e);
    }
  }

  cron.schedule("15 11 * * *", sendTunesNoonIfToday, { timezone: "America/Chicago" });
  console.log("⏰ Scheduled Tunes @ Noon notifier for 11:15 AM America/Chicago");
}
