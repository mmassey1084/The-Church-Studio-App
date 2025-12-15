import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, TZ, getEventsForDay, whoAmI } from "../lib/eventsApi";

/* --------------------------- date helpers --------------------------- */
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const fmtISO = (d) => d.toISOString().slice(0, 10);
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* ----------------------- constants / config ------------------------- */
const EVENT_CACHE_NS = "EVENT_CACHE_V1:"; // key prefix per ISO day
const EVENT_TTL_MS = 1000 * 60 * 60; // 1 hour
const PREFETCH_CONCURRENCY = 4; // polite to the API
const ORG_SLUG = "the-church-studio";
const FALLBACK_TOUR = `https://www.universe.com/users/${ORG_SLUG}/events?query=museum%20tour`;
const ENV_TOUR = import.meta.env.VITE_MUSEUM_TOUR_URL;
const MUSEUM_TOUR_URL =
  ENV_TOUR && ENV_TOUR.startsWith("http") ? ENV_TOUR : FALLBACK_TOUR;

// Givebutter (hosted)
const TUNES_DONATE_URL = "https://givebutter.com/duOZoX";

/* ---------------------- tiny localStorage utils --------------------- */
function getCachedDay(iso) {
  try {
    const raw = localStorage.getItem(EVENT_CACHE_NS + iso);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!ts || Date.now() - ts > EVENT_TTL_MS) return null; // expired
    return { data, ts };
  } catch {
    return null;
  }
}
function setCachedDay(iso, data) {
  try {
    localStorage.setItem(
      EVENT_CACHE_NS + iso,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {}
}

/* ---------------------- helpers ---------------------- */
const isTunesAtNoon = (title = "") =>
  title.toLowerCase().includes("tunes @ noon");

/* ------------------------- Child card ------------------------- */
function EventCard({ ev }) {
  const tunes = isTunesAtNoon(ev.title || "");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="grid-card"
    >
      <h3>
        {ev.title}{" "}
        {ev.startsAt &&
          "– " +
            new Date(ev.startsAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
      </h3>
      {ev.description && <p>{ev.description}</p>}
      {ev.location && (
        <p>
          <strong>Location:</strong> {ev.location}
        </p>
      )}

      <div className="cta-row">
        {ev.purchaseUrl && (
          <a
            href={ev.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            Buy Ticket
          </a>
        )}

        {tunes && (
          <a
            className="btn"
            href={TUNES_DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Donate for Ticket
          </a>
        )}
      </div>
    </motion.article>
  );
}

/* ------------------------------ UI --------------------------------- */
export default function EventsCalendar() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(startOfMonth(today));
  const [selected, setSelected] = useState(today);
  const [events, setEvents] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [freshState, setFreshState] = useState("fresh"); // 'cached' | 'fresh'

  // Diagnose which API we’re hitting
  useEffect(() => {
    (async () => {
      try {
        const info = await whoAmI();
        console.log("[Calendar] whoami:", info, "API_BASE:", API_BASE);
      } catch (e) {
        console.log("[Calendar] whoami failed:", e?.message || e);
      }
    })();
  }, []);

  // Build the visible weeks grid for the month
  const weeks = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);

    const firstWeekStart = new Date(start);
    firstWeekStart.setDate(firstWeekStart.getDate() - firstWeekStart.getDay());

    const lastWeekEnd = new Date(end);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + (6 - lastWeekEnd.getDay()));

    const days = [];
    for (
      let d = new Date(firstWeekStart);
      d <= lastWeekEnd;
      d.setDate(d.getDate() + 1)
    ) {
      days.push(new Date(d));
    }
    const chunks = [];
    for (let i = 0; i < days.length; i += 7) chunks.push(days.slice(i, i + 7));
    return chunks;
  }, [cursor]);

  // Load selected day
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const iso = fmtISO(selected);

      const cached = getCachedDay(iso);
      if (cached?.data) {
        setEvents(Array.isArray(cached.data.events) ? cached.data.events : []);
        setNote(typeof cached.data.note === "string" ? cached.data.note : "");
        setFreshState("cached");
      }

      try {
        setLoading(!cached);
        setError("");
        const fresh = await getEventsForDay(iso, TZ);
        if (!cancelled) {
          setEvents(Array.isArray(fresh.events) ? fresh.events : []);
          setNote(typeof fresh.note === "string" ? fresh.note : "");
          setFreshState("fresh");
        }
        setCachedDay(iso, fresh);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Prefetch visible month
  useEffect(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    const run = () => prefetchDays(days.map(fmtISO));
    const id =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(run, { timeout: 1200 })
        : setTimeout(run, 300);
    return () => {
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [cursor]);

  async function prefetchDays(isoDays) {
    const want = isoDays.filter((iso) => !getCachedDay(iso));
    if (!want.length) return;

    let i = 0;
    async function worker() {
      while (i < want.length) {
        const iso = want[i++];
        try {
          const data = await getEventsForDay(iso, TZ);
          setCachedDay(iso, data);
        } catch {
          // ignore prefetch errors
        }
      }
    }
    await Promise.all(Array.from({ length: PREFETCH_CONCURRENCY }, worker));
  }

  const selectedIsSunday = selected.getDay() === 0; // 0 = Sun

  return (
    <motion.main
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <h2 className="page-title">Events</h2>

      <section className="section">
        <article className="grid-card">
          <div
            className="flex"
            style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <button
              className="btn-ghost"
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
                )
              }
              aria-label="Previous month"
            >
              ‹ Prev
            </button>
            <h3 style={{ margin: 0 }}>
              {cursor.toLocaleDateString([], {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              className="btn-ghost"
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
                )
              }
              aria-label="Next month"
            >
              Next ›
            </button>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "6px",
              marginTop: "12px",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                {d}
              </div>
            ))}
            {weeks.flat().map((d) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = sameDay(d, today);
              const isSelected = sameDay(d, selected);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelected(new Date(d))}
                  className="grid-card"
                  style={{
                    padding: "12px 10px",
                    textAlign: "center",
                    borderRadius: "10px",
                    opacity: inMonth ? 1 : 0.45,
                    outline: isSelected ? "2px solid #658D1B" : "none",
                    background: isToday ? "rgba(101,141,27,0.10)" : undefined,
                  }}
                  aria-pressed={isSelected}
                  aria-label={d.toDateString()}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-ghost"
              onClick={() => {
                setCursor(startOfMonth(today));
                setSelected(today);
              }}
            >
              Today
            </button>
            <button
              className="btn-ghost"
              onClick={() =>
                setSelected(
                  new Date(cursor.getFullYear(), cursor.getMonth(), 1)
                )
              }
            >
              First of month
            </button>
          </div>
        </article>
      </section>

      <section className="section">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0 }}>
            {selected.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <span
            role="status"
            aria-live="polite"
            className={`badge ${
              freshState === "fresh" ? "badge-ok" : "badge-warn"
            }`}
            title={
              freshState === "fresh"
                ? "Data was just updated."
                : "Showing cached data while refreshing."
            }
          >
            {freshState === "fresh" ? "updated just now" : "cached data"}
          </span>
        </div>

        {error && (
          <p style={{ color: "red", whiteSpace: "pre-wrap" }}>Error: {error}</p>
        )}

        {/* Skeletons while loading and no cache */}
        <AnimatePresence initial={false} mode="popLayout">
          {loading && events.length === 0 && !error && (
            <motion.div
              key="event-skeletons"
              className="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="grid-card skeleton-card"
                  aria-hidden="true"
                >
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "60%", height: 20 }}
                  />
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "100%", height: 12 }}
                  />
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "90%", height: 12 }}
                  />
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "40%", height: 12 }}
                  />
                  <div
                    className="skeleton btn-skeleton"
                    style={{ width: 120, height: 40, marginTop: 10 }}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && !error && events.length === 0 && (
          <p>No events scheduled for this day.</p>
        )}

        <div className="grid">
          <AnimatePresence>
            {events.map((ev) => (
              <EventCard ev={ev} key={ev.id} />
            ))}
          </AnimatePresence>
        </div>

        {/* Always show Museum Tour CTA every day EXCEPT Sundays */}
        {!selectedIsSunday && (
          <article className="empty-cta" style={{ marginTop: "14px" }}>
            <div className="empty-copy">
              <h3>Buy Museum Tour Tickets</h3>
              <p>Guided tours run most days. Walk-ins welcome.</p>
            </div>
            <a
              href={MUSEUM_TOUR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              aria-label="Buy Museum Tour Tickets (opens in a new tab)"
            >
              Buy Museum Tour Tickets
            </a>
          </article>
        )}

        <div style={{ marginTop: "1rem" }}>
          <Link className="btn-ghost" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </motion.main>
  );
}
